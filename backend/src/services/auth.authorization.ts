import prisma from '../lib/prisma';
import type { AuthorizationStatus } from './auth.shared';
import {
  ALLOWLIST_BLOCKED_STATUSES,
  ALLOWLIST_PENDING_STATUSES,
  ALLOWLIST_REGISTER_STATUSES,
  normalizeAllowlistStatus,
  normalizeRole,
} from './auth.shared';

type GetRolesByProfileFn = (profileId: string, fallbackRole?: string | null) => Promise<string[]>;

export const getAuthorizationStatusInternal = async (
  email: string,
  getRolesByProfile: GetRolesByProfileFn,
): Promise<AuthorizationStatus> => {
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
      select: { id: true, raw_user_meta_data: true, email_confirmed_at: true },
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
    const roles = await getRolesByProfile(profile.id, profile.role);
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
    const metadata = typeof authUser.raw_user_meta_data === 'object' && authUser.raw_user_meta_data
      ? authUser.raw_user_meta_data as Record<string, unknown>
      : {};
    const metadataRole = normalizeRole(String(metadata.role || ''));
    const role = metadataRole || allowlistRole || 'CLIENT';

    // Email not confirmed yet — don't allow login
    if (!authUser.email_confirmed_at) {
      return {
        canLogin: false,
        canRegister: false,
        role,
        roles: [role],
        reason: 'EMAIL_NOT_CONFIRMED',
        accountState: 'INCOMPLETE_REGISTRATION',
        nextAction: 'CONFIRM_EMAIL',
      };
    }

    // User exists in auth.users with confirmed email but no profile yet.
    // Allow login — AuthService.login will autocreate the profile on success.
    // Blocking here with canLogin: false causes "Falha no login" for users
    // whose profile was not created during registration (e.g. Google OAuth flow,
    // partial migrations, or registration crash after Supabase account creation).
    return {
      canLogin: true,
      canRegister: false,
      role,
      roles: [role],
      reason: 'PROFILE_MISSING_WILL_AUTOCREATE',
      accountState: 'INCOMPLETE_REGISTRATION',
      nextAction: 'LOGIN',
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
    canRegister: true,
    role: allowlistRole || 'CLIENT',
    roles: allowlistRole ? [allowlistRole] : ['CLIENT'],
    reason: 'OPEN_CLIENT_REGISTRATION',
    accountState: 'OPEN_SELF_SERVE',
    nextAction: 'REGISTER',
  };
};

export const markAllowlistAsUsedInternal = async (email: string, userId: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  await prisma.authAllowlist.updateMany({
    where: { email: normalizedEmail },
    data: {
      used_by: userId,
      used_at: new Date(),
      status: 'USED',
    },
  });
};
