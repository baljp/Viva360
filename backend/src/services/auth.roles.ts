import prisma from '../lib/prisma';
import { AppError } from '../lib/AppError';
import {
  defaultRole,
  inferRoleFromIdentity,
  isDbUnavailableError,
  isSafeFallbackRuntime,
  normalizeRole,
  normalizeRoleList,
} from './auth.shared';
import type { AuthorizationStatus } from './auth.shared';

type GetAuthorizationStatusFn = (email: string) => Promise<AuthorizationStatus>;

export const getRolesByProfileInternal = async (profileId: string, fallbackRole?: string | null): Promise<string[]> => {
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
};

export const getActiveRoleInternal = async (
  profile: { id: string; role: string | null; active_role?: string | null },
  getRolesByProfile: (profileId: string, fallbackRole?: string | null) => Promise<string[]>,
): Promise<string> => {
  const roles = await getRolesByProfile(profile.id, profile.role);
  const active = normalizeRole(profile.active_role || profile.role);
  if (active && roles.includes(active)) return active;

  const first = roles[0] || 'CLIENT';
  await prisma.profile.update({
    where: { id: profile.id },
    data: { active_role: first },
  }).catch(() => null);
  return first;
};

export const listRolesForUserInternal = async (
  userId: string,
  emailHint: string | null | undefined,
  getAuthorizationStatus: GetAuthorizationStatusFn,
): Promise<{
  userId: string;
  roles: string[];
  activeRole: string;
  accountState: string;
  nextAction: string;
  registrationIncomplete: boolean;
}> => {
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
      const access = await getAuthorizationStatus(normalizedEmail);
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

  const roles = await getRolesByProfileInternal(userId, profile.role);
  const activeRole = normalizeRole(profile.active_role || profile.role) || roles[0] || 'CLIENT';

  return {
    userId,
    roles,
    activeRole,
    accountState: 'ACTIVE',
    nextAction: 'LOGIN',
    registrationIncomplete: false,
  };
};

export const selectActiveRoleInternal = async (userId: string, requestedRole: string, currentRoles: string[]) => {
  const role = defaultRole(requestedRole);
  if (!currentRoles.includes(role)) {
    throw new AppError('Perfil solicitado não está disponível para esta conta.', 404, 'ROLE_NOT_AVAILABLE');
  }

  await prisma.profile.update({
    where: { id: userId },
    data: { active_role: role, role },
  });

  return {
    userId,
    roles: currentRoles,
    activeRole: role,
  };
};

export const addRoleInternal = async (userId: string, requestedRole: string) => {
  const role = defaultRole(requestedRole);
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, role: true, active_role: true },
  });

  if (!profile) {
    throw new AppError('Perfil não encontrado.', 404, 'PROFILE_NOT_FOUND');
  }

  const roles = await getRolesByProfileInternal(userId, profile.role);
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
    return { userId, roles: [...roles, role], activeRole: role };
  }

  return {
    userId,
    roles: [...roles, role],
    activeRole: normalizeRole(profile.active_role) || role,
  };
};
