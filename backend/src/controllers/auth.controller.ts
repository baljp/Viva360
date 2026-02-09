import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { isMockMode } from '../services/supabase.service';
import { asyncHandler } from '../middleware/async.middleware';
import { JWT_SECRET } from '../lib/secrets';

const MOCK_TEST_PASSWORD = '123456';
const STRICT_MOCK_TEST_USERS: Record<string, { id: string; role: 'CLIENT' | 'PROFESSIONAL' | 'SPACE' | 'ADMIN'; name: string }> = {
  'client0@viva360.com': { id: 'client_0', role: 'CLIENT', name: 'Buscador Teste' },
  'pro0@viva360.com': { id: 'pro_0', role: 'PROFESSIONAL', name: 'Guardião Teste' },
  'contato.hub0@viva360.com': { id: 'hub_0', role: 'SPACE', name: 'Santuário Teste' },
  'admin@viva360.com': { id: 'admin-001', role: 'ADMIN', name: 'Admin Viva360' },
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const precheckSchema = z.object({
  email: z.string().email(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'SPACE']).optional(),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    if (isMockMode()) {
       const strictUser = STRICT_MOCK_TEST_USERS[normalizedEmail];
       if (!strictUser) {
         return res.status(401).json({ error: 'Conta não autorizada no modo teste.' });
       }

       if (password !== MOCK_TEST_PASSWORD) {
         return res.status(401).json({ error: 'Senha inválida para conta de teste.' });
       }

       const userPayload = { id: strictUser.id, email: normalizedEmail, role: strictUser.role };

       const token = jwt.sign({ userId: userPayload.id, email: userPayload.email, role: userPayload.role }, JWT_SECRET, { expiresIn: '1h' });
       return res.json({
         user: userPayload,
         session: { access_token: token, refresh_token: 'mock-refresh' }
       });
    }

    const canLogin = await AuthService.canLoginWithEmail(normalizedEmail);
    if (!canLogin) {
      return res.status(401).json({ error: 'Conta não autorizada. Faça cadastro antes de entrar.' });
    }

    const data = await AuthService.login(email, password);
    return res.json(data);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, role } = registerSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    if (isMockMode()) {
       return res.status(403).json({
        error: 'Cadastro real desabilitado no modo teste. Use as contas pré-definidas.'
       });
    }

    if (STRICT_MOCK_TEST_USERS[normalizedEmail]) {
      return res.status(400).json({
        error: 'Este e-mail é reservado para ambiente de testes.'
      });
    }

    const data = await AuthService.register(normalizedEmail, password, name, role); // Pass role
    
    // Trigger Holistic Welcome Email (Async - Fire & Forget)
    import('../services/email.service').then(({ emailService }) => {
      emailService.send({
        to: normalizedEmail,
        subject: 'Bem-vindo ao Viva360 - Sua Jornada Começa Agora 🌿',
        template: 'WELCOME',
        context: { name }
      }).catch(err => console.error("Email Error:", err));
    });

    return res.status(201).json(data);
});

export const precheckLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email } = precheckSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    if (isMockMode()) {
      const strictUser = STRICT_MOCK_TEST_USERS[normalizedEmail];
      return res.json({ allowed: !!strictUser, role: strictUser?.role || null });
    }

    const profile = await AuthService.getAuthorizedProfileByEmail(normalizedEmail);
    return res.json({
      allowed: !!profile,
      role: profile?.role ? String(profile.role).toUpperCase() : null,
    });
});
