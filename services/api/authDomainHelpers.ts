import type { User } from '../../types';
import { UserRole } from '../../types';
import { supabase, isMockMode as isSupabaseMock } from '../../lib/supabase';
import {
  API_URL,
  fetchWithTimeout,
  inferRoleFromEmail,
  normalizeEmail,
  normalizeProfilePayload,
  normalizeRole,
  normalizeRoleList,
} from './session';
import type { RequestOptions } from './requestClient';
import { isStrictTestEmail } from './mock';

export type RequestFn = <T = unknown>(path: string, opts?: RequestOptions) => Promise<T>;
export type SupabaseUserMetadata = { full_name?: string; avatar_url?: string; role?: string };

export type LoginEligibility = {
  allowed: boolean;
  role: UserRole | null;
  roles?: UserRole[];
  registerRoles?: UserRole[];
  reason?: string | null;
  canRegister?: boolean;
  accountState?: string | null;
  nextAction?: string | null;
};

const mapProviderFallback = (rawFallback?: string): string | null => {
  const fallback = String(rawFallback || '').trim();
  const lower = fallback.toLowerCase();
  if (!lower) return null;

  if (lower.includes('email logins are disabled') || lower.includes('email login is disabled')) {
    return 'Login por e-mail está desabilitado no provedor. Verifique Email/Password em Supabase Auth > Providers.';
  }
  if (lower.includes('email signups are disabled') || lower.includes('signup is disabled')) {
    return 'Cadastro por e-mail está desabilitado no provedor. Verifique Email/Password em Supabase Auth > Providers.';
  }
  if (lower.includes('error sending confirmation email') || lower.includes('smtp')) {
    return 'Falha no envio de e-mail. Verifique SMTP/From/Template no Supabase Auth e confirme domínio/remetente.';
  }
  if (lower.includes('redirect') && lower.includes('not allowed')) {
    return 'Redirect de autenticação não permitido. Revise Site URL e Redirect URLs no Supabase Auth.';
  }
  if (lower.includes('email not confirmed')) {
    return 'E-mail ainda não confirmado. Verifique a caixa de entrada/spam ou ajuste política de confirmação no Supabase Auth.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Credenciais inválidas. Se o Google entra e senha não, confira se essa conta foi criada com senha e se Email/Password está habilitado.';
  }
  return null;
};

export const toDomainAuthMessage = (input: { code?: string | null; reason?: string | null; fallback?: string }): string => {
  const code = String(input.code || '').toUpperCase();
  const reason = String(input.reason || '').toUpperCase();
  if (code === 'EMAIL_ALREADY_EXISTS') return 'Este e-mail já está cadastrado. Entre com ele ou use outro.';
  if (code === 'ROLE_ALREADY_ACTIVE') return 'Este perfil já existe neste e-mail.';
  if (code === 'REGISTRATION_INCOMPLETE' || reason === 'REGISTRATION_INCOMPLETE') return 'Seu cadastro está incompleto, finalize para entrar.';
  if (code === 'EMAIL_NOT_CONFIRMED' || reason === 'EMAIL_NOT_CONFIRMED') return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  if (reason === 'INVITE_APPROVED_PENDING_REGISTRATION') return 'Seu e-mail está aprovado para cadastro. Finalize o cadastro para entrar.';
  if (reason === 'OPEN_CLIENT_REGISTRATION') return 'Conta ainda não cadastrada. Você pode criar um perfil Buscador sem convite.';
  if (reason === 'INVITE_PENDING_APPROVAL') return 'Seu convite está em análise. Aguarde aprovação para entrar.';
  if (reason === 'MOCK_STRICT_ONLY') return 'No modo teste, use apenas e-mails pré-definidos.';
  if (code === 'EMAIL_NOT_AUTHORIZED' || reason === 'EMAIL_NOT_AUTHORIZED') return 'Conta não autorizada. Faça cadastro antes de entrar.';
  if (code === 'INVITE_REQUIRED_FOR_ROLE') return 'Cadastro de Guardião/Santuário exige convite ou aprovação prévia. Buscador pode se cadastrar livremente.';
  if (code === 'INVALID_CREDENTIALS') return 'Credenciais inválidas.';
  const providerHint = mapProviderFallback(input.fallback);
  if (providerHint) return providerHint;
  return input.fallback || 'Não foi possível concluir autenticação.';
};

export const fetchLoginEligibility = async (email: string): Promise<LoginEligibility> => {
  const normalized = normalizeEmail(email);
  if (!normalized) return { allowed: false, role: null };

  if (isSupabaseMock) {
    if (isStrictTestEmail(normalized)) {
      return {
        allowed: true,
        role: inferRoleFromEmail(normalized),
        roles: [inferRoleFromEmail(normalized)],
        reason: 'MOCK_TEST_ACCOUNT',
        canRegister: false,
        registerRoles: [],
        accountState: 'ACTIVE',
        nextAction: 'LOGIN',
      };
    }
    return {
      allowed: false,
      role: null,
      roles: [],
      reason: 'MOCK_STRICT_ONLY',
      canRegister: false,
      registerRoles: [],
      accountState: 'NOT_AUTHORIZED',
      nextAction: 'REQUEST_INVITE',
    };
  }

  const response = await fetchWithTimeout(`${API_URL}/auth/precheck-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalized }),
    timeoutMs: 7000,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { allowed: false, role: null };

  const allowed = !!payload?.allowed;
  const role = payload?.role ? normalizeRole(String(payload.role)) : null;
  const roles = normalizeRoleList(Array.isArray(payload?.roles) ? payload.roles : role ? [role] : []);
  return {
    allowed,
    role,
    roles,
    registerRoles: normalizeRoleList(Array.isArray(payload?.registerRoles) ? payload.registerRoles : []),
    reason: payload?.reason ? String(payload.reason) : null,
    canRegister: !!payload?.canRegister,
    accountState: payload?.accountState ? String(payload.accountState) : null,
    nextAction: payload?.nextAction ? String(payload.nextAction) : null,
  };
};

export const ensureOAuthProfile = async (accessToken: string, role: UserRole, name?: string) => {
  const response = await fetchWithTimeout(`${API_URL}/auth/oauth/ensure-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      role: normalizeRole(role),
      ...(name ? { name } : {}),
    }),
    timeoutMs: 9000,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || response.statusText || 'Falha ao criar perfil OAuth.');
  }
};

export const hydrateUserFromProfileApi = async (request: RequestFn, base: User): Promise<User> => {
  const userId = String(base?.id || '').trim();
  if (!userId) return base;

  try {
    const profilePayload = await request(`/users/${userId}`, {
      purpose: 'session-hydration',
      timeoutMs: 7000,
      retries: 1,
    });
    const hydrated = normalizeProfilePayload(profilePayload || {});

    const merged: User = {
      ...base,
      ...hydrated,
      role: normalizeRole(base.activeRole || base.role || hydrated.activeRole || hydrated.role),
      activeRole: normalizeRole(base.activeRole || base.role || hydrated.activeRole || hydrated.role),
      roles: normalizeRoleList([
        ...(base.roles || []),
        ...(hydrated.roles || []),
        base.activeRole || base.role,
        hydrated.activeRole || hydrated.role,
      ]),
    };
    if (!merged.roles || merged.roles.length === 0) merged.roles = [merged.activeRole || merged.role];
    return merged;
  } catch {
    return base;
  }
};
