import { Request, Response, NextFunction } from 'express';

type Role = 'CLIENT' | 'PROFESSIONAL' | 'SPACE' | 'ADMIN';

const normalizeRole = (value?: string) => String(value || '').trim().toUpperCase();

export const requireRoles = (...roles: Role[]) => {
  const allowed = new Set(roles.map((role) => normalizeRole(role)));

  return (req: Request, res: Response, next: NextFunction) => {
    const role = normalizeRole((req as any).user?.role);
    if (!role || !allowed.has(role)) {
      return res.status(403).json({
        error: 'Forbidden: insufficient role',
        code: 'ROLE_NOT_ALLOWED',
      });
    }
    return next();
  };
};

export const requireSameUserOrAdmin = (getTargetUserId: (req: Request) => string | undefined) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = normalizeRole((req as any).user?.role);
    const authUserId = String((req as any).user?.userId || (req as any).user?.id || '');
    const targetUserId = String(getTargetUserId(req) || '');

    if (role === 'ADMIN' || (authUserId && targetUserId && authUserId === targetUserId)) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden: user mismatch',
      code: 'USER_SCOPE_MISMATCH',
    });
  };
};

