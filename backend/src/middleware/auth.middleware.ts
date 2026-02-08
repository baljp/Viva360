import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/secrets';
import { supabaseAdmin } from '../services/supabase.service';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; 
    }
  }
}

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeUserId = (candidate?: string) => {
  if (!candidate) return DEFAULT_USER_ID;
  return UUID_REGEX.test(candidate) ? candidate : DEFAULT_USER_ID;
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

  // Support for E2E Mock Token in MOCK mode
  if (process.env.APP_MODE === 'MOCK' && token === 'admin-excellence-2026') {
    req.user = { id: DEFAULT_USER_ID, userId: DEFAULT_USER_ID, role: 'ADMIN', email: 'admin@viva360.ai' };
    return next();
  }

  try {
    // Primary path: Supabase Auth token
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && data.user) {
      const userId = normalizeUserId(data.user.id);
      req.user = {
        id: userId,
        userId,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'CLIENT',
      };
      return next();
    }

    // Fallback path: internal JWT emitted by /auth/login
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = normalizeUserId(payload?.userId || payload?.id || payload?.sub);
    req.user = {
      id: userId,
      userId,
      email: payload?.email,
      role: payload?.role || 'CLIENT',
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
