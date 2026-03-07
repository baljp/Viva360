import type { User } from '../../types';
import { UserRole } from '../../types';
import type { AuthApi, AuthRegisterInput } from './authProxy';
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
import { captureFrontendMessage, errorMessage as frontendErrorMessage } from '../../lib/frontendLogger';
import {
  clearOAuthIntentStorage,
  normalizeAuthRoleListPayload,
  normalizeAuthRoleMutationPayload,
  startGoogleOAuthRedirect,
} from './authUtils';
import {
  type RequestFn,
  type SupabaseUserMetadata,
  ensureOAuthProfile,
  fetchLoginEligibility,
  hydrateUserFromProfileApi,
  toDomainAuthMessage,
} from './authDomainHelpers';

type ScopedSignOut = { scope: 'global' | 'local' };
const getUserMetadata = (metadata: unknown): SupabaseUserMetadata => (
  metadata && typeof metadata === 'object' ? metadata as SupabaseUserMetadata : {}
);

export const createAuthApi = (request: RequestFn) => {
  const auth = {} as AuthApi;
  const errCode = (error: unknown) =>
    (error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code || '') : '');
  const errReason = (error: unknown) =>
    (error && typeof error === 'object' && 'reason' in error ? String((error as { reason?: unknown }).reason || '') : '');

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
      const accessToken = payload?.session?.access_token;
      if (accessToken) promoteToRealSession();
      clearOAuthIntentStorage();

      // Best-effort: establish Supabase session too.
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
        if (error) throw error;
        if (data.session?.access_token) {
          promoteToRealSession();
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
    } catch (err: unknown) {
      captureFrontendMessage('auth.login_with_password.failed', {
        mode: 'backend-then-supabase',
        code: errCode(err) || null,
        reason: errReason(err) || null,
        message: frontendErrorMessage(err),
      });
      if (!isLikelyNetworkError(frontendErrorMessage(err))) throw err;

      const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
      if (error) throw error;
      if (!data.session?.access_token) throw new Error('Login failed: No session data returned');

      promoteToRealSession();
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
      else if (
        role !== UserRole.CLIENT
        && Array.isArray(eligibility.registerRoles)
        && eligibility.registerRoles.length > 0
        && !eligibility.registerRoles.includes(role)
      ) {
        throw new Error('Cadastro de Guardião/Santuário exige convite ou aprovação prévia.');
      }
    }

    const redirectTo = getOAuthRedirectUrl();
    return startGoogleOAuthRedirect({
      redirectTo,
      expectedEmail: normalizedExpectedEmail,
      intent,
      role,
    });
  };

  auth.register = async (data: AuthRegisterInput): Promise<User> => {
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
      captureFrontendMessage('auth.register.failed', {
        code: errorData?.code || null,
        reason: errorData?.reason || null,
        accountState: errorData?.accountState || null,
        nextAction: errorData?.nextAction || null,
      });
      throw new Error(
        toDomainAuthMessage({
          code: errorData?.code,
          reason: errorData?.reason,
          fallback: errorData.error || response.statusText || 'Falha no cadastro',
        }),
      );
    }

    const payload = await response.json();
    const accessToken = payload?.session?.access_token;
    if (accessToken) promoteToRealSession();

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmailValue,
        password: data.password,
      });
      if (error) throw error;
      if (signInData.session?.access_token) {
        promoteToRealSession();
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

        promoteToRealSession();
        try {
          const cookieResponse = await fetchWithTimeout(`${API_URL}/auth/session/cookie`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: '{}',
            timeoutMs: 3000,
          });
          if (!cookieResponse.ok) {
            captureFrontendMessage('auth.session.cookie_bootstrap_deferred', {
              code: `cookie_${cookieResponse.status}`,
            });
          }
        } catch (cookieError) {
          captureFrontendMessage('auth.session.cookie_bootstrap_deferred', {
            code: cookieError instanceof Error ? cookieError.message : 'cookie_bootstrap_failed',
          });
        }

        const userMetadata = getUserMetadata(session.user.user_metadata);
        const metadataRoleValue = String(userMetadata.role || '').trim();
        const metadataRole = metadataRoleValue ? normalizeRole(metadataRoleValue) : null;
        const optimisticRole = oauthRole || metadataRole || inferRoleFromEmail(sessionEmail);
        let eligibility = await fetchLoginEligibility(sessionEmail, { timeoutMs: 2000 }).catch(() => ({
          allowed: true,
          role: optimisticRole,
          roles: [optimisticRole],
          reason: 'SESSION_ELIGIBILITY_TIMEOUT',
          canRegister: false,
          accountState: 'ACTIVE',
          nextAction: 'LOGIN',
        }));
        if (!eligibility.allowed) {
          try {
            await ensureOAuthProfile(
              session.access_token,
              oauthRole || UserRole.CLIENT,
              String(userMetadata.full_name || '').trim() || undefined,
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
              await auth.addRole(oauthRole);
              await auth.selectRole(oauthRole);
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
            name: userMetadata.full_name || session.user.email?.split('@')[0] || 'Viajante',
            role: resolvedRole,
            activeRole: resolvedRole,
            roles: resolvedRoles,
            avatar: userMetadata.avatar_url || '',
          }),
        );
      }
    } catch (err: unknown) {
      const msg = frontendErrorMessage(err);
      if (msg.includes('não corresponde') || msg.includes('bloqueada')) throw err;
      // Fallthrough to JWT hydration.
    }

    try {
      const sessionPayload = await request<{ user?: Record<string, unknown> }>('/auth/session', {
        purpose: 'session-cookie-restore',
        timeoutMs: 3000,
        retries: 0,
      });
      const rawUser = sessionPayload?.user || {};
      const id = String(rawUser.id || '').trim();
      const email = String(rawUser.email || '').trim().toLowerCase();
      if (id && email) {
        const role = normalizeRole(String(rawUser.activeRole || rawUser.role || inferRoleFromEmail(email)));
        return hydrateUserFromProfileApi(
          request,
          baseUser({
            id,
            email,
            name: email.split('@')[0] || 'Viajante',
            role,
            activeRole: role,
            roles: normalizeRoleList(
              Array.isArray(rawUser.roles)
                ? (rawUser.roles as Array<string | UserRole>)
                : [role],
            ),
          }),
        );
      }
    } catch {
      // Fall through to legacy JWT localStorage path.
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    const payloadEmail = typeof payload?.email === 'string' ? payload.email : '';
    if (!payloadEmail) return null;
    const payloadUserId = typeof payload?.userId === 'string' ? payload.userId : '';
    const payloadSub = typeof payload?.sub === 'string' ? payload.sub : '';
    const payloadName = typeof payload?.name === 'string' ? payload.name : '';
    const payloadRole = typeof payload?.role === 'string' ? payload.role : '';
    const payloadActiveRole = typeof payload?.activeRole === 'string' ? payload.activeRole : '';
    const payloadRoles = Array.isArray(payload?.roles) ? payload.roles : [];

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
        id: payloadUserId || payloadSub || `user_${hashString(payloadEmail).slice(0, 8)}`,
        email: payloadEmail,
        name: payloadName || payloadEmail.split('@')[0] || 'Viajante',
        role: normalizeRole(payloadRole || inferRoleFromEmail(payloadEmail)),
        activeRole: normalizeRole(payloadActiveRole || payloadRole || inferRoleFromEmail(payloadEmail)),
        roles: normalizeRoleList(payloadRoles.length ? payloadRoles.map((entry) => String(entry)) : [payloadActiveRole || payloadRole || inferRoleFromEmail(payloadEmail)]),
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${payloadEmail}`,
      }),
    );
  };

  auth.logout = async () => {
    try {
      await fetchWithTimeout(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        timeoutMs: 5000,
      });
    } catch {
      // ignore
    }
    try {
      if (!canUseMockSession()) {
        await supabase.auth.signOut({ scope: 'global' } as ScopedSignOut);
        await supabase.auth.signOut({ scope: 'local' } as ScopedSignOut);
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

  return auth;
};
