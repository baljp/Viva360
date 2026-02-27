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

       const userPayload = {
         id: strictUser.id,
         email: normalizedEmail,
         role: strictUser.role,
         activeRole: strictUser.role,
         roles: [strictUser.role],
       };

       const token = jwt.sign({ userId: userPayload.id, email: userPayload.email, role: userPayload.role }, JWT_SECRET, { expiresIn: '1h' });
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
        requestId: req.requestId,
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
        reason: access.reason,
        accountState: access.accountState,
        nextAction: access.nextAction,
      });
    }

    const data = await AuthService.login(email, password);
    const token = String(data?.session?.access_token || '').trim();
    if (token) setAuthSessionCookie(res, token, req);
    return res.json(data);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, role } = registerSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    if (isMockMode()) {
       return res.status(403).json({
        error: 'Cadastro real desabilitado no modo teste. Use as contas pré-definidas.',
        code: 'MOCK_MODE_BLOCKED'
       });
    }

    if (STRICT_MOCK_TEST_USERS[normalizedEmail]) {
      return res.status(400).json({
        error: 'Este e-mail é reservado para ambiente de testes.',
        code: 'TEST_EMAIL_RESERVED'
      });
    }

    logger.info('auth.register_request', {
      requestId: req.requestId,
      email: normalizedEmail,
      requestedRole: role || 'CLIENT',
    });
    const data = await AuthService.register(normalizedEmail, password, name, role);
    const token = String(data?.session?.access_token || '').trim();
    if (token) setAuthSessionCookie(res, token, req);

    import('../services/email.service').then(({ emailService }) => {
      emailService.send({
        to: normalizedEmail,
        subject: 'Bem-vindo ao Viva360 - Sua Jornada Começa Agora 🌿',
        template: 'WELCOME',
        context: { name }
      }).catch(err => logger.warn('email.welcome_send_failed', err));
    });

    return res.status(201).json(data);
});

export const precheckLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email } = precheckSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    if (isMockMode()) {
      const strictUser = STRICT_MOCK_TEST_USERS[normalizedEmail];
      const role = strictUser?.role || null;
      return res.json({
        allowed: !!strictUser,
        role,
        roles: role ? [role] : [],
        reason: strictUser ? 'PROFILE_ACTIVE' : 'EMAIL_NOT_AUTHORIZED',
        canRegister: false,
        accountState: strictUser ? 'ACTIVE' : 'NOT_AUTHORIZED',
        nextAction: strictUser ? 'LOGIN' : 'REQUEST_INVITE',
      });
    }

    const access = await AuthService.getAuthorizationStatus(normalizedEmail);
    const registerRoles = access.canRegister
      ? (access.reason === 'OPEN_CLIENT_REGISTRATION' ? ['CLIENT'] : (access.roles?.length ? access.roles : (access.role ? [access.role] : [])))
      : [];
    logger.info('auth.precheck_login', {
      requestId: req.requestId,
      email: normalizedEmail,
      allowed: access.canLogin,
      canRegister: access.canRegister,
      reason: access.reason,
      accountState: access.accountState,
      nextAction: access.nextAction,
      registerRoles,
    });
    return res.json({
      allowed: access.canLogin,
      role: access.role,
      roles: access.roles,
      registerRoles,
      reason: access.reason,
      canRegister: access.canRegister,
      accountState: access.accountState,
      nextAction: access.nextAction,
    });
});

export const ensureOAuthProfile = asyncHandler(async (req: Request, res: Response) => {
    if (isMockMode()) {
      return res.status(403).json({ error: 'OAuth indisponível no modo teste.', code: 'MOCK_MODE_BLOCKED' });
    }

    const parsed = ensureOAuthProfileSchema.parse(req.body || {});
    const userId = String(req.user?.userId || req.user?.id || '').trim();
    const email = String(req.user?.email || '').trim().toLowerCase();

    if (!userId || !email) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const existing = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, active_role: true },
    });
    if (existing) {
      return res.json({ ok: true, created: false, profile: existing });
    }

    const access = await AuthService.getAuthorizationStatus(email);
    // For OAuth users, always allow profile creation if not explicitly blocked
    if (!access.canRegister && access.reason === 'EMAIL_BLOCKED') {
      return res.status(403).json({
        error: 'Conta bloqueada. Entre em contato com o suporte.',
        code: 'EMAIL_BLOCKED',
        reason: access.reason,
      });
    }

    const requestedRole = String(parsed.role || '').trim().toUpperCase();
    if ((requestedRole === 'PROFESSIONAL' || requestedRole === 'SPACE') && access.reason === 'OPEN_CLIENT_REGISTRATION') {
      logger.warn('auth.oauth_profile_denied_role_requires_invite', {
        requestId: req.requestId,
        email,
        requestedRole,
        reason: access.reason,
      });
      return res.status(403).json({
        error: 'Cadastro de Guardião/Santuário exige convite ou aprovação prévia.',
        code: 'INVITE_REQUIRED_FOR_ROLE',
        reason: access.reason,
        allowedRoles: ['CLIENT'],
      });
    }

    const role = String(
      access.reason === 'OPEN_CLIENT_REGISTRATION'
        ? (parsed.role || 'CLIENT')
        : (access.role || parsed.role || 'CLIENT'),
    ).trim().toUpperCase();
    const safeRole = role === 'PROFESSIONAL' || role === 'SPACE' ? role : 'CLIENT';
    const fallbackName = parsed.name || email.split('@')[0] || 'Viajante';

    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email,
        name: fallbackName,
        role: safeRole,
        active_role: safeRole,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`,
        personal_balance: 1000,
        multiplier: 1,
      },
      select: { id: true, email: true, name: true, role: true, active_role: true },
    });

    await prisma.profileRole.upsert({
      where: {
        profile_id_role: {
          profile_id: userId,
          role: safeRole,
        },
      },
      create: {
        profile_id: userId,
        role: safeRole,
      },
      update: {},
    });

    await AuthService.markAllowlistAsUsed(email, userId);

    return res.status(201).json({ ok: true, created: true, profile });
});

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || req.user?.id || '').trim();
  const email = String(req.user?.email || '').trim().toLowerCase();
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const data = await AuthService.listRolesForUser(userId, email);
  return res.json({
    status: 'OK',
    code: data.registrationIncomplete ? 'REGISTRATION_INCOMPLETE' : 'ROLES_FETCHED',
    message: data.registrationIncomplete
      ? 'Seu cadastro está incompleto, finalize para habilitar todos os perfis.'
      : 'Perfis carregados com sucesso.',
    requestId: req.requestId,
    data,
  });
});

export const selectRole = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || req.user?.id || '').trim();
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const { role } = roleSchema.parse(req.body || {});
  const data = await AuthService.selectActiveRole(userId, role);
  return res.json({
    status: 'OK',
    code: 'ROLE_SELECTED',
    message: 'Perfil ativo atualizado.',
    requestId: req.requestId,
    data,
  });
});

export const addRole = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || req.user?.id || '').trim();
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const { role } = roleSchema.parse(req.body || {});
  const data = await AuthService.addRole(userId, role);
  return res.status(201).json({
    status: 'OK',
    code: 'ROLE_ADDED',
    message: 'Novo perfil habilitado para esta conta.',
    requestId: req.requestId,
    data,
  });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || req.user?.id || '').trim();
  const email = String(req.user?.email || '').trim().toLowerCase();
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const payload = deleteAccountSchema.parse(req.body || {});
  if (String(payload.confirmText || '').trim().toUpperCase() !== 'EXCLUIR') {
    return res.status(400).json({
      error: 'Confirmação inválida. Digite EXCLUIR para confirmar.',
      code: 'DELETE_CONFIRMATION_REQUIRED',
    });
  }

  const data = await AuthService.deleteAccount(userId, email);
  return res.json({
    status: 'OK',
    code: 'ACCOUNT_DELETED',
    message: 'Conta excluída definitivamente.',
    requestId: req.requestId,
    data,
  });
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || req.user?.id || '').trim();
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  return res.json({
    ok: true,
    user: {
      id: userId,
      email: req.user?.email || null,
      role: req.user?.role || 'CLIENT',
      activeRole: req.user?.activeRole || req.user?.role || 'CLIENT',
      roles: Array.isArray(req.user?.roles) && req.user?.roles.length ? req.user?.roles : [req.user?.role || 'CLIENT'],
    },
  });
});

export const establishSessionCookie = asyncHandler(async (req: Request, res: Response) => {
  const { token } = readAuthTokenFromRequest(req);
  if (!token) {
    return res.status(400).json({ error: 'Missing authentication token', code: 'TOKEN_REQUIRED' });
  }
  setAuthSessionCookie(res, token, req);
  return res.json({ ok: true });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  clearAuthSessionCookie(res, req);
  return res.json({ ok: true });
});
