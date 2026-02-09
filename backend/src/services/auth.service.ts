import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/secrets';
import { AppError } from '../lib/AppError';

export class AuthService {
  
  // Register new user (creates Auth User + Profile via Trigger or manual)
  static async register(email: string, password: string, name: string, role: string = 'CLIENT') {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = String(role || 'CLIENT').trim().toUpperCase();
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

    // Handle manual hash update if needed (Supabase SDK doesn't allow setting encrypted_password directly, 
    // but it hashes it correctly. We only need the prefix fix if we were inserting manually. 
    // Since we use signUp, it's already correct).
    
    return AuthService.generateSession({ id: userId, email: normalizedEmail, profile });
  }

  // Login
  static async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
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
    const profile = await AuthService.getAuthorizedProfileByEmail(email);
    return !!profile;
  }
}
