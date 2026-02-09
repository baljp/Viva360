import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    profile: {
      findFirst: vi.fn(),
    },
    authAllowlist: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
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
  });

  it('allows login when profile exists', async () => {
    prismaMock.profile.findFirst.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    prismaMock.authAllowlist.findUnique.mockResolvedValue(null);

    const status = await AuthService.getAuthorizationStatus('user@example.com');
    expect(status.canLogin).toBe(true);
    expect(status.canRegister).toBe(false);
    expect(status.reason).toBe('PROFILE_ACTIVE');
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
  });
});
