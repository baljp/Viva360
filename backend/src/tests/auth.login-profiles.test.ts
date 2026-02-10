import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── MOCK: Prisma ───
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    profile: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
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
vi.mock('../lib/prisma', () => ({ default: prismaMock }));

import { AuthService } from '../services/auth.service';

// ─── Test profiles ───
const PROFILES = [
  { email: 'client0@viva360.com', role: 'CLIENT',       name: 'Buscador Teste',   id: 'client_0' },
  { email: 'pro0@viva360.com',    role: 'PROFESSIONAL',  name: 'Guardião Teste',   id: 'pro_0'    },
  { email: 'contato.hub0@viva360.com', role: 'SPACE',   name: 'Santuário Teste',  id: 'hub_0'    },
];

describe('Login por Email – 3 Perfis (CLIENT, PROFESSIONAL, SPACE)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.profileRole.findMany.mockResolvedValue([]);
    prismaMock.profileRole.create.mockResolvedValue({ id: 'role-1', profile_id: 'u', role: 'CLIENT' });
    prismaMock.profileRole.upsert.mockResolvedValue({ id: 'role-1', profile_id: 'u', role: 'CLIENT' });
    prismaMock.user.findUnique.mockResolvedValue(null);
  });

  describe.each(PROFILES)('Perfil $role ($email)', ({ email, role, id }) => {
    it('permite login quando profile existe', async () => {
      prismaMock.profile.findFirst.mockResolvedValue({ id, role, email, name: 'Test' });
      prismaMock.authAllowlist.findUnique.mockResolvedValue(null);

      const status = await AuthService.getAuthorizationStatus(email);
      expect(status.canLogin).toBe(true);
      expect(status.reason).toBe('PROFILE_ACTIVE');
      expect(status.role).toBe(role);
      expect(status.accountState).toBe('ACTIVE');
    });

    it('registro aberto: sem profile nem allowlist permite registro livre', async () => {
      // DECISÃO DE NEGÓCIO: Viva360 usa registro aberto.
      // Emails sem profile e sem allowlist podem se cadastrar livremente.
      prismaMock.profile.findFirst.mockResolvedValue(null);
      prismaMock.authAllowlist.findUnique.mockResolvedValue(null);

      const status = await AuthService.getAuthorizationStatus(email);
      expect(status.canLogin).toBe(false);
      expect(status.canRegister).toBe(true);
      expect(status.role).toBe('CLIENT');
      expect(status.nextAction).toBe('REGISTER');
    });

    it('permite registro quando invite APPROVED sem profile', async () => {
      prismaMock.profile.findFirst.mockResolvedValue(null);
      prismaMock.authAllowlist.findUnique.mockResolvedValue({
        id: `invite-${id}`, role, status: 'APPROVED', used_by: null,
      });

      const status = await AuthService.getAuthorizationStatus(email);
      expect(status.canLogin).toBe(false);
      expect(status.canRegister).toBe(true);
      expect(status.role).toBe(role);
    });

    it('retorna roles corretos via listRolesForUser', async () => {
      prismaMock.profile.findUnique.mockResolvedValue({ id, email, role, active_role: role, name: 'Test' });
      prismaMock.profile.findFirst.mockResolvedValue({ id, email, role });
      prismaMock.profileRole.findMany.mockResolvedValue([{ role }]);
      prismaMock.authAllowlist.findUnique.mockResolvedValue(null);

      const rolesPayload = await AuthService.listRolesForUser(id, email);
      expect(rolesPayload.activeRole).toBe(role);
      expect(rolesPayload.roles).toContain(role);
      expect(rolesPayload.registrationIncomplete).toBe(false);
    });
  });
});

describe('Login Google (OAuth) – 3 Perfis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.profileRole.findMany.mockResolvedValue([]);
    prismaMock.profileRole.create.mockResolvedValue({ id: 'role-1', profile_id: 'u', role: 'CLIENT' });
    prismaMock.profileRole.upsert.mockResolvedValue({ id: 'role-1', profile_id: 'u', role: 'CLIENT' });
    prismaMock.user.findUnique.mockResolvedValue(null);
  });

  describe.each(PROFILES)('OAuth Perfil $role ($email)', ({ email, role, id }) => {
    it('OAuth: profile existente permite login direto', async () => {
      prismaMock.profile.findFirst.mockResolvedValue({ id, role, email, name: 'Google User' });
      prismaMock.authAllowlist.findUnique.mockResolvedValue(null);

      const status = await AuthService.getAuthorizationStatus(email);
      expect(status.canLogin).toBe(true);
      expect(status.role).toBe(role);
    });

    it('OAuth: sem profile mas com invite APPROVED permite canRegister (auto-create)', async () => {
      prismaMock.profile.findFirst.mockResolvedValue(null);
      prismaMock.authAllowlist.findUnique.mockResolvedValue({
        id: `oauth-invite-${id}`, role, status: 'APPROVED', used_by: null,
      });

      const status = await AuthService.getAuthorizationStatus(email);
      expect(status.canLogin).toBe(false);
      expect(status.canRegister).toBe(true);
      expect(status.role).toBe(role);
    });

    it('OAuth: sem profile e sem invite permite registro aberto', async () => {
      // DECISÃO DE NEGÓCIO: registro aberto — OAuth sem invite também pode registrar
      prismaMock.profile.findFirst.mockResolvedValue(null);
      prismaMock.authAllowlist.findUnique.mockResolvedValue(null);

      const status = await AuthService.getAuthorizationStatus(email);
      expect(status.canLogin).toBe(false);
      expect(status.canRegister).toBe(true);
      expect(status.role).toBe('CLIENT');
    });

    it('OAuth: invite BLOCKED rejeita acesso', async () => {
      prismaMock.profile.findFirst.mockResolvedValue(null);
      prismaMock.authAllowlist.findUnique.mockResolvedValue({
        id: `blocked-${id}`, role, status: 'BLOCKED', used_by: null,
      });

      const status = await AuthService.getAuthorizationStatus(email);
      expect(status.canLogin).toBe(false);
      expect(status.canRegister).toBe(false);
      expect(status.reason).toBe('EMAIL_BLOCKED');
    });
  });
});

describe('Fluxo Completo – Registration Incomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.profileRole.findMany.mockResolvedValue([]);
    prismaMock.user.findUnique.mockResolvedValue(null);
  });

  it.each(PROFILES)('$role: cadastro incompleto com invite aprovado', async ({ email, role, id }) => {
    prismaMock.profile.findFirst.mockResolvedValue(null);
    prismaMock.authAllowlist.findUnique.mockResolvedValue({
      id: `invite-inc-${id}`, role, status: 'APPROVED', used_by: null,
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: `auth-${id}`, raw_user_meta_data: { role },
    });

    const status = await AuthService.getAuthorizationStatus(email);
    expect(status.canLogin).toBe(false);
    expect(status.canRegister).toBe(true);
    expect(status.reason).toBe('REGISTRATION_INCOMPLETE');
    expect(status.accountState).toBe('INCOMPLETE_REGISTRATION');
    expect(status.role).toBe(role);
  });
});
