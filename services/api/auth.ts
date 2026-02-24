import type { User } from '../../types';
import { UserRole } from '../../types';
import {
  API_URL,
  AUTH_TOKEN_KEY,
  OAUTH_EXPECTED_EMAIL_KEY,
  OAUTH_INTENT_KEY,
  OAUTH_ROLE_KEY,
  SESSION_MODE_KEY,
  baseUser,
  decodeJwtPayload,
  emailsMatchForOAuth,
  fetchWithTimeout,
  hashString,
  inferRoleFromEmail,
  isLikelyNetworkError,
  normalizeEmail,
  normalizeProfilePayload,
  normalizeRole,
  normalizeRoleList,
  setSessionMode,
  clearSupabaseSessionArtifacts,
} from './session';
import {
  TEST_ACCOUNT_PASSWORD,
  canUseMockSession,
  clearMockArtifacts,
  clearTestMode,
  createMockUser,
  getMockSession,
  isStrictTestEmail,
  isTestRuntimeAllowed,
  promoteToRealSession,
  saveMockSession,
  MOCK_AUTH_TOKEN,
} from './mock';
import { supabase, isMockMode as isSupabaseMock, getOAuthRedirectUrl, validateOAuthRuntimeConfig } from '../../lib/supabase';
import { captureFrontendMessage } from '../../lib/frontendLogger';
import {
  clearOAuthIntentStorage,
  normalizeAuthRoleListPayload,
  normalizeAuthRoleMutationPayload,
  startGoogleOAuthRedirect,
} from './authUtils';

type RequestFn = (path: string, opts?: any) => Promise<any>;

type LoginEligibility = {
  allowed: boolean;
  role: UserRole | null;
  roles?: UserRole[];
  reason?: string | null;
  canRegister?: boolean;
  accountState?: string | null;
  nextAction?: string | null;
};

const toDomainAuthMessage = (input: { code?: string | null; reason?: string | null; fallback?: string }): string => {
  const code = String(input.code || '').toUpperCase();
  const reason = String(input.reason || '').toUpperCase();
  if (code === 'EMAIL_ALREADY_EXISTS') return 'Este e-mail já está cadastrado. Entre com ele ou use outro.';
  if (code === 'ROLE_ALREADY_ACTIVE') return 'Este perfil já existe neste e-mail.';
  if (code === 'REGISTRATION_INCOMPLETE' || reason === 'REGISTRATION_INCOMPLETE') return 'Seu cadastro está incompleto, finalize para entrar.';
  if (reason === 'INVITE_APPROVED_PENDING_REGISTRATION') return 'Seu e-mail está aprovado para cadastro. Finalize o cadastro para entrar.';
  if (reason === 'INVITE_PENDING_APPROVAL') return 'Seu convite está em análise. Aguarde aprovação para entrar.';
  if (reason === 'MOCK_STRICT_ONLY') return 'No modo teste, use apenas e-mails pré-definidos.';
  if (code === 'EMAIL_NOT_AUTHORIZED' || reason === 'EMAIL_NOT_AUTHORIZED') return 'Conta não autorizada. Faça cadastro antes de entrar.';
  if (code === 'INVALID_CREDENTIALS') return 'Credenciais inválidas.';
  return input.fallback || 'Não foi possível concluir autenticação.';
};

const fetchLoginEligibility = async (email: string): Promise<LoginEligibility> => {
  const normalized = normalizeEmail(email);
  if (!normalized) return { allowed: false, role: null };

  if (isSupabaseMock) {
    if (isStrictTestEmail(normalized)) {
      // Strict accounts are created by the backend in mock mode; treat as allowed.
      return {
        allowed: true,
        role: inferRoleFromEmail(normalized),
        roles: [inferRoleFromEmail(normalized)],
        reason: 'MOCK_TEST_ACCOUNT',
        canRegister: false,
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
    reason: payload?.reason ? String(payload.reason) : null,
    canRegister: !!payload?.canRegister,
    accountState: payload?.accountState ? String(payload.accountState) : null,
    nextAction: payload?.nextAction ? String(payload.nextAction) : null,
  };
};

const ensureOAuthProfile = async (accessToken: string, role: UserRole, name?: string) => {
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

const hydrateUserFromProfileApi = async (request: RequestFn, base: User): Promise<User> => {
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

export const createAuthApi = (request: RequestFn) => {
  const auth: any = {};

  auth.loginWithPassword = async (email: string, password: string): Promise<User> => {
    const normalized = normalizeEmail(email);
    if (!normalized || !password) throw new Error('Preencha e-mail e senha.');

    if (isSupabaseMock) {
      if (!isStrictTestEmail(normalized)) throw new Error('No modo teste, use apenas e-mails pré-definidos.');
      if (password !== TEST_ACCOUNT_PASSWORD) throw new Error('Senha de teste inválida.');
      const mockUser = createMockUser(normalized);
      saveMockSession(mockUser);
      return mockUser;
    }

    if (isTestRuntimeAllowed() && isStrictTestEmail(normalized)) {
      if (password !== TEST_ACCOUNT_PASSWORD) throw new Error('Senha de teste inválida.');
      const mockUser = createMockUser(normalized);
      saveMockSession(mockUser);
      return mockUser;
    }

    // Primary path: backend /auth/login.
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized, password }),
        timeoutMs: 12000,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          toDomainAuthMessage({
            code: errorData?.code,
            reason: errorData?.reason,
            fallback: errorData.error || response.statusText || 'Falha no login',
          }),
        );
      }

      const payload = await response.json();
      const token = payload?.session?.access_token;
      promoteToRealSession(token);
      clearOAuthIntentStorage();

      // Best-effort: establish Supabase session too.
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
        if (error) throw error;
        if (data.session?.access_token) {
          promoteToRealSession(data.session.access_token);
          clearOAuthIntentStorage();
        }
      } catch {
        // Ignore.
      }

      const user = await auth.getCurrentSession();
      if (user) return user;

      return baseUser({
        id: payload?.user?.id || `user_${hashString(normalized).slice(0, 8)}`,
        email: payload?.user?.email || normalized,
        name: payload?.user?.name || normalized.split('@')[0] || 'Viajante',
        role: normalizeRole(payload?.user?.role || inferRoleFromEmail(normalized)),
        activeRole: normalizeRole(payload?.user?.activeRole || payload?.user?.role || inferRoleFromEmail(normalized)),
        roles: normalizeRoleList(
          Array.isArray(payload?.user?.roles) ? payload.user.roles : [payload?.user?.role || inferRoleFromEmail(normalized)],
        ),
        avatar: payload?.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${payload?.user?.id || normalized}`,
      });
    } catch (err: any) {
      if (!isLikelyNetworkError(err?.message)) throw err;

      const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
      if (error) throw error;
      if (!data.session?.access_token) throw new Error('Login failed: No session data returned');

      promoteToRealSession(data.session.access_token);
      clearOAuthIntentStorage();

      const user = await auth.getCurrentSession();
      if (!user) throw new Error('Sessão criada, mas sem usuário válido.');
      return user;
    }
  };

  auth.loginWithGoogle = async (role: UserRole = UserRole.CLIENT, expectedEmail?: string): Promise<User> => {
    const normalizedExpectedEmail = normalizeEmail(expectedEmail || '');

    if (isSupabaseMock) {
      if (!isStrictTestEmail(normalizedExpectedEmail)) {
        throw new Error('Google em modo teste aceita apenas contas pré-definidas.');
      }
      const mockUser = createMockUser(normalizedExpectedEmail, role, 'Conta Google (Teste)');
      saveMockSession(mockUser);
      return mockUser;
    }

    if (isTestRuntimeAllowed() && isStrictTestEmail(normalizedExpectedEmail)) {
      const mockUser = createMockUser(normalizedExpectedEmail, role, 'Conta Google (Teste)');
      saveMockSession(mockUser);
      return mockUser;
    }

    const oauthValidation = validateOAuthRuntimeConfig();
    if (!oauthValidation.ok) {
      const details = oauthValidation.issues.length
        ? `Config faltando: ${oauthValidation.issues.join(' | ')}`
        : 'Configuração OAuth/Supabase inválida.';
      throw new Error(`Login com Google indisponível. ${details}`);
    }

    if (normalizedExpectedEmail) {
      try {
        await fetchLoginEligibility(normalizedExpectedEmail);
      } catch {
        // proceed
      }
    }

    const redirectTo = getOAuthRedirectUrl();
    return startGoogleOAuthRedirect({
      redirectTo,
      expectedEmail: normalizedExpectedEmail,
      intent: 'login',
    });
  };

  auth.registerWithGoogle = async (role: UserRole = UserRole.CLIENT, expectedEmail?: string): Promise<User> => {
    const normalizedExpectedEmail = normalizeEmail(expectedEmail || '');

    if (isSupabaseMock) {
      throw new Error('Cadastro com Google indisponível em modo teste.');
    }

    const oauthValidation = validateOAuthRuntimeConfig();
    if (!oauthValidation.ok) {
      const details = oauthValidation.issues.length
        ? `Config faltando: ${oauthValidation.issues.join(' | ')}`
        : 'Configuração OAuth/Supabase inválida.';
      throw new Error(`Cadastro com Google indisponível. ${details}`);
    }

    let intent: 'register' | 'login' = 'register';
    if (normalizedExpectedEmail) {
      const eligibility = await fetchLoginEligibility(normalizedExpectedEmail);
      if (eligibility.allowed) intent = 'login';
      else if (!eligibility.canRegister) throw new Error('Este e-mail não está aprovado para cadastro com Google.');
    }

    const redirectTo = getOAuthRedirectUrl();
    return startGoogleOAuthRedirect({
      redirectTo,
      expectedEmail: normalizedExpectedEmail,
      intent,
      role,
    });
  };

  auth.register = async (data: any): Promise<User> => {
    const normalizedEmailValue = normalizeEmail(String(data.email || ''));
    const normalizedRole = normalizeRole(data.role);

    if (isSupabaseMock || canUseMockSession()) {
      throw new Error('Cadastro real está desabilitado no modo teste.');
    }

    const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmailValue,
        password: data.password,
        name: data.name,
        role: normalizedRole,
      }),
      timeoutMs: 12000,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        toDomainAuthMessage({
          code: errorData?.code,
          reason: errorData?.reason,
          fallback: errorData.error || response.statusText || 'Falha no cadastro',
        }),
      );
    }

    const payload = await response.json();
    const fallbackToken = payload?.session?.access_token;
    if (fallbackToken) promoteToRealSession(fallbackToken);

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmailValue,
        password: data.password,
      });
      if (error) throw error;
      if (signInData.session?.access_token) {
        promoteToRealSession(signInData.session.access_token);
        clearOAuthIntentStorage();
      }
    } catch {
      // ignore
    }

    const sessionUser = await auth.getCurrentSession();
    if (sessionUser) return sessionUser;

    return baseUser({
      id: payload?.user?.id || `user_${hashString(normalizedEmailValue).slice(0, 8)}`,
      email: payload?.user?.email || normalizedEmailValue,
      name: payload?.user?.name || data.name || normalizedEmailValue.split('@')[0] || 'Viajante',
      role: normalizeRole(payload?.user?.role || normalizedRole),
      activeRole: normalizeRole(payload?.user?.activeRole || payload?.user?.role || normalizedRole),
      roles: normalizeRoleList(Array.isArray(payload?.user?.roles) ? payload.user.roles : [payload?.user?.role || normalizedRole]),
      avatar: payload?.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${normalizedEmailValue}`,
    });
  };

  auth.getCurrentSession = async (): Promise<User | null> => {
    if (!canUseMockSession() && localStorage.getItem('viva360.mock_user')) {
      clearMockArtifacts({ preserveAuthToken: true });
      localStorage.removeItem(SESSION_MODE_KEY);
      captureFrontendMessage('Sessão mock bloqueada fora de ambiente de teste local.');
    }

    const mockSession = getMockSession();
    if (mockSession) return mockSession;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const expectedOAuthEmail = normalizeEmail(localStorage.getItem(OAUTH_EXPECTED_EMAIL_KEY) || '');
        const sessionEmail = normalizeEmail(session.user.email || '');
        if (expectedOAuthEmail && sessionEmail && !emailsMatchForOAuth(expectedOAuthEmail, sessionEmail)) {
          await supabase.auth.signOut();
          clearMockArtifacts();
          localStorage.removeItem(SESSION_MODE_KEY);
          throw new Error('A conta do Google selecionada não corresponde ao e-mail informado.');
        }
        localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);

        const oauthIntent = String(localStorage.getItem(OAUTH_INTENT_KEY) || '').toLowerCase();
        const oauthRole = normalizeRole(localStorage.getItem(OAUTH_ROLE_KEY) || '');

        promoteToRealSession(session.access_token);

        let eligibility = await fetchLoginEligibility(sessionEmail);
        if (!eligibility.allowed) {
          try {
            await ensureOAuthProfile(
              session.access_token,
              oauthRole || (UserRole.CLIENT as any),
              String((session.user.user_metadata as any)?.full_name || '').trim() || undefined,
            );
            try {
              eligibility = await fetchLoginEligibility(sessionEmail);
            } catch {
              eligibility = {
                allowed: true,
                role: oauthRole || UserRole.CLIENT,
                roles: [oauthRole || UserRole.CLIENT],
                reason: null,
                canRegister: false,
                accountState: 'ACTIVE',
                nextAction: 'LOGIN',
              };
            }
          } catch {
            // ignore
          }
        }

        if (!eligibility.allowed && !eligibility.canRegister && eligibility.accountState === 'BLOCKED') {
          await supabase.auth.signOut();
          clearMockArtifacts();
          localStorage.removeItem(SESSION_MODE_KEY);
          throw new Error('Conta bloqueada. Entre em contato com o suporte.');
        }

        if (oauthIntent === 'login' && oauthRole) {
          const alreadyHasRole = Array.isArray(eligibility.roles) && eligibility.roles.includes(oauthRole);
          if (!alreadyHasRole) {
            try {
              await auth.addRole(oauthRole as any);
              await auth.selectRole(oauthRole as any);
              try {
                eligibility = await fetchLoginEligibility(sessionEmail);
              } catch {
                // ignore
              }
            } catch {
              // ignore
            }
          }
        }

        const metadataRoleValue = String((session.user.user_metadata as any)?.role || '').trim();
        const metadataRole = metadataRoleValue ? normalizeRole(metadataRoleValue) : null;
        const resolvedRole = eligibility.role || metadataRole || inferRoleFromEmail(sessionEmail);
        const resolvedRoles = normalizeRoleList(
          eligibility.roles && eligibility.roles.length > 0 ? eligibility.roles : [resolvedRole],
        );

        clearOAuthIntentStorage();

        return hydrateUserFromProfileApi(
          request,
          baseUser({
            id: session.user.id,
            email: sessionEmail,
            name: (session.user.user_metadata as any).full_name || session.user.email?.split('@')[0] || 'Viajante',
            role: resolvedRole,
            activeRole: resolvedRole,
            roles: resolvedRoles,
            avatar: (session.user.user_metadata as any).avatar_url || '',
          }),
        );
      }
    } catch (err: any) {
      if (err?.message?.includes('não corresponde') || err?.message?.includes('bloqueada')) throw err;
      // Fallthrough to JWT hydration.
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    if (!payload?.email) return null;

    const isMockToken = MOCK_AUTH_TOKEN && token === MOCK_AUTH_TOKEN;
    if (isMockToken && !canUseMockSession()) {
      clearMockArtifacts();
      localStorage.removeItem(SESSION_MODE_KEY);
      return null;
    }
    if (!isMockToken) setSessionMode('real');

    return hydrateUserFromProfileApi(
      request,
      baseUser({
        id: payload.userId || payload.sub || `user_${hashString(payload.email).slice(0, 8)}`,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0] || 'Viajante',
        role: normalizeRole(payload.role || inferRoleFromEmail(payload.email)),
        activeRole: normalizeRole(payload.activeRole || payload.role || inferRoleFromEmail(payload.email)),
        roles: normalizeRoleList(Array.isArray(payload.roles) ? payload.roles : [payload.activeRole || payload.role || inferRoleFromEmail(payload.email)]),
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${payload.email}`,
      }),
    );
  };

  auth.logout = async () => {
    try {
      if (!canUseMockSession()) {
        await supabase.auth.signOut({ scope: 'global' as any });
        await supabase.auth.signOut({ scope: 'local' as any });
      }
    } catch {
      // ignore
    }
    clearMockArtifacts();
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('viva360.mock_user');
    localStorage.removeItem(SESSION_MODE_KEY);
    clearOAuthIntentStorage();
    clearTestMode();
    clearSupabaseSessionArtifacts();
  };

  auth.deleteAccount = async () => {
    return await request('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmText: 'EXCLUIR' }),
    });
  };

  auth.listRoles = async (): Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }> => {
    const payload = await request('/auth/roles');
    return normalizeAuthRoleListPayload(payload);
  };

  auth.selectRole = async (role: UserRole): Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }> => {
    const payload = await request('/auth/select-role', {
      method: 'POST',
      body: JSON.stringify({ role: normalizeRole(role) }),
    });
    return normalizeAuthRoleMutationPayload(payload, role);
  };

  auth.addRole = async (role: UserRole): Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }> => {
    const payload = await request('/auth/add-role', {
      method: 'POST',
      body: JSON.stringify({ role: normalizeRole(role) }),
    });
    return normalizeAuthRoleMutationPayload(payload, role);
  };

  return auth as {
    loginWithPassword: (email: string, password: string) => Promise<User>;
    loginWithGoogle: (role?: UserRole, expectedEmail?: string) => Promise<User>;
    registerWithGoogle: (role?: UserRole, expectedEmail?: string) => Promise<User>;
    register: (data: any) => Promise<User>;
    getCurrentSession: () => Promise<User | null>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<any>;
    listRoles: () => Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }>;
    selectRole: (role: UserRole) => Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }>;
    addRole: (role: UserRole) => Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }>;
  };
};
