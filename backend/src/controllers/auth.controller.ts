import { Request, Response } from 'express';
import { supabaseAdmin, isMockMode } from '../services/supabase.service';
import { z } from 'zod';

// Validation Schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'SPACE']).optional(),
});

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    if (isMockMode()) {
      let role = 'CLIENT';
      if (email.includes('pro')) role = 'PROFESSIONAL';
      if (email.includes('hub')) role = 'SPACE';
      
      let avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200';
      let name = 'Buscador Demo';

      if (role === 'PROFESSIONAL') {
          name = 'Guardião Demo';
          avatar = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=200';
      }
      if (role === 'SPACE') {
          name = 'Santuário Demo';
          avatar = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=200';
      }

      return res.json({
        user: { 
          id: `mock-user-${role.toLowerCase()}`, 
          email, 
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
        },
        session: { access_token: `mock-jwt-token-${role}`, refresh_token: 'mock-refresh-token' },
      });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(401).json({ error: error.message || 'Authentication failed' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = registerSchema.parse(req.body);

    if (isMockMode()) {
      return res.json({
        user: { id: 'mock-new-user-id', email, user_metadata: { name, role } },
        session: null, // Usually register requires email confirmation
      });
    }

    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: role || 'CLIENT',
        },
      },
    });

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
     if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(400).json({ error: error.message || 'Registration failed' });
  }
};
