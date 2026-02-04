import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { isMockMode } from '../services/supabase.service';
import { mockData } from '../services/mockData.service';
import { asyncHandler } from '../middleware/async.middleware';
import { JWT_SECRET } from '../lib/secrets';

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

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    if (isMockMode()) {
       // Try to find in curated dataset first
       const roundedUser = mockData.findUserByEmail(email);
       
       let userPayload;
       if (roundedUser) {
           userPayload = { id: roundedUser.id, email: roundedUser.email, role: roundedUser.role };
       } else {
           // Fallback for dev convenience if not in dataset but valid email format
           let role = 'CLIENT';
           if (email.startsWith('admin')) role = 'ADMIN';
           else if (email.startsWith('pro')) role = 'PROFESSIONAL';
           else if (email.startsWith('space')) role = 'SPACE';
           userPayload = { id: 'mock-fallback-id', email, role };
       }

       const token = jwt.sign({ userId: userPayload.id, email: userPayload.email, role: userPayload.role }, JWT_SECRET, { expiresIn: '1h' });
       return res.json({
         user: userPayload,
         session: { access_token: token, refresh_token: 'mock-refresh' }
       });
    }

    const data = await AuthService.login(email, password);
    return res.json(data);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
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
});
