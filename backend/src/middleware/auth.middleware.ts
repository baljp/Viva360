import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/secrets';
import { supabaseAdmin } from '../services/supabase.service';
import prisma from '../lib/prisma';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; 
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
    req.user = { id: TEST_ADMIN_USER_ID, userId: TEST_ADMIN_USER_ID, role: 'ADMIN', email: 'admin@viva360.com' };
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

      let role = String(data.user.user_metadata?.role || '').trim().toUpperCase();
      if (!role) {
        try {
          const profile = await prisma.profile.findUnique({
            where: { id: userId },
            select: { role: true },
          });
          role = String(profile?.role || '').trim().toUpperCase() || 'CLIENT';
        } catch {
          role = 'CLIENT';
        }
      }
      req.user = {
        id: userId,
        userId,
        email: data.user.email,
        role,
      };
      return next();
    }

    // Fallback path: internal JWT emitted by /auth/login
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = resolveUserId(payload?.userId || payload?.id || payload?.sub);
    if (!userId) {
      return unauthorized(res, 'Invalid token payload');
    }

    req.user = {
      id: userId,
      userId,
      email: payload?.email,
      role: payload?.role || 'CLIENT',
    };
    return next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
};
