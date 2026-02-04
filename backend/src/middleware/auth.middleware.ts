import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/secrets';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; 
    }
  }
}

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
    req.user = { id: 'admin_master', role: 'ADMIN', email: 'admin@viva360.ai' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Normalize userId to id for consistency across the app
    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id || decoded.sub,  // Support various JWT formats
      userId: decoded.userId || decoded.id || decoded.sub
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
