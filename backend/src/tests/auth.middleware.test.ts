import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getUserMock, jwtVerifyMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  jwtVerifyMock: vi.fn(),
}));

vi.mock('../services/supabase.service', () => ({
  supabaseAdmin: {
    auth: {
      getUser: getUserMock,
    },
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: jwtVerifyMock,
  },
  verify: jwtVerifyMock,
}));

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const loadMiddleware = async () => {
  vi.resetModules();
  const mod = await import('../middleware/auth.middleware');
  return mod.authenticateUser;
};

describe('auth.middleware mock token gating', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
    getUserMock.mockResolvedValue({ data: { user: null }, error: new Error('invalid token') });
    jwtVerifyMock.mockImplementation(() => {
      throw new Error('invalid token');
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('aceita token de mock apenas em runtime de teste com APP_MODE=MOCK', async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_MODE = 'MOCK';
    process.env.ENABLE_TEST_MODE = 'true';

    const authenticateUser = await loadMiddleware();
    const req: any = { headers: { authorization: 'Bearer admin-excellence-2026' } };
    const res = makeRes();
    const next = vi.fn();

    await authenticateUser(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ role: 'ADMIN', email: 'admin@viva360.com' });
  });

  it('bloqueia token de mock em produção mesmo com APP_MODE=MOCK', async () => {
    process.env.NODE_ENV = 'production';
    process.env.APP_MODE = 'MOCK';
    process.env.ENABLE_TEST_MODE = 'true';
    process.env.JWT_SECRET = 'test-production-secret';

    const authenticateUser = await loadMiddleware();
    const req: any = { headers: { authorization: 'Bearer admin-excellence-2026' } };
    const res = makeRes();
    const next = vi.fn();

    await authenticateUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/Invalid|expired/i) }));
  });
});
