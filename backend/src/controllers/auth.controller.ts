import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { isMockMode } from '../services/supabase.service';
import { asyncHandler } from '../middleware/async.middleware';
import { JWT_SECRET } from '../lib/secrets';
import prisma from '../lib/prisma';

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

const ensureOAuthProfileSchema = z.object({
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'SPACE']).optional(),
  name: z.string().min(2).optional(),
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

export const ensureOAuthProfile = asyncHandler(async (req: any, res: Response) => {
    if (isMockMode()) {
      return res.status(403).json({ error: 'OAuth indisponível no modo teste.' });
    }

    const parsed = ensureOAuthProfileSchema.parse(req.body || {});
    const userId = String(req.user?.userId || req.user?.id || '').trim();
    const email = String(req.user?.email || '').trim().toLowerCase();

    if (!userId || !email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existing = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (existing) {
      return res.json({ ok: true, created: false, profile: existing });
    }

    const role = String(parsed.role || 'CLIENT').trim().toUpperCase();
    const safeRole = role === 'PROFESSIONAL' || role === 'SPACE' ? role : 'CLIENT';
    const fallbackName = parsed.name || email.split('@')[0] || 'Viajante';

    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email,
        name: fallbackName,
        role: safeRole,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`,
        personal_balance: 1000,
        multiplier: 1,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return res.status(201).json({ ok: true, created: true, profile });
});
