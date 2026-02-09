import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/secrets';
import { AppError } from '../lib/AppError';

const ALLOWED_ROLES = new Set(['CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN']);

type AccessReason =
  | 'PROFILE_ACTIVE'
  | 'INVITE_APPROVED_PENDING_REGISTRATION'
  | 'INVITE_ALREADY_USED'
  | 'INVITE_PENDING_APPROVAL'
  | 'EMAIL_BLOCKED'
  | 'EMAIL_NOT_AUTHORIZED'
  | 'REGISTRATION_INCOMPLETE';

type AccountState =
  | 'ACTIVE'
  | 'INVITE_PENDING_REGISTRATION'
  | 'INCOMPLETE_REGISTRATION'
  | 'BLOCKED'
  | 'PENDING_APPROVAL'
  | 'NOT_AUTHORIZED'
  | 'INVITE_USED_NO_PROFILE';

type NextAction =
  | 'LOGIN'
  | 'REGISTER'
  | 'COMPLETE_REGISTRATION'
  | 'REQUEST_INVITE'
  | 'WAIT_APPROVAL'
  | 'CONTACT_SUPPORT';

export type AuthorizationStatus = {
  canLogin: boolean;
  canRegister: boolean;
  role: string | null;
  roles: string[];
  reason: AccessReason;
  accountState: AccountState;
  nextAction: NextAction;
};

const ALLOWLIST_REGISTER_STATUSES = new Set(['APPROVED', 'ACTIVE']);
const ALLOWLIST_BLOCKED_STATUSES = new Set(['BLOCKED', 'REVOKED']);
const ALLOWLIST_PENDING_STATUSES = new Set(['PENDING']);

const normalizeAllowlistStatus = (status?: string | null) => String(status || '').trim().toUpperCase();
const normalizeRole = (role?: string | null): string | null => {
  const normalized = String(role || '').trim().toUpperCase();
  if (!normalized) return null;
  return ALLOWED_ROLES.has(normalized) ? normalized : null;
};

const normalizeRoleList = (roles: Array<string | null | undefined>): string[] => {
  const output: string[] = [];
  for (const role of roles) {
    const normalized = normalizeRole(role);
    if (normalized && !output.includes(normalized)) output.push(normalized);
  }
  return output;
};

const defaultRole = (role?: string | null) => normalizeRole(role) || 'CLIENT';

export class AuthService {
  private static async getRolesByProfile(profileId: string, fallbackRole?: string | null): Promise<string[]> {
    const roles = await prisma.profileRole.findMany({
      where: { profile_id: profileId },
      select: { role: true },
      orderBy: { created_at: 'asc' },
    });

    const fromTable = normalizeRoleList(roles.map((item) => item.role));
    if (fromTable.length > 0) return fromTable;

    const legacy = normalizeRoleList([fallbackRole]);
    if (legacy.length > 0) {
      await prisma.profileRole.create({
        data: {
          profile_id: profileId,
          role: legacy[0],
        },
      }).catch(() => null);
      return legacy;
    }

    return ['CLIENT'];
  }

  private static async getActiveRole(profile: { id: string; role: string | null; active_role?: string | null }): Promise<string> {
    const roles = await AuthService.getRolesByProfile(profile.id, profile.role);
    const active = normalizeRole(profile.active_role || profile.role);
    if (active && roles.includes(active)) return active;

    const first = roles[0] || 'CLIENT';
    await prisma.profile.update({
      where: { id: profile.id },
      data: { active_role: first },
    }).catch(() => null);
    return first;
  }

  static async register(email: string, password: string, name: string, role: string = 'CLIENT') {
    const normalizedEmail = email.trim().toLowerCase();
    const authorization = await AuthService.getAuthorizationStatus(normalizedEmail);

    if (!authorization.canRegister) {
      throw new AppError(
        'Cadastro indisponível para este e-mail. Solicite convite.',
        403,
        'EMAIL_NOT_AUTHORIZED',
        true,
        { reason: authorization.reason }
      );
    }

    const requestedRole = normalizeRole(role);
    const preferredRole = requestedRole || normalizeRole(authorization.role) || 'CLIENT';
    const finalRole = defaultRole(preferredRole);

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: {
          include: { profile_roles: true },
        },
      },
    });

    const hashedPassword = (await bcrypt.hash(password, 10)).replace(/^\$2b\$/, '$2a$');

    if (existing?.profile) {
      const existingRoles = await AuthService.getRolesByProfile(existing.profile.id, existing.profile.role);
      if (existingRoles.includes(finalRole)) {
        throw new AppError(
          'Este perfil já existe neste e-mail.',
          409,
          'ROLE_ALREADY_ACTIVE'
        );
      }

      if (!existing.encrypted_password) {
        throw new AppError(
          'Este e-mail já está cadastrado. Entre com ele para adicionar um novo perfil.',
          409,
          'EMAIL_ALREADY_EXISTS'
        );
      }

      const validPassword = await bcrypt.compare(password, existing.encrypted_password);
      if (!validPassword) {
        throw new AppError(
          'Este e-mail já está cadastrado. Entre com ele ou use outro.',
          409,
          'EMAIL_ALREADY_EXISTS'
        );
      }

      await prisma.profileRole.upsert({
        where: {
          profile_id_role: {
            profile_id: existing.id,
            role: finalRole,
          },
        },
        create: {
          profile_id: existing.id,
          role: finalRole,
        },
        update: {},
      });

      await prisma.profile.update({
        where: { id: existing.id },
        data: {
          active_role: finalRole,
          role: finalRole,
        },
      });

      return AuthService.generateSession({
        id: existing.id,
        email: normalizedEmail,
        profile: {
          ...existing.profile,
          role: finalRole,
          active_role: finalRole,
        },
      });
    }

    if (existing && !existing.profile) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          encrypted_password: hashedPassword,
          email_confirmed_at: new Date(),
          raw_user_meta_data: {
            ...(typeof existing.raw_user_meta_data === 'object' && existing.raw_user_meta_data ? existing.raw_user_meta_data as Record<string, unknown> : {}),
            full_name: name,
            role: finalRole,
          },
        },
      });

      const profile = await prisma.profile.create({
        data: {
          id: existing.id,
          email: normalizedEmail,
          name,
          role: finalRole,
          active_role: finalRole,
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${existing.id}`,
          personal_balance: 1000,
          multiplier: 1,
        },
      });

      await prisma.profileRole.upsert({
        where: {
          profile_id_role: {
            profile_id: existing.id,
            role: finalRole,
          },
        },
        create: {
          profile_id: existing.id,
          role: finalRole,
        },
        update: {},
      });

      await AuthService.markAllowlistAsUsed(normalizedEmail, existing.id);

      return AuthService.generateSession({
        id: existing.id,
        email: normalizedEmail,
        profile: {
          ...profile,
          profile_roles: [{ role: finalRole }],
        },
      });
    }

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

    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email: normalizedEmail,
        name,
        role: finalRole,
        active_role: finalRole,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`,
        personal_balance: 1000,
        multiplier: 1,
      },
    });

    await prisma.profileRole.create({
      data: {
        profile_id: userId,
        role: finalRole,
      },
    });

    await AuthService.markAllowlistAsUsed(normalizedEmail, userId);

    return AuthService.generateSession({
      id: userId,
      email: normalizedEmail,
      profile: {
        ...profile,
        profile_roles: [{ role: finalRole }],
      },
    });
  }

  static async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const authorization = await AuthService.getAuthorizationStatus(normalizedEmail);
    if (!authorization.canLogin) {
      const code = authorization.reason === 'REGISTRATION_INCOMPLETE'
        ? 'REGISTRATION_INCOMPLETE'
        : 'EMAIL_NOT_AUTHORIZED';
      throw new AppError('Conta não autorizada para login.', 401, code, true, { reason: authorization.reason });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: {
          include: { profile_roles: true },
        },
      },
    });
    if (!user || !user.encrypted_password) {
      throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await bcrypt.compare(password, user.encrypted_password);
    if (!isValid) {
      throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
    }

    return AuthService.generateSession(user);
  }

  private static async generateSession(user: any) {
    const profile = user.profile || null;
    const roles = profile?.id
      ? await AuthService.getRolesByProfile(profile.id, profile.role)
      : normalizeRoleList([user.role]).concat('CLIENT').slice(0, 1);

    const activeRole = profile?.id
      ? await AuthService.getActiveRole(profile)
      : defaultRole(user.role);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: activeRole,
        activeRole,
        roles,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: activeRole,
        activeRole,
        roles,
      },
      session: {
        access_token: token,
        refresh_token: 'mock-refresh-token',
      }
    };
  }

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
      select: { id: true, email: true, name: true, role: true, active_role: true },
    });
  }

  static async canLoginWithEmail(email: string) {
    const status = await AuthService.getAuthorizationStatus(email);
    return status.canLogin;
  }

  static async getAuthorizationStatus(email: string): Promise<AuthorizationStatus> {
    const normalizedEmail = email.trim().toLowerCase();
    const [profile, allowlist, authUser] = await Promise.all([
      prisma.profile.findFirst({
        where: { email: normalizedEmail },
        select: { id: true, role: true, active_role: true },
      }),
      prisma.authAllowlist.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, role: true, status: true, used_by: true },
      }),
      prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, raw_user_meta_data: true },
      }),
    ]);

    const allowlistStatus = normalizeAllowlistStatus(allowlist?.status);
    const allowlistRole = normalizeRole(allowlist?.role);

    if (ALLOWLIST_BLOCKED_STATUSES.has(allowlistStatus)) {
      return {
        canLogin: false,
        canRegister: false,
        role: allowlistRole,
        roles: allowlistRole ? [allowlistRole] : [],
        reason: 'EMAIL_BLOCKED',
        accountState: 'BLOCKED',
        nextAction: 'CONTACT_SUPPORT',
      };
    }

    if (profile) {
      const roles = await AuthService.getRolesByProfile(profile.id, profile.role);
      const activeRole = normalizeRole(profile.active_role || profile.role) || roles[0] || 'CLIENT';
      return {
        canLogin: true,
        canRegister: false,
        role: activeRole,
        roles,
        reason: 'PROFILE_ACTIVE',
        accountState: 'ACTIVE',
        nextAction: 'LOGIN',
      };
    }

    if (authUser) {
      const canCompleteOrphan = !!allowlist
        && ALLOWLIST_REGISTER_STATUSES.has(allowlistStatus)
        && (!allowlist.used_by || allowlist.used_by === authUser.id);

      if (!canCompleteOrphan) {
        return {
          canLogin: false,
          canRegister: false,
          role: allowlistRole,
          roles: allowlistRole ? [allowlistRole] : [],
          reason: 'EMAIL_NOT_AUTHORIZED',
          accountState: 'NOT_AUTHORIZED',
          nextAction: 'REQUEST_INVITE',
        };
      }

      const metadata = typeof authUser.raw_user_meta_data === 'object' && authUser.raw_user_meta_data
        ? authUser.raw_user_meta_data as Record<string, unknown>
        : {};
      const metadataRole = normalizeRole(String(metadata.role || ''));
      const role = metadataRole || allowlistRole || 'CLIENT';

      return {
        canLogin: false,
        canRegister: true,
        role,
        roles: [role],
        reason: 'REGISTRATION_INCOMPLETE',
        accountState: 'INCOMPLETE_REGISTRATION',
        nextAction: 'COMPLETE_REGISTRATION',
      };
    }

    if (allowlist && ALLOWLIST_REGISTER_STATUSES.has(allowlistStatus) && !allowlist.used_by) {
      return {
        canLogin: false,
        canRegister: true,
        role: allowlistRole,
        roles: allowlistRole ? [allowlistRole] : [],
        reason: 'INVITE_APPROVED_PENDING_REGISTRATION',
        accountState: 'INVITE_PENDING_REGISTRATION',
        nextAction: 'REGISTER',
      };
    }

    if (allowlist?.used_by) {
      return {
        canLogin: false,
        canRegister: false,
        role: allowlistRole,
        roles: allowlistRole ? [allowlistRole] : [],
        reason: 'INVITE_ALREADY_USED',
        accountState: 'INVITE_USED_NO_PROFILE',
        nextAction: 'CONTACT_SUPPORT',
      };
    }

    if (ALLOWLIST_PENDING_STATUSES.has(allowlistStatus)) {
      return {
        canLogin: false,
        canRegister: false,
        role: allowlistRole,
        roles: allowlistRole ? [allowlistRole] : [],
        reason: 'INVITE_PENDING_APPROVAL',
        accountState: 'PENDING_APPROVAL',
        nextAction: 'WAIT_APPROVAL',
      };
    }

    return {
      canLogin: false,
      canRegister: false,
      role: allowlistRole,
      roles: allowlistRole ? [allowlistRole] : [],
      reason: 'EMAIL_NOT_AUTHORIZED',
      accountState: 'NOT_AUTHORIZED',
      nextAction: 'REQUEST_INVITE',
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

  static async listRolesForUser(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, role: true, active_role: true },
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado.', 404, 'PROFILE_NOT_FOUND');
    }

    const roles = await AuthService.getRolesByProfile(userId, profile.role);
    const activeRole = normalizeRole(profile.active_role || profile.role) || roles[0] || 'CLIENT';

    return {
      userId,
      roles,
      activeRole,
    };
  }

  static async selectActiveRole(userId: string, requestedRole: string) {
    const role = defaultRole(requestedRole);
    const current = await AuthService.listRolesForUser(userId);

    if (!current.roles.includes(role)) {
      throw new AppError('Perfil solicitado não está disponível para esta conta.', 404, 'ROLE_NOT_AVAILABLE');
    }

    await prisma.profile.update({
      where: { id: userId },
      data: { active_role: role, role },
    });

    return {
      userId,
      roles: current.roles,
      activeRole: role,
    };
  }

  static async addRole(userId: string, requestedRole: string) {
    const role = defaultRole(requestedRole);
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, role: true, active_role: true },
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado.', 404, 'PROFILE_NOT_FOUND');
    }

    const roles = await AuthService.getRolesByProfile(userId, profile.role);
    if (roles.includes(role)) {
      throw new AppError('Este perfil já existe neste e-mail.', 409, 'ROLE_ALREADY_ACTIVE');
    }

    await prisma.profileRole.create({
      data: {
        profile_id: userId,
        role,
      },
    });

    if (!normalizeRole(profile.active_role)) {
      await prisma.profile.update({
        where: { id: userId },
        data: { active_role: role, role },
      });
      return {
        userId,
        roles: [...roles, role],
        activeRole: role,
      };
    }

    return {
      userId,
      roles: [...roles, role],
      activeRole: normalizeRole(profile.active_role) || role,
    };
  }
}
