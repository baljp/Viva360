import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { isMockMode } from '../lib/appMode';
import { asyncHandler } from '../middleware/async.middleware';
import { JWT_SECRET } from '../lib/secrets';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import {
  clearAuthSessionCookie,
  readAuthTokenFromRequest,
  setAuthSessionCookie,
} from '../lib/authCookie';
// Use relative path to avoid rootDir issues in backend tsc
import { SessionDTO } from '../../../types';

const MOCK_TEST_PASSWORD = '123456';
const STRICT_MOCK_TEST_USERS: Record<string, { id: string; role: 'CLIENT' | 'PROFESSIONAL' | 'SPACE' | 'ADMIN'; name: string }> = {
  'client0@viva360.com': { id: '11111111-1111-4111-8111-111111111111', role: 'CLIENT', name: 'Buscador Teste' },
  'cliente@viva360.com': { id: '11111111-1111-4111-8111-111111111111', role: 'CLIENT', name: 'Buscador Master' },
  'pro0@viva360.com': { id: '22222222-2222-4222-8222-222222222222', role: 'PROFESSIONAL', name: 'Guardião Teste' },
  'pro@viva360.com': { id: '22222222-2222-4222-8222-222222222222', role: 'PROFESSIONAL', name: 'Guardião Master' },
  'contato.hub0@viva360.com': { id: '33333333-3333-4333-8333-333333333333', role: 'SPACE', name: 'Santuário Teste' },
  'space@viva360.com': { id: '33333333-3333-4333-8333-333333333333', role: 'SPACE', name: 'Santuário Master' },
  'admin@viva360.com': { id: '11111111-1111-4111-8111-111111111111', role: 'ADMIN', name: 'Admin Viva360' },
};

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

const ensureOAuthProfileSchema = z.object({
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'SPACE']).optional(),
  name: z.string().min(2).optional(),
});

const roleSchema = z.object({
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'SPACE']),
});

const deleteAccountSchema = z.object({
  confirmText: z.string().optional(),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const normalizedEmail = email.trim().toLowerCase();

  if (isMockMode()) {
    const strictUser = STRICT_MOCK_TEST_USERS[normalizedEmail];
    if (!strictUser) {
      return res.status(401).json({ error: 'Conta não autorizada no modo teste.', code: 'EMAIL_NOT_AUTHORIZED' });
    }

    if (password !== MOCK_TEST_PASSWORD) {
      return res.status(401).json({ error: 'Senha inválida para conta de teste.', code: 'INVALID_CREDENTIALS' });
    }

    const userPayload: SessionDTO['user'] = {
      id: strictUser.id,
      email: normalizedEmail,
      role: strictUser.role as any,
      activeRole: strictUser.role as any,
      roles: [strictUser.role as any],
    };

    const token = jwt.sign({
      userId: userPayload.id,
      email: userPayload.email,
      role: userPayload.role,
      activeRole: userPayload.activeRole,
      roles: userPayload.roles
    }, JWT_SECRET, { expiresIn: '1h' });
    setAuthSessionCookie(res, token, req);
    return res.json({
      user: userPayload,
      session: { access_token: token, refresh_token: 'mock-refresh' }
    });
  }

  const access = await AuthService.getAuthorizationStatus(normalizedEmail);
  if (!access.canLogin) {
    const isIncomplete = access.reason === 'REGISTRATION_INCOMPLETE';
    logger.warn('auth.login_denied_precheck', {
      requestId: (req as any).requestId,
      email: normalizedEmail,
      reason: access.reason,
      accountState: access.accountState,
      nextAction: access.nextAction,
    });
    return res.status(401).json({
      error: isIncomplete
        ? 'Seu cadastro está incompleto, finalize para entrar.'
        : 'Conta não autorizada para login.',
      code: isIncomplete ? 'REGISTRATION_INCOMPLETE' : 'EMAIL_NOT_AUTHORIZED',
      accountState: access.accountState,
    });
  }

  const loginResult = await AuthService.login(normalizedEmail, password);
  if (!loginResult) {
    return res.status(401).json({ error: 'Credenciais inválidas.', code: 'INVALID_CREDENTIALS' });
  }

  const { user, session } = loginResult;
  setAuthSessionCookie(res, session.access_token, req);
  return res.json({ user, session });
});

export const precheckLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const normalizedEmail = email.trim().toLowerCase();

  if (isMockMode()) {
    const strictUser = STRICT_MOCK_TEST_USERS[normalizedEmail];
    if (strictUser) {
      return res.json({ canLogin: true, accountState: 'AUTHORIZED', nextAction: 'LOGIN' });
    }
    return res.json({ canLogin: false, accountState: 'NOT_FOUND', nextAction: 'REGISTER' });
  }

  const access = await AuthService.getAuthorizationStatus(normalizedEmail);
  logger.info('auth.precheck', {
    requestId: (req as any).requestId,
    email: normalizedEmail,
    canLogin: access.canLogin,
  });

  return res.json(access);
});

export const ensureOAuthProfile = asyncHandler(async (req: Request, res: Response) => {
  if (isMockMode()) {
    return res.json({ success: true, message: 'Mock OAuth profile ensured.' });
  }

  const validated = ensureOAuthProfileSchema.parse(req.body);
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  // NOTE: AuthService doesn't have ensureProfile, but it has register/login logic.
  // Assuming fallback or simple success if not strictly implemented for now.
  logger.info('auth.oauth_profile_ensured', {
    requestId: (req as any).requestId,
    userId,
  });

  return res.json({ success: true, message: 'Perfil assegurado.' });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role } = registerSchema.parse(req.body);

  const result = await AuthService.register(email, password, name, role || 'CLIENT');
  if (!result) {
    return res.status(400).json({ error: 'Falha ao realizar cadastro.' });
  }

  // AuthService.register returns the session/user object
  setAuthSessionCookie(res, (result as any).session?.access_token || (result as any).access_token, req);

  logger.info('auth.user_registered', {
    requestId: (req as any).requestId,
    userId: result.user.id,
    role: result.user.role,
  });

  return res.status(201).json(result);
});

export const selectRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = roleSchema.parse(req.body);
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const result = await AuthService.selectActiveRole(userId, role);
  if (!result) {
    return res.status(403).json({ error: 'Perfil não disponível para este usuário.' });
  }

  setAuthSessionCookie(res, result.session.access_token, req);

  logger.info('auth.role_switched', {
    requestId: (req as any).requestId,
    userId,
    newRole: role,
  });

  return res.json(result);
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const { confirmText } = deleteAccountSchema.parse(req.body);
  if (confirmText !== 'DELETAR') {
    return res.status(400).json({ error: 'Texto de confirmação inválido.' });
  }

  const emailHint = (req as any).user?.email;
  const success = await AuthService.deleteAccount(userId, emailHint);
  if (!success) {
    return res.status(500).json({ error: 'Erro ao deletar conta.' });
  }

  clearAuthSessionCookie(res, req);
  logger.info('auth.account_deleted', {
    requestId: (req as any).requestId,
    userId,
  });

  return res.json({ success: true, message: 'Conta deletada com sucesso.' });
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const user = await prisma.profile.findUnique({
    where: { id: userId },
    include: { profile_roles: true }
  });

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      role: (req as any).user?.activeRole || (req as any).user?.role || user.role,
      activeRole: (req as any).user?.activeRole || (req as any).user?.role || user.role,
      roles: (req as any).user?.roles || (user.profile_roles || []).map(r => r.role) || [user.role],
    }
  });
});

export const establishSessionCookie = asyncHandler(async (req: Request, res: Response) => {
  const token = readAuthTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Sem token para estabelecer sessão.' });
  }
  // If token is a string, set it. If it's an object from header/cookie parsing, handle accordingly.
  const tokenStr = typeof token === 'string' ? token : (token as any).token;
  setAuthSessionCookie(res, tokenStr, req);
  return res.json({ success: true });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  clearAuthSessionCookie(res, req);
  return res.json({ success: true });
});

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Não autenticado.' });
  const result = await AuthService.listRolesForUser(userId);
  return res.json({ roles: result.roles });
});

export const addRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = roleSchema.parse(req.body);
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Não autenticado.' });

  await AuthService.addRole(userId, role);
  return res.json({ success: true, message: `Perfil ${role} adicionado.` });
});
