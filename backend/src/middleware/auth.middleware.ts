import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabase.service';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // Replace with concrete User type later
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

  try {
    if (process.env.MOCK_MODE === 'true') {
        // Extract role from token suffix "mock-jwt-token-ROLE"
        const roleSuffix = token.split('-').pop(); // 'PROFESSIONAL', 'SPACE', or 'token' (default)
        let role = 'CLIENT';
        if (roleSuffix === 'PROFESSIONAL') role = 'PROFESSIONAL';
        if (roleSuffix === 'SPACE') role = 'SPACE';

        let name = 'Buscador Demo';
        let avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200';

        if (role === 'PROFESSIONAL') {
            name = 'Guardião Demo';
            avatar = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=200';
        }
        if (role === 'SPACE') {
            name = 'Santuário Demo';
            avatar = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=200';
        }

        req.user = { 
          id: `mock-user-${role.toLowerCase()}`, 
          email: 'mock@viva360.com', 
          role,
          name,
          avatar,
          karma: 120,
          streak: 5,
          multiplier: 1.2,
          plantStage: 'seed',
          plantXp: 45,
          corporateBalance: 0,
          personalBalance: 500
        };
        return next();
    }
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
};
