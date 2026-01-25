import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { isMockMode } from '../services/supabase.service';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';

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
       const token = jwt.sign({ userId: 'mock-user-id', email, role: 'CLIENT' }, JWT_SECRET, { expiresIn: '1h' });
       return res.json({
         user: { id: 'mock-user-id', email },
         session: { access_token: token, refresh_token: 'mock-refresh' }
       });
    }

    const data = await AuthService.login(email, password);
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
       const token = jwt.sign({ userId: 'mock-user-id', email, role: role || 'CLIENT' }, JWT_SECRET, { expiresIn: '1h' });
       return res.status(201).json({
         user: { id: 'mock-user-id', email, role },
         session: { access_token: token, refresh_token: 'mock-refresh' }
       });
    }

    const data = await AuthService.register(email, password, name, role); // Pass role
    
    // Trigger Holistic Welcome Email (Async - Fire & Forget)
    import('../services/email.service').then(({ emailService }) => {
      emailService.send({
        to: email,
        subject: 'Bem-vindo ao Viva360 - Sua Jornada Começa Agora 🌿',
        template: 'WELCOME',
        context: { name }
      }).catch(err => console.error("Email Error:", err));
    });

    return res.status(201).json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(400).json({ error: error.message || 'Registration failed' });
  }
};
