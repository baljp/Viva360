import { describe, expect, it, vi } from 'vitest';
import { requireRoles, requireSameUserOrAdmin } from '../middleware/role.middleware';

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('RBAC middlewares', () => {
  it('allows role in allowlist', () => {
    const req: any = { user: { role: 'ADMIN' } };
    const res = makeRes();
    const next = vi.fn();
    requireRoles('ADMIN')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('blocks role outside allowlist', () => {
    const req: any = { user: { role: 'CLIENT' } };
    const res = makeRes();
    const next = vi.fn();
    requireRoles('ADMIN')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows same user scope', () => {
    const req: any = { user: { id: 'u1', role: 'CLIENT' }, params: { id: 'u1' } };
    const res = makeRes();
    const next = vi.fn();
    requireSameUserOrAdmin((r: any) => r.params.id)(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

