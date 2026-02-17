import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/secrets';
import { AppError } from '../lib/AppError';
import { supabaseAdmin, supabase } from './supabase.service';
import { logger } from '../lib/logger';

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
const isSafeFallbackRuntime = () =>
  process.env.NODE_ENV === 'test' || String(process.env.APP_MODE || '').toUpperCase() === 'MOCK';
const isDbUnavailableError = (error: any) => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return ['P1000', 'P1001', 'P1002', 'P1017'].includes(code)
    || /authentication failed against database server/i.test(message)
    || /circuit breaker open/i.test(message)
    || /too many authentication errors/i.test(message);
};
const inferRoleFromIdentity = (input?: string | null): string => {
  const normalized = String(input || '').trim().toLowerCase();
  if (normalized.includes('admin')) return 'ADMIN';
  if (normalized.startsWith('pro') || normalized.includes('guard')) return 'PROFESSIONAL';
  if (normalized.startsWith('space') || normalized.includes('hub') || normalized.includes('santuario')) return 'SPACE';
  return 'CLIENT';
};

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
    logger.debug('auth.register_authorization_check', { email });
    const normalizedEmail = email.trim().toLowerCase();
    
    let authorization;
    try {
        authorization = await AuthService.getAuthorizationStatus(normalizedEmail);
        logger.debug('auth.register_authorization_status', { email: normalizedEmail, authorization });
    } catch (err: any) {
        logger.error('auth.register_authorization_failed', err);
        throw new AppError(`Erro interno ao verificar autorização: ${err.message}`, 500);
    }

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

    logger.debug('auth.register_check_existing', { email: normalizedEmail });
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: {
          include: { profile_roles: true },
        },
      },
    }).catch(err => {
        logger.error('auth.register_user_lookup_failed', err);
        throw new AppError(`Erro de banco de dados (User Check): ${err.message}`, 500);
    });

    if (existing?.profile) {
      logger.debug('auth.register_user_exists_with_profile', { email: normalizedEmail, userId: existing.id });
      const existingRoles = await AuthService.getRolesByProfile(existing.profile.id, existing.profile.role);
      if (existingRoles.includes(finalRole)) {
        throw new AppError(
          'Este perfil já existe neste e-mail.',
          409,
          'ROLE_ALREADY_ACTIVE'
        );
      }

      if (existing.encrypted_password) {
        const validPassword = await bcrypt.compare(password, existing.encrypted_password);
        if (!validPassword) {
           throw new AppError('Este e-mail já está cadastrado. Entre com ele ou use outro.', 409, 'EMAIL_ALREADY_EXISTS');
        }
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

    let userId: string;

    if (existing && !existing.profile) {
      console.log('[AuthService] Orphan user found, updating credentials via Supabase Admin...');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: password,
        email_confirm: true,
        user_metadata: { full_name: name, role: finalRole }
      });

      if (updateError) {
        console.error('[AuthService] Supabase updateUserById failed:', updateError);
        throw new AppError(`Erro ao atualizar credenciais: ${updateError.message}`, 500, 'AUTH_UPDATE_FAILED');
      }
      
      userId = existing.id;
    } else {
      console.log('[AuthService] Creating new user via Supabase Admin SDK...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: name, role: finalRole }
      });

      if (authError) {
        console.error('[AuthService] Supabase createUser failed:', authError);
        if (authError.message.includes('already registered')) {
            throw new AppError('Este e-mail já está em uso.', 409, 'EMAIL_ALREADY_EXISTS');
        }
        throw new AppError(`Erro no cadastro (Supabase): ${authError.message}`, 500, 'AUTH_PROVIDER_ERROR');
      }

      if (!authData.user) {
        console.error('[AuthService] Supabase returned no user object');
        throw new AppError('Falha ao criar conta de usuário.', 500, 'AUTH_USER_CREATION_FAILED');
      }

      userId = authData.user.id;
      console.log('[AuthService] User created with ID:', userId);
    }

    console.log('[AuthService] Creating Profile in database...');
    try {
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
        console.log('[AuthService] Profile created.');

        await prisma.profileRole.upsert({
        where: {
            profile_id_role: {
            profile_id: userId,
            role: finalRole,
            },
        },
        create: {
            profile_id: userId,
            role: finalRole,
        },
        update: {},
        });
        
        await AuthService.markAllowlistAsUsed(normalizedEmail, userId);

        console.log('[AuthService] Generating session...');
        return AuthService.generateSession({
        id: userId,
        email: normalizedEmail,
        profile: {
            ...profile,
            profile_roles: [{ role: finalRole }],
        },
        });
    } catch (dbError: any) {
        console.error('[AuthService] Database profile creation failed:', dbError);
        // Clean up user from Supabase if profile creation fails? maybe later.
        throw new AppError(`Erro ao criar perfil no banco de dados: ${dbError.message}`, 500, 'DB_ERROR');
    }
  }

  static async login(email: string, password: string) {
    console.log('[AuthService] Login attempt for:', email);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: {
          include: { profile_roles: true },
        },
      },
    }).catch(err => {
        console.error('[AuthService] Login Prisma findUnique error:', err);
        throw new AppError(`Erro de conexão com banco de dados: ${err.message}`, 500);
    });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (authError || !authData.user) {
      console.warn('[AuthService] Supabase native login failed:', authError?.message);
      // Fallback for VERY old users that might only be in Prisma but not Supabase Auth
      // (Though my repair script should have fixed this)
      if (user.encrypted_password) {
        const isValidManual = await bcrypt.compare(password, user.encrypted_password);
        if (isValidManual) {
           console.log('[AuthService] Valid manual bcrypt fallback. User likely missing in Supabase Auth but exists in Prisma.');
        } else {
           throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
        }
      } else {
        throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
      }
    }
    
    console.log('[AuthService] Credentials verified. Checking profile...');

    // Auto-create profile if user authenticated but profile is missing (incomplete registration)
    if (!user.profile) {
      console.log('[AuthService] Missing profile, auto-creating...');
      const metadata = typeof user.raw_user_meta_data === 'object' && user.raw_user_meta_data
        ? user.raw_user_meta_data as Record<string, unknown>
        : {};
      const metadataRole = normalizeRole(String(metadata.role || ''));
      const finalRole = metadataRole || defaultRole(null);
      const fallbackName = String(metadata.full_name || metadata.name || normalizedEmail.split('@')[0] || 'Viajante');

      try {
          const profile = await prisma.profile.create({
            data: {
              id: user.id,
              email: normalizedEmail,
              name: fallbackName,
              role: finalRole,
              active_role: finalRole,
              avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`,
              personal_balance: 1000,
              multiplier: 1,
            },
          });

          await prisma.profileRole.upsert({
            where: { profile_id_role: { profile_id: user.id, role: finalRole } },
            create: { profile_id: user.id, role: finalRole },
            update: {},
          });

          await AuthService.markAllowlistAsUsed(normalizedEmail, user.id);

          return AuthService.generateSession({
            ...user,
            profile: { ...profile, profile_roles: [{ role: finalRole }] },
          });
      } catch (e: any) {
          console.error('[AuthService] Failed to auto-create profile:', e);
           throw new AppError(`Erro ao criar perfil automático: ${e.message}`, 500);
      }
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
      { expiresIn: '7d' }
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
      // User exists in auth.users but has no profile yet.
      // This happens when: (a) Supabase/Google OAuth created the user, (b) partial registration.
      // DECISION: Always allow registration to complete the profile, regardless of allowlist.
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
        reason: 'REGISTRATION_INCOMPLETE' as AccessReason,
        accountState: 'INCOMPLETE_REGISTRATION' as AccountState,
        nextAction: 'COMPLETE_REGISTRATION' as NextAction,
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

    // DECISÃO DE NEGÓCIO (2026-02-10): Registro aberto.
    // Qualquer email pode se cadastrar mesmo sem estar na allowlist.
    // Quando não há profile, authUser, nem allowlist, o sistema permite registro livre como CLIENT.
    return {
      canLogin: false,
      canRegister: true,
      role: allowlistRole || 'CLIENT',
      roles: allowlistRole ? [allowlistRole] : ['CLIENT'],
      reason: 'INVITE_APPROVED_PENDING_REGISTRATION' as AccessReason,
      accountState: 'INVITE_PENDING_REGISTRATION' as AccountState,
      nextAction: 'REGISTER' as NextAction,
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

  static async listRolesForUser(userId: string, emailHint?: string | null) {
    let profile: { id: string; role: string | null; active_role: string | null } | null = null;
    try {
      profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { id: true, role: true, active_role: true },
      });
    } catch (error) {
      if (isSafeFallbackRuntime() && isDbUnavailableError(error)) {
        const fallbackRole = inferRoleFromIdentity(emailHint || userId);
        return {
          userId,
          roles: [fallbackRole],
          activeRole: fallbackRole,
          accountState: 'ACTIVE',
          nextAction: 'LOGIN',
          registrationIncomplete: false,
        };
      }
      throw error;
    }

    if (!profile) {
      const normalizedEmail = String(emailHint || '').trim().toLowerCase();
      if (normalizedEmail) {
        const access = await AuthService.getAuthorizationStatus(normalizedEmail);
        if (access.reason === 'REGISTRATION_INCOMPLETE') {
          const fallbackRole = normalizeRole(access.role) || 'CLIENT';
          const fallbackRoles = normalizeRoleList(access.roles || [fallbackRole]);
          return {
            userId,
            roles: fallbackRoles.length ? fallbackRoles : [fallbackRole],
            activeRole: fallbackRoles[0] || fallbackRole,
            accountState: access.accountState,
            nextAction: access.nextAction,
            registrationIncomplete: true,
          };
        }
      }
      throw new AppError('Perfil não encontrado.', 404, 'PROFILE_NOT_FOUND');
    }

    const roles = await AuthService.getRolesByProfile(userId, profile.role);
    const activeRole = normalizeRole(profile.active_role || profile.role) || roles[0] || 'CLIENT';

    return {
      userId,
      roles,
      activeRole,
      accountState: 'ACTIVE',
      nextAction: 'LOGIN',
      registrationIncomplete: false,
    };
  }

   static async selectActiveRole(userId: string, requestedRole: string) {
    console.log(`[AuthService] selectActiveRole userId=${userId} requestedRole=${requestedRole}`);
    const role = defaultRole(requestedRole);
    const current = await AuthService.listRolesForUser(userId);

    if (!current.roles.includes(role)) {
      throw new AppError('Perfil solicitado não está disponível para esta conta.', 404, 'ROLE_NOT_AVAILABLE');
    }

    await prisma.profile.update({
      where: { id: userId },
      data: { active_role: role, role },
    }).catch(err => {
      console.error(`[AuthService] prisma.profile.update failed:`, err);
      throw err;
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

  static async deleteAccount(userId: string, emailHint?: string | null) {
    const normalizedEmailHint = String(emailHint || '').trim().toLowerCase();

    await prisma.$transaction(async (tx) => {
      await tx.chatMessage.deleteMany({
        where: {
          OR: [{ sender_id: userId }, { receiver_id: userId }],
        },
      });
      await tx.chatParticipant.deleteMany({ where: { profile_id: userId } });
      await tx.profileLink.deleteMany({
        where: {
          OR: [{ source_id: userId }, { target_id: userId }],
        },
      });
      await tx.swapOffer.deleteMany({
        where: {
          OR: [{ provider_id: userId }, { requester_id: userId }],
        },
      });
      await tx.tribeInvite.deleteMany({ where: { hub_id: userId } });
      await tx.recruitmentApplication.deleteMany({
        where: {
          OR: [{ candidate_id: userId }, { space_id: userId }],
        },
      });
      await tx.interview.deleteMany({
        where: {
          OR: [{ guardian_id: userId }, { space_id: userId }],
        },
      });
      await tx.marketplaceOrder.deleteMany({
        where: {
          OR: [{ buyer_id: userId }, { seller_id: userId }],
        },
      });
      await tx.escamboProposal.deleteMany({
        where: {
          OR: [{ proposer_id: userId }, { receiver_id: userId }],
        },
      });
      await tx.appointment.deleteMany({
        where: {
          OR: [{ client_id: userId }, { professional_id: userId }],
        },
      });
      await tx.record.deleteMany({
        where: {
          OR: [{ patient_id: userId }, { professional_id: userId }],
        },
      });
      await tx.transaction.deleteMany({ where: { user_id: userId } });
      await tx.notification.deleteMany({ where: { user_id: userId } });
      await tx.calendarEvent.deleteMany({ where: { user_id: userId } });
      await tx.vacancy.deleteMany({ where: { space_id: userId } });
      await tx.room.deleteMany({ where: { hub_id: userId } });
      await tx.product.deleteMany({ where: { owner_id: userId } });
      await tx.interactionReceipt.deleteMany({
        where: {
          OR: [{ actor_id: userId }, { entity_type: 'PROFILE', entity_id: userId }],
        },
      });
      await tx.guardianPresence.deleteMany({ where: { guardian_id: userId } });
      await tx.oracleHistory.deleteMany({ where: { user_id: userId } });
      await tx.metamorphosisProjection.deleteMany({ where: { user_id: userId } });
      await tx.event.deleteMany({ where: { stream_id: userId } });
      await tx.auditEvent.deleteMany({ where: { actor_id: userId } });
      await tx.profileRole.deleteMany({ where: { profile_id: userId } });
      await tx.profile.deleteMany({ where: { id: userId } });
      await tx.user.deleteMany({ where: { id: userId } });
      await tx.authAllowlist.updateMany({
        where: {
          OR: [
            { used_by: userId },
            normalizedEmailHint ? { email: normalizedEmailHint } : { used_by: userId },
          ],
        },
        data: {
          used_by: null,
          used_at: null,
          status: 'APPROVED',
        },
      });
    });

    return {
      userId,
      deleted: true,
    };
  }
}
