import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/secrets';
import { AppError } from '../lib/AppError';

type AccessReason =
  | 'PROFILE_ACTIVE'
  | 'INVITE_APPROVED_PENDING_REGISTRATION'
  | 'INVITE_ALREADY_USED'
  | 'INVITE_PENDING_APPROVAL'
  | 'EMAIL_BLOCKED'
  | 'EMAIL_NOT_AUTHORIZED';

export type AuthorizationStatus = {
  canLogin: boolean;
  canRegister: boolean;
  role: string | null;
  reason: AccessReason;
};

const ALLOWLIST_REGISTER_STATUSES = new Set(['APPROVED', 'ACTIVE']);
const ALLOWLIST_BLOCKED_STATUSES = new Set(['BLOCKED', 'REVOKED']);
const ALLOWLIST_PENDING_STATUSES = new Set(['PENDING']);

const normalizeAllowlistStatus = (status?: string | null) => String(status || '').trim().toUpperCase();

export class AuthService {
  
  // Register new user (creates Auth User + Profile via Trigger or manual)
  static async register(email: string, password: string, name: string, role: string = 'CLIENT') {
    const normalizedEmail = email.trim().toLowerCase();
    const authorization = await AuthService.getAuthorizationStatus(normalizedEmail);
    if (!authorization.canRegister) {
      throw new AppError('Cadastro indisponível para este e-mail. Solicite convite.', 403);
    }

    const normalizedRole = String(authorization.role || role || 'CLIENT').trim().toUpperCase();
    const allowedRoles = new Set(['CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN']);
    const finalRole = allowedRoles.has(normalizedRole) ? normalizedRole : 'CLIENT';

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new AppError('User already exists', 409);

    const hashedPassword = (await bcrypt.hash(password, 10)).replace(/^\$2b\$/, '$2a$');

    // Create the Auth user row directly to avoid GoTrue email rate limits/confirmation issues.
    // The API layer in this repo uses the DB as the source of truth for email/password auth.
    const authUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        encrypted_password: hashedPassword,
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date(),
        raw_app_meta_data: {
          provider: 'email',
          providers: ['email'],
        },
        raw_user_meta_data: {
          full_name: name,
          role: finalRole,
        },
      },
    });

    const userId = authUser.id;

    // 2. Create Profile in Prisma (linked to Auth User)
    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email: normalizedEmail,
        name: name,
        role: finalRole,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`,
        personal_balance: 1000,
        multiplier: 1,
      }
    });

    await AuthService.markAllowlistAsUsed(normalizedEmail, userId);

    // Handle manual hash update if needed (Supabase SDK doesn't allow setting encrypted_password directly, 
    // but it hashes it correctly. We only need the prefix fix if we were inserting manually. 
    // Since we use signUp, it's already correct).
    
    return AuthService.generateSession({ id: userId, email: normalizedEmail, profile });
  }

  // Login
  static async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const authorization = await AuthService.getAuthorizationStatus(normalizedEmail);
    if (!authorization.canLogin) {
      throw new AppError('Conta não autorizada para login.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });
    if (!user || !user.encrypted_password) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(password, user.encrypted_password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    return AuthService.generateSession(user);
  }

  // Helper: Generate Session Response
  private static generateSession(user: any) {
    const allowedRoles = new Set(['CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN']);
    const candidate = String(user.profile?.role || user.role || 'CLIENT').trim().toUpperCase();
    const role = allowedRoles.has(candidate) ? candidate : 'CLIENT';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role,
      },
      session: {
        access_token: token,
        refresh_token: 'mock-refresh-token', // Not implementing refresh flow heavily for stress test
      }
    };
  }

  // Update Password
  static async updatePassword(email: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return prisma.user.update({
      where: { email },
      data: { encrypted_password: hashedPassword }
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  static async getAuthorizedProfileByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return prisma.profile.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  static async canLoginWithEmail(email: string) {
    const status = await AuthService.getAuthorizationStatus(email);
    return status.canLogin;
  }

  static async getAuthorizationStatus(email: string): Promise<AuthorizationStatus> {
    const normalizedEmail = email.trim().toLowerCase();
    const [profile, allowlist] = await Promise.all([
      prisma.profile.findFirst({
        where: { email: normalizedEmail },
        select: { id: true, role: true },
      }),
      prisma.authAllowlist.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, role: true, status: true, used_by: true },
      }),
    ]);

    const allowlistStatus = normalizeAllowlistStatus(allowlist?.status);
    const allowlistRole = allowlist?.role ? String(allowlist.role).trim().toUpperCase() : null;
    const profileRole = profile?.role ? String(profile.role).trim().toUpperCase() : null;

    if (ALLOWLIST_BLOCKED_STATUSES.has(allowlistStatus)) {
      return {
        canLogin: false,
        canRegister: false,
        role: allowlistRole,
        reason: 'EMAIL_BLOCKED',
      };
    }

    if (profile) {
      return {
        canLogin: true,
        canRegister: false,
        role: profileRole || allowlistRole,
        reason: 'PROFILE_ACTIVE',
      };
    }

    if (allowlist && ALLOWLIST_REGISTER_STATUSES.has(allowlistStatus) && !allowlist.used_by) {
      return {
        canLogin: false,
        canRegister: true,
        role: allowlistRole,
        reason: 'INVITE_APPROVED_PENDING_REGISTRATION',
      };
    }

    if (allowlist?.used_by) {
      return {
        canLogin: false,
        canRegister: false,
        role: allowlistRole,
        reason: 'INVITE_ALREADY_USED',
      };
    }

    if (ALLOWLIST_PENDING_STATUSES.has(allowlistStatus)) {
      return {
        canLogin: false,
        canRegister: false,
        role: allowlistRole,
        reason: 'INVITE_PENDING_APPROVAL',
      };
    }

    return {
      canLogin: false,
      canRegister: false,
      role: allowlistRole,
      reason: 'EMAIL_NOT_AUTHORIZED',
    };
  }

  static async markAllowlistAsUsed(email: string, userId: string) {
    const normalizedEmail = email.trim().toLowerCase();
    await prisma.authAllowlist.updateMany({
      where: { email: normalizedEmail },
      data: {
        used_by: userId,
        used_at: new Date(),
        status: 'USED',
      },
    });
  }
}
