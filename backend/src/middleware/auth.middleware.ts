import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/secrets';
import { supabaseAdmin } from '../services/supabase.service';
import prisma from '../lib/prisma';

export type AuthUser = {
  id: string;
  userId: string;
  email?: string | null;
  role: string;
  activeRole: string;
  roles: string[];
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TEST_ADMIN_USER_ID = '11111111-1111-4111-8111-111111111111';
const isProd = process.env.NODE_ENV === 'production';
const isMockTokenEnabled = !isProd
  && String(process.env.APP_MODE || '').toUpperCase() === 'MOCK'
  && (String(process.env.ENABLE_TEST_MODE || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'test');

const resolveUserId = (candidate?: string) => {
  const value = String(candidate || '').trim();
  return UUID_REGEX.test(value) ? value : null;
};
const normalizeRole = (value?: string | null) => String(value || '').trim().toUpperCase();

const unauthorized = (res: Response, message: string) => {
  return res.status(401).json({ error: message });
};

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Invalid Authorization header format' });
  }

  // Support for strict E2E mock token only outside production.
  if (isMockTokenEnabled && token === 'admin-excellence-2026') {
    req.user = {
      id: TEST_ADMIN_USER_ID,
      userId: TEST_ADMIN_USER_ID,
      email: 'admin@viva360.com',
      role: 'ADMIN',
      activeRole: 'ADMIN',
      roles: ['ADMIN'],
    };
    return next();
  }

  try {
    // Primary path: Supabase Auth token
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && data.user) {
      const userId = resolveUserId(data.user.id);
      if (!userId) {
        return unauthorized(res, 'Invalid token payload');
      }

      let role = normalizeRole(String(data.user.user_metadata?.role || ''));
      let activeRole = role;
      let roles: string[] = role ? [role] : [];

      if (!role) {
        try {
          const profile = await prisma.profile.findUnique({
            where: { id: userId },
            select: {
              role: true,
              active_role: true,
              profile_roles: {
                select: { role: true },
                orderBy: { created_at: 'asc' },
              },
            },
          });
          roles = (profile?.profile_roles || [])
            .map((entry: { role: string }) => normalizeRole(entry.role))
            .filter(Boolean) as string[];
          if (roles.length === 0) {
            const legacy = normalizeRole(profile?.role);
            if (legacy) roles = [legacy];
          }
          if (roles.length === 0) roles = ['CLIENT'];
          activeRole = normalizeRole(profile?.active_role || profile?.role || roles[0]) || roles[0] || 'CLIENT';
          role = activeRole;
        } catch {
          role = 'CLIENT';
          activeRole = 'CLIENT';
          roles = ['CLIENT'];
        }
      }
      req.user = {
        id: userId,
        userId,
        email: data.user.email,
        role,
        activeRole,
        roles,
      };
      return next();
    }

    // Fallback path: internal JWT emitted by /auth/login
    const payload = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    const userId = resolveUserId(
      (payload?.userId as string) ||
        (payload?.id as string) ||
        (payload?.sub as string),
    );
    if (!userId) {
      return unauthorized(res, 'Invalid token payload');
    }

    const payloadRole = normalizeRole((payload?.activeRole as string) || (payload?.role as string));
    const safeRole = payloadRole || 'CLIENT';
    const payloadRoles = Array.isArray(payload?.roles)
      ? (payload.roles as unknown[]).map((entry) => normalizeRole(String(entry))).filter(Boolean)
      : [];
    const roles = payloadRoles.length ? payloadRoles : [safeRole];

    req.user = {
      id: userId,
      userId,
      email: typeof payload?.email === 'string' ? payload.email : undefined,
      role: safeRole,
      activeRole: safeRole,
      roles,
    };
    return next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
};
