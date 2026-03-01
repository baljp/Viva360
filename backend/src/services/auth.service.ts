import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/secrets';
import { AppError } from '../lib/AppError';
import { supabaseAdmin, supabase } from './supabase.service';
import { logger } from '../lib/logger';
import type { AuthorizationStatus } from './auth.shared';
import { defaultRole, isSelfServeOpenRole, normalizeRole, normalizeRoleList } from './auth.shared';
import { getAuthorizationStatusInternal, markAllowlistAsUsedInternal } from './auth.authorization';
import {
  addRoleInternal,
  getActiveRoleInternal,
  getRolesByProfileInternal,
  listRolesForUserInternal,
  selectActiveRoleInternal,
} from './auth.roles';

export class AuthService {
  private static classifyProviderAuthFailure(message?: string | null): string {
    const raw = String(message || '').trim();
    const lower = raw.toLowerCase();
    if (!lower) return 'UNKNOWN_PROVIDER_AUTH_ERROR';
    if (lower.includes('email not confirmed')) return 'EMAIL_NOT_CONFIRMED';
    if (lower.includes('invalid login credentials')) return 'INVALID_CREDENTIALS';
    if (lower.includes('email logins are disabled') || lower.includes('email login is disabled')) return 'EMAIL_PROVIDER_DISABLED';
    if (lower.includes('signup') && lower.includes('disabled')) return 'EMAIL_SIGNUP_DISABLED';
    if (lower.includes('smtp') || lower.includes('sending confirmation email')) return 'SMTP_OR_EMAIL_DELIVERY_ERROR';
    return 'PROVIDER_AUTH_ERROR';
  }

  private static async getRolesByProfile(profileId: string, fallbackRole?: string | null): Promise<string[]> {
    return getRolesByProfileInternal(profileId, fallbackRole);
  }

  private static async getActiveRole(profile: { id: string; role: string | null; active_role?: string | null }): Promise<string> {
    return getActiveRoleInternal(profile, AuthService.getRolesByProfile.bind(AuthService));
  }

  static async register(email: string, password: string, name: string, role: string = 'CLIENT') {
    logger.debug('auth.register_authorization_check', { email });
    const normalizedEmail = email.trim().toLowerCase();

    let authorization;
    try {
      authorization = await AuthService.getAuthorizationStatus(normalizedEmail);
      logger.debug('auth.register_authorization_status', { email: normalizedEmail, authorization });
    } catch (err: unknown) {
      logger.error('auth.register_authorization_failed', err);
      throw new AppError(`Erro interno ao verificar autorização: ${err instanceof Error ? err.message : String(err)}`, 500);
    }

    if (!authorization.canRegister) {
      logger.warn('auth.register_denied', {
        email: normalizedEmail,
        reason: authorization.reason,
        accountState: authorization.accountState,
        nextAction: authorization.nextAction,
        requestedRole: role,
      });
      throw new AppError(
        'Cadastro indisponível para este e-mail. Solicite convite.',
        403,
        'EMAIL_NOT_AUTHORIZED',
        true,
        { reason: authorization.reason }
      );
    }

    const requestedRole = normalizeRole(role);
    if (requestedRole && requestedRole !== 'CLIENT' && authorization.reason === 'OPEN_CLIENT_REGISTRATION') {
      logger.warn('auth.register_role_requires_invite', {
        email: normalizedEmail,
        requestedRole,
        authorizationReason: authorization.reason,
      });
      throw new AppError(
        'Cadastro de Guardião/Santuário exige convite ou aprovação prévia.',
        403,
        'INVITE_REQUIRED_FOR_ROLE',
        true,
        { requestedRole, allowedRoles: ['CLIENT'], reason: authorization.reason },
      );
    }
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
      logger.info('auth.register_orphan_user_update');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: password,
        email_confirm: true,
        user_metadata: { full_name: name, role: finalRole }
      });

      if (updateError) {
        logger.error('auth.register_supabase_update_failed', updateError);
        throw new AppError(`Erro ao atualizar credenciais: ${updateError.message}`, 500, 'AUTH_UPDATE_FAILED');
      }

      userId = existing.id;
    } else {
      logger.info('auth.register_supabase_create_user');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: name, role: finalRole }
      });

      if (authError) {
        logger.error('auth.register_supabase_create_failed', authError);
        if (authError.message.includes('already registered')) {
          throw new AppError('Este e-mail já está em uso.', 409, 'EMAIL_ALREADY_EXISTS');
        }
        throw new AppError(`Erro no cadastro (Supabase): ${authError.message}`, 500, 'AUTH_PROVIDER_ERROR');
      }

      if (!authData.user) {
        logger.error('auth.register_supabase_missing_user');
        throw new AppError('Falha ao criar conta de usuário.', 500, 'AUTH_USER_CREATION_FAILED');
      }

      userId = authData.user.id;
      logger.info('auth.register_user_created');
    }

    logger.info('auth.register_profile_create');
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
      logger.info('auth.register_profile_created');

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

      logger.debug('auth.register_generate_session');
      return AuthService.generateSession({
        id: userId,
        email: normalizedEmail,
        profile: {
          ...profile,
          profile_roles: [{ role: finalRole }],
        },
      });
    } catch (dbError: unknown) {
      logger.error('auth.register_profile_create_failed', dbError);
      // Clean up user from Supabase if profile creation fails? maybe later.
      throw new AppError(`Erro ao criar perfil no banco de dados: ${(dbError as { message?: string })?.message ?? String(dbError)}`, 500, 'DB_ERROR');
    }
  }

  static async login(email: string, password: string) {
    logger.info('auth.login_attempt', { email });
    const normalizedEmail = email.trim().toLowerCase();

    // NOTE: Some environments may authenticate successfully via Supabase Auth API
    // while the local DB query by email returns null (legacy users, email mismatch,
    // partial migrations). Never assume the DB record exists.
    const userByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: {
          include: { profile_roles: true },
        },
      },
    }).catch(err => {
      logger.error('auth.login_user_lookup_failed', err);
      throw new AppError(`Erro de conexão com banco de dados: ${String((err as { message?: string })?.message ?? err)}`, 500);
    });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (authError || !authData.user) {
      logger.warn('auth.login_supabase_failed', {
        email: normalizedEmail,
        cause: AuthService.classifyProviderAuthFailure(authError?.message),
        providerMessage: authError?.message || null,
      });
      // Fallback for VERY old users that might only be in Prisma but not Supabase Auth
      // (Though my repair script should have fixed this)
      if (userByEmail?.encrypted_password) {
        const isValidManual = await bcrypt.compare(password, userByEmail.encrypted_password);
        if (isValidManual) {
          logger.warn('auth.login_manual_fallback_success', { email: normalizedEmail });
        } else {
          throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
        }
      } else {
        throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
      }
    }

    logger.debug('auth.login_verified');

    // Prefer the DB snapshot we already fetched, but if it's missing try loading by the
    // Supabase user id (works even if email in auth.users is NULL/mismatched).
    const supabaseUserId = String(authData.user.id || '').trim();
    const user = userByEmail || await prisma.user.findUnique({
      where: { id: supabaseUserId },
      include: {
        profile: {
          include: { profile_roles: true },
        },
      },
    }).catch(err => {
      logger.error('auth.login_user_lookup_by_id_failed', err);
      throw new AppError(`Erro de conexão com banco de dados: ${String((err as { message?: string })?.message ?? err)}`, 500);
    });

    if (!user) {
      // Credentials verified against Supabase, but we could not load user from the DB.
      // Return an operational error (not a 500) so the client doesn't see "Internal Server Error".
      logger.warn('auth.login_user_missing_after_supabase', { email: normalizedEmail, supabaseUserId });
      throw new AppError('Conta não encontrada no banco. Tente novamente mais tarde ou contate o suporte.', 401, 'USER_NOT_FOUND');
    }

    // Auto-create profile if user authenticated but profile is missing (incomplete registration)
    if (!user.profile) {
      logger.info('auth.login_autocreate_profile');
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
      } catch (e: unknown) {
        logger.error('auth.login_autocreate_profile_failed', e);
        throw new AppError(`Erro ao criar perfil automático: ${(e as { message?: string })?.message ?? String(e)}`, 500);
      }
    }

    return AuthService.generateSession(user);
  }

  private static async generateSession(user: {
    id: string;
    email?: string | null;
    role?: string | null;
    profile?: {
      id: string;
      role: string | null;
      active_role?: string | null;
      profile_roles?: { role: string }[];
      avatar?: string | null;
      name?: string | null;
    } | null;
  }) {
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
    const status = await getAuthorizationStatusInternal(email, AuthService.getRolesByProfile.bind(AuthService));
    if (status.reason === 'OPEN_CLIENT_REGISTRATION' && !isSelfServeOpenRole(status.role)) {
      logger.warn('auth.authorization_inconsistent_open_role', { email, role: status.role, roles: status.roles });
    }
    return status;
  }

  static async markAllowlistAsUsed(email: string, userId: string) {
    await markAllowlistAsUsedInternal(email, userId);
  }

  static async listRolesForUser(userId: string, emailHint?: string | null) {
    return listRolesForUserInternal(userId, emailHint, AuthService.getAuthorizationStatus.bind(AuthService));
  }

  static async selectActiveRole(userId: string, requestedRole: string) {
    logger.info('auth.select_active_role', { requestedRole });
    const current = await AuthService.listRolesForUser(userId);

    // 1. Perform the DB updates
    await selectActiveRoleInternal(userId, requestedRole, current.roles).catch((err) => {
      logger.error('auth.select_active_role_update_failed', err);
      throw err;
    });

    // 2. Fetch the updated user with profile to generate a fresh token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: { profile_roles: true },
        },
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado após troca de perfil.', 404, 'USER_NOT_FOUND');
    }

    // 3. Return a full session (token + user details)
    return AuthService.generateSession(user);
  }

  static async addRole(userId: string, requestedRole: string) {
    return addRoleInternal(userId, requestedRole);
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
