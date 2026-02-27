import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    profile: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    profileRole: {
      findMany: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    authAllowlist: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../lib/prisma', () => ({
  default: prismaMock,
}));

import { AuthService } from '../services/auth.service';

describe('AuthService authorization policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.profileRole.findMany.mockResolvedValue([]);
    prismaMock.profileRole.create.mockResolvedValue({ id: 'role-1', profile_id: 'user-1', role: 'CLIENT' });
    prismaMock.profileRole.upsert.mockResolvedValue({ id: 'role-1', profile_id: 'user-1', role: 'CLIENT' });
    prismaMock.user.findUnique.mockResolvedValue(null);
  });

  it('allows login when profile exists', async () => {
    prismaMock.profile.findFirst.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    prismaMock.authAllowlist.findUnique.mockResolvedValue(null);

    const status = await AuthService.getAuthorizationStatus('user@example.com');
    expect(status.canLogin).toBe(true);
    expect(status.canRegister).toBe(false);
    expect(status.reason).toBe('PROFILE_ACTIVE');
    expect(status.accountState).toBe('ACTIVE');
  });

  it('allows register when invite is approved and profile absent', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null);
    prismaMock.authAllowlist.findUnique.mockResolvedValue({
      id: 'invite-1',
      role: 'PROFESSIONAL',
      status: 'APPROVED',
      used_by: null,
    });

    const status = await AuthService.getAuthorizationStatus('pro@example.com');
    expect(status.canLogin).toBe(false);
    expect(status.canRegister).toBe(true);
    expect(status.role).toBe('PROFESSIONAL');
    expect(status.reason).toBe('INVITE_APPROVED_PENDING_REGISTRATION');
    expect(status.accountState).toBe('INVITE_PENDING_REGISTRATION');
  });

  it('blocks when allowlist status is blocked', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null);
    prismaMock.authAllowlist.findUnique.mockResolvedValue({
      id: 'invite-2',
      role: 'CLIENT',
      status: 'BLOCKED',
      used_by: null,
    });

    const status = await AuthService.getAuthorizationStatus('blocked@example.com');
    expect(status.canLogin).toBe(false);
    expect(status.canRegister).toBe(false);
    expect(status.reason).toBe('EMAIL_BLOCKED');
    expect(status.accountState).toBe('BLOCKED');
  });

  it('allows orphan auth user to login and autocreate profile (Open Auth)', async () => {
    // User exists in auth.users with confirmed email but no profile — fix 4982ed6:
    // We now allow login and autocreate profile, rather than blocking with canRegister
    prismaMock.profile.findFirst.mockResolvedValue(null);
    prismaMock.authAllowlist.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'auth-user',
      raw_user_meta_data: { role: 'SPACE' },
      email_confirmed_at: new Date().toISOString(),
    });

    const status = await AuthService.getAuthorizationStatus('incomplete@example.com');
    expect(status.canLogin).toBe(true);
    expect(status.canRegister).toBe(false);
    expect(status.reason).toBe('PROFILE_MISSING_WILL_AUTOCREATE');
    expect(status.accountState).toBe('INCOMPLETE_REGISTRATION');
  });

  it('returns explicit self-serve client state when no profile/allowlist exists', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null);
    prismaMock.authAllowlist.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);

    const status = await AuthService.getAuthorizationStatus('novo@exemplo.com');
    expect(status.canLogin).toBe(false);
    expect(status.canRegister).toBe(true);
    expect(status.role).toBe('CLIENT');
    expect(status.reason).toBe('OPEN_CLIENT_REGISTRATION');
    expect(status.accountState).toBe('OPEN_SELF_SERVE');
  });

  it('allows login+autocreate for confirmed email with approved allowlist', async () => {
    // Confirmed email + approved invite + no profile → login allowed, profile autocreated
    prismaMock.profile.findFirst.mockResolvedValue(null);
    prismaMock.authAllowlist.findUnique.mockResolvedValue({
      id: 'invite-3',
      role: 'SPACE',
      status: 'APPROVED',
      used_by: null,
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'auth-user',
      raw_user_meta_data: { role: 'SPACE' },
      email_confirmed_at: new Date().toISOString(),
    });

    const status = await AuthService.getAuthorizationStatus('incomplete@example.com');
    expect(status.canLogin).toBe(true);
    expect(status.canRegister).toBe(false);
    expect(status.reason).toBe('PROFILE_MISSING_WILL_AUTOCREATE');
    expect(status.accountState).toBe('INCOMPLETE_REGISTRATION');
    expect(status.role).toBe('SPACE');
  });

  it('returns treatable registration state on listRolesForUser when profile is missing', async () => {
    prismaMock.profile.findUnique.mockResolvedValue(null);
    prismaMock.profile.findFirst.mockResolvedValue(null);
    prismaMock.authAllowlist.findUnique.mockResolvedValue({
      id: 'invite-4',
      role: 'PROFESSIONAL',
      status: 'APPROVED',
      used_by: null,
    });
    // With confirmed email: canLogin=true, accountState=INCOMPLETE_REGISTRATION
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'auth-user',
      raw_user_meta_data: { role: 'PROFESSIONAL' },
      email_confirmed_at: new Date().toISOString(),
    });

    const rolesPayload = await AuthService.listRolesForUser('auth-user', 'incomplete@example.com');
    expect(rolesPayload.registrationIncomplete).toBe(true);
    expect(rolesPayload.accountState).toBe('INCOMPLETE_REGISTRATION');
    expect(rolesPayload.nextAction).toBe('LOGIN'); // autocreate path → LOGIN
    expect(rolesPayload.roles).toContain('PROFESSIONAL');
  });

  it('returns INCOMPLETE_REGISTRATION for orphan user in listRolesForUser', async () => {
    prismaMock.profile.findUnique.mockResolvedValue(null);
    prismaMock.profile.findFirst.mockResolvedValue(null);
    prismaMock.authAllowlist.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'auth-user',
      raw_user_meta_data: { role: 'CLIENT' },
      email_confirmed_at: new Date().toISOString(),
    });

    const rolesPayload = await AuthService.listRolesForUser('auth-user', 'unauthorized@example.com');
    expect(rolesPayload.registrationIncomplete).toBe(true);
    expect(rolesPayload.accountState).toBe('INCOMPLETE_REGISTRATION');
    expect(rolesPayload.nextAction).toBe('LOGIN'); // autocreate path
  });
});
