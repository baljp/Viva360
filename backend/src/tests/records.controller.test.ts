import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, isMockModeMock, auditLogMock, notifyEmitMock } = vi.hoisted(() => ({
  prismaMock: {
    record: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    profileLink: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
  },
  isMockModeMock: vi.fn(),
  auditLogMock: vi.fn(),
  notifyEmitMock: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('../services/supabase.service', () => ({
  isMockMode: isMockModeMock,
}));

vi.mock('../services/audit.service', () => ({
  AuditService: {
    logAccess: auditLogMock,
  },
}));

vi.mock('../services/notificationEngine.service', () => ({
  notificationEngine: {
    emit: notifyEmitMock,
  },
}));

import { createNote, grantAccess, listNotes, revokeAccess } from '../controllers/records.controller';

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('RecordsController LGPD + consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isMockModeMock.mockReturnValue(false);
    prismaMock.profile.findUnique.mockResolvedValue({
      hub_id: null,
      role: 'PROFESSIONAL',
      active_role: 'PROFESSIONAL',
      profile_roles: [{ role: 'PROFESSIONAL' }],
    });
    prismaMock.profileLink.findUnique.mockResolvedValue(null);
    prismaMock.profileLink.upsert.mockResolvedValue({});
    prismaMock.record.findFirst.mockResolvedValue(null);
    prismaMock.record.findMany.mockResolvedValue([]);
    prismaMock.record.create.mockResolvedValue({
      id: 'rec-1',
      patient_id: 'patient-1',
      professional_id: 'pro-1',
      content: 'ok',
      type: 'session',
    });
  });

  it('bloqueia admin ao listar prontuário', async () => {
    const req: any = {
      user: { userId: 'admin-1', role: 'ADMIN' },
      query: { patientId: 'patient-1' },
    };
    const res = makeRes();
    const next = vi.fn();

    listNotes(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('LGPD_VIOLATION'),
      }),
    );
  });

  it('nega criação de prontuário sem consentimento ativo', async () => {
    const req: any = {
      user: { userId: 'pro-1', role: 'PROFESSIONAL' },
      body: {
        patientId: 'patient-1',
        content: 'conteúdo clínico',
        type: 'session',
      },
    };
    const res = makeRes();
    const next = vi.fn();

    prismaMock.profileLink.findUnique.mockResolvedValue({ status: 'revoked' });

    createNote(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('CONSENT_REQUIRED'),
      }),
    );
    expect(prismaMock.record.create).not.toHaveBeenCalled();
  });

  it('permite criação de prontuário com consentimento ativo', async () => {
    const req: any = {
      user: { userId: 'pro-1', role: 'PROFESSIONAL' },
      body: {
        patientId: 'patient-1',
        content: 'conteúdo clínico',
        type: 'session',
      },
    };
    const res = makeRes();
    const next = vi.fn();

    prismaMock.profileLink.findUnique.mockResolvedValue({ status: 'active' });

    createNote(req, res, next);
    await flush();

    expect(prismaMock.record.create).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'rec-1' }));
  });

  it('restringe grant para papel CLIENT', async () => {
    const req: any = {
      user: { userId: 'pro-1', role: 'PROFESSIONAL' },
      body: { professionalId: 'pro-2' },
    };
    const res = makeRes();
    const next = vi.fn();

    grantAccess(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prismaMock.profileLink.upsert).not.toHaveBeenCalled();
  });

  it('nega listagem de prontuário de terceiro sem consentimento ativo', async () => {
    const req: any = {
      user: { userId: 'pro-1', role: 'PROFESSIONAL' },
      query: { patientId: 'patient-1' },
    };
    const res = makeRes();
    const next = vi.fn();

    prismaMock.profileLink.findUnique.mockResolvedValue({ status: 'revoked' });

    listNotes(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('CONSENT_REQUIRED'),
      }),
    );
    expect(prismaMock.record.findMany).not.toHaveBeenCalled();
  });

  it('persiste grant com consent ACTIVE', async () => {
    const req: any = {
      user: { userId: 'patient-1', role: 'CLIENT' },
      body: { professionalId: 'pro-2' },
    };
    const res = makeRes();
    const next = vi.fn();

    prismaMock.profile.findUnique.mockResolvedValue({
      role: 'PROFESSIONAL',
      active_role: 'PROFESSIONAL',
      profile_roles: [{ role: 'PROFESSIONAL' }],
    });

    grantAccess(req, res, next);
    await flush();

    expect(prismaMock.profileLink.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          source_id: 'patient-1',
          target_id: 'pro-2',
          type: 'patient',
          status: 'active',
        }),
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        consent: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );
  });

  it('persiste revoke com consent REVOKED', async () => {
    const req: any = {
      user: { userId: 'patient-1', role: 'CLIENT' },
      body: { professionalId: 'pro-2' },
    };
    const res = makeRes();
    const next = vi.fn();

    revokeAccess(req, res, next);
    await flush();

    expect(prismaMock.profileLink.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: 'revoked' }),
        create: expect.objectContaining({
          source_id: 'patient-1',
          target_id: 'pro-2',
          type: 'patient',
          status: 'revoked',
        }),
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        consent: expect.objectContaining({ status: 'REVOKED' }),
      }),
    );
  });
});
