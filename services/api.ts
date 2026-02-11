import { User, Professional, UserRole, Appointment, Product, Notification, DailyJournalEntry } from '../types';
import { supabase, isMockMode as isSupabaseMock, getOAuthRedirectUrl, validateOAuthRuntimeConfig, TEST_MODE_ENABLED } from '../lib/supabase';
import { captureFrontendError, captureFrontendMessage } from '../lib/monitoring';
import { createRequestClient } from './api/requestClient';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_TOKEN_KEY = 'viva360.auth.token';
const MOCK_USER_KEY = 'viva360.mock_user';
const MOCK_AUTH_TOKEN = 'admin-excellence-2026';
const SESSION_MODE_KEY = 'viva360.session.mode';
const TEST_MODE_ACTIVATION_KEY = 'viva360.test_mode.active';
const OAUTH_EXPECTED_EMAIL_KEY = 'viva360.oauth.expected_email';
const OAUTH_INTENT_KEY = 'viva360.oauth.intent';
const OAUTH_ROLE_KEY = 'viva360.oauth.role';
const ORACLE_HISTORY_KEY = 'viva360.oracle.history';
const ORACLE_MAX_CACHE = 40;
const TEST_ACCOUNT_PASSWORD = '123456';
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const STRICT_TEST_ACCOUNTS: Record<string, { id: string; role: UserRole; name: string }> = {
    'client0@viva360.com': { id: 'client_0', role: UserRole.CLIENT, name: 'Buscador Teste' },
    'pro0@viva360.com': { id: 'pro_0', role: UserRole.PROFESSIONAL, name: 'Guardião Teste' },
    'contato.hub0@viva360.com': { id: 'hub_0', role: UserRole.SPACE, name: 'Santuário Teste' },
    'admin@viva360.com': { id: 'admin-001', role: UserRole.ADMIN, name: 'Admin Viva360' },
};
const STRICT_TEST_EMAILS = new Set(Object.keys(STRICT_TEST_ACCOUNTS));

const baseUser = (overrides: Partial<User> & Pick<User, 'id' | 'email' | 'name' | 'role'>): User => ({
    id: overrides.id,
    email: overrides.email,
    name: overrides.name,
    role: overrides.role,
    activeRole: overrides.activeRole || overrides.role,
    roles: overrides.roles || [overrides.activeRole || overrides.role],
    avatar: overrides.avatar || '',
    karma: overrides.karma ?? 0,
    streak: overrides.streak ?? 0,
    multiplier: overrides.multiplier ?? 1,
    personalBalance: overrides.personalBalance ?? 0,
    corporateBalance: overrides.corporateBalance ?? 0,
    plantStage: overrides.plantStage || 'seed',
    plantXp: overrides.plantXp ?? 0,
    plantHealth: overrides.plantHealth ?? 100,
    plantType: overrides.plantType,
    journeyType: overrides.journeyType,
    lastCheckIn: overrides.lastCheckIn,
    lastWateredAt: overrides.lastWateredAt,
    lastBlessingAt: overrides.lastBlessingAt,
    lastMood: overrides.lastMood,
    wateredBy: overrides.wateredBy || [],
    intention: overrides.intention,
    constellation: overrides.constellation || [],
    favorites: overrides.favorites || [],
    rating: overrides.rating,
    reviewCount: overrides.reviewCount,
    ritualsCompleted: overrides.ritualsCompleted,
    tribeInteractions: overrides.tribeInteractions,
    curationSessions: overrides.curationSessions,
    snaps: overrides.snaps || [],
});

const parseSafe = <T>(value: string | null): T | null => {
    if (!value) return null;
    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
};

const normalizeRole = (value?: string | UserRole): UserRole => {
    const role = String(value || '').toUpperCase();
    if (role === UserRole.PROFESSIONAL) return UserRole.PROFESSIONAL;
    if (role === UserRole.SPACE) return UserRole.SPACE;
    if (role === UserRole.ADMIN) return UserRole.ADMIN;
    return UserRole.CLIENT;
};

const normalizeRoleList = (values?: Array<string | UserRole | null | undefined>): UserRole[] => {
    const result: UserRole[] = [];
    (values || []).forEach((value) => {
        const normalized = normalizeRole(value || UserRole.CLIENT);
        if (!result.includes(normalized)) result.push(normalized);
    });
    return result;
};

const inferRoleFromEmail = (email: string): UserRole => {
    const normalized = email.toLowerCase();
    if (normalized.startsWith('admin') || normalized.includes('admin@')) return UserRole.ADMIN;
    if (normalized.startsWith('pro') || normalized.includes('guard')) return UserRole.PROFESSIONAL;
    if (normalized.startsWith('space') || normalized.includes('hub') || normalized.includes('santuario')) return UserRole.SPACE;
    return UserRole.CLIENT;
};

const hashString = (value: string): string => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
};

const isLikelyNetworkError = (message?: string): boolean => {
    const text = (message || '').toLowerCase();
    return ['network', 'fetch', 'dns', 'nxdomain', 'failed to fetch'].some((token) => text.includes(token));
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isStrictTestEmail = (email: string) => STRICT_TEST_EMAILS.has(normalizeEmail(email));
const isLocalDevRuntime = () => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};
const isTestRuntimeAllowed = () => isSupabaseMock || (TEST_MODE_ENABLED && isLocalDevRuntime());
const isTestModeActivated = () => {
    const activation = localStorage.getItem(TEST_MODE_ACTIVATION_KEY) === '1';
    const currentMode = getSessionMode() === 'mock';
    return activation || currentMode;
};
const activateTestMode = () => {
    localStorage.setItem(TEST_MODE_ACTIVATION_KEY, '1');
};
const clearTestMode = () => {
    localStorage.removeItem(TEST_MODE_ACTIVATION_KEY);
};
const canUseMockSession = () => isTestRuntimeAllowed() && isTestModeActivated();

const getSessionMode = (): 'mock' | 'real' | null => {
    const value = localStorage.getItem(SESSION_MODE_KEY);
    if (value === 'mock' || value === 'real') return value;
    return null;
};

const setSessionMode = (mode: 'mock' | 'real') => {
    localStorage.setItem(SESSION_MODE_KEY, mode);
};

const clearMockArtifacts = (opts?: { preserveAuthToken?: boolean }) => {
    const preserveAuthToken = !!opts?.preserveAuthToken;
    const keysToDrop = [
        MOCK_USER_KEY,
        ORACLE_HISTORY_KEY,
        OAUTH_EXPECTED_EMAIL_KEY,
        OAUTH_INTENT_KEY,
        OAUTH_ROLE_KEY,
    ];
    keysToDrop.forEach((key) => localStorage.removeItem(key));
    clearTestMode();

    if (!preserveAuthToken) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.includes('mock') || key.startsWith('viva360_tutorial_seen_')) {
            localStorage.removeItem(key);
        }
    }
};

const clearSupabaseSessionArtifacts = () => {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('sb-') && key.includes('-auth-token')) {
            localStorage.removeItem(key);
        }
    }
};

const createMockUser = (email: string, role?: UserRole, name?: string): User => {
    const normalizedEmail = normalizeEmail(email);
    const strictTest = STRICT_TEST_ACCOUNTS[normalizedEmail];
    const normalizedRole = role || strictTest?.role || inferRoleFromEmail(normalizedEmail);
    const prefix = normalizedRole === UserRole.PROFESSIONAL
        ? 'pro'
        : normalizedRole === UserRole.SPACE
            ? 'hub'
            : normalizedRole === UserRole.ADMIN
                ? 'admin'
                : 'client';
    const id = strictTest?.id || `${prefix}_${hashString(normalizedEmail).slice(0, 8)}`;
    const resolvedName = name || strictTest?.name || normalizedEmail.split('@')[0] || 'Viajante';

    return baseUser({
        id,
        email: normalizedEmail,
        name: resolvedName,
        role: normalizedRole,
        activeRole: normalizedRole,
        roles: [normalizedRole],
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${id}`,
        karma: normalizedRole === UserRole.PROFESSIONAL ? 1500 : 500,
    });
};

const saveMockSession = (user: User) => {
    if (!isTestRuntimeAllowed()) {
        throw new Error('Modo teste indisponível neste ambiente.');
    }
    activateTestMode();
    setSessionMode('mock');
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, MOCK_AUTH_TOKEN);
};

const promoteToRealSession = (token?: string) => {
    clearMockArtifacts({ preserveAuthToken: true });
    clearTestMode();
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    setSessionMode('real');
};

const getMockSession = (): User | null => {
    if (!isTestRuntimeAllowed() || !isTestModeActivated()) return null;
    if (getSessionMode() !== 'mock') return null;
    const mockUser = parseSafe<User>(localStorage.getItem(MOCK_USER_KEY));
    if (!mockUser) return null;
    if (!isStrictTestEmail(mockUser.email || '')) return null;
    return baseUser({
        ...mockUser,
        role: normalizeRole(mockUser.role),
        id: mockUser.id,
        email: mockUser.email || '',
        name: mockUser.name || 'Viajante',
    });
};

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
    if (code === 'EMAIL_NOT_AUTHORIZED' || reason === 'EMAIL_NOT_AUTHORIZED') return 'Conta não autorizada. Faça cadastro antes de entrar.';
    if (code === 'INVALID_CREDENTIALS') return 'Credenciais inválidas.';
    return input.fallback || 'Não foi possível concluir autenticação.';
};

const fetchLoginEligibility = async (email: string): Promise<LoginEligibility> => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return { allowed: false, role: null };

    try {
        const response = await fetch(`${API_URL}/auth/precheck-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) return { allowed: false, role: null };

        const allowed = !!payload?.allowed;
        const role = payload?.role ? normalizeRole(String(payload.role)) : null;
        const roles = normalizeRoleList(Array.isArray(payload?.roles) ? payload.roles : (role ? [role] : []));
        return {
            allowed,
            role,
            roles,
            reason: payload?.reason ? String(payload.reason) : null,
            canRegister: !!payload?.canRegister,
            accountState: payload?.accountState ? String(payload.accountState) : null,
            nextAction: payload?.nextAction ? String(payload.nextAction) : null,
        };
    } catch {
        throw new Error('Não foi possível validar sua conta agora. Tente novamente em instantes.');
    }
};

const ensureOAuthProfile = async (accessToken: string, role: UserRole, name?: string) => {
    const response = await fetch(`${API_URL}/auth/oauth/ensure-profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            role: normalizeRole(role),
            ...(name ? { name } : {}),
        }),
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || response.statusText || 'Falha ao criar perfil OAuth.');
    }
};

const decodeJwtPayload = (token: string): any | null => {
    try {
        const [, payload] = token.split('.');
        if (!payload) return null;
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
};

const normalizeProfilePayload = (input: any): User => {
    const role = normalizeRole(input?.role || input?.active_role || input?.activeRole || UserRole.CLIENT);
    const roles = normalizeRoleList(Array.isArray(input?.roles) ? input.roles : [role]);
    const snaps = Array.isArray(input?.snaps)
        ? input.snaps
            .map((entry: any) => ({
                id: String(entry?.id || ''),
                date: String(entry?.date || entry?.timestamp || new Date().toISOString()),
                image: String(entry?.image || entry?.photoThumb || entry?.thumb || ''),
                mood: String(entry?.mood || 'SERENO') as any,
                note: String(entry?.note || entry?.reflection || entry?.quote || ''),
                phrases: Array.isArray(entry?.phrases) ? entry.phrases : [],
            }))
            .filter((entry: any) => entry.id && entry.image)
        : [];
    return baseUser({
        id: String(input?.id || ''),
        email: String(input?.email || ''),
        name: String(input?.name || input?.full_name || 'Viajante'),
        role,
        activeRole: role,
        roles,
        avatar: String(input?.avatar || ''),
        karma: Number(input?.karma ?? 0),
        streak: Number(input?.streak ?? 0),
        multiplier: Number(input?.multiplier ?? 1),
        personalBalance: Number(input?.personalBalance ?? input?.personal_balance ?? 0),
        corporateBalance: Number(input?.corporateBalance ?? input?.corporate_balance ?? 0),
        plantStage: String(input?.plantStage || input?.plant_stage || 'seed') as any,
        plantXp: Number(input?.plantXp ?? input?.plant_xp ?? 0),
        plantHealth: Number(input?.plantHealth ?? input?.plant_health ?? 100),
        lastCheckIn: input?.lastCheckIn || input?.last_check_in || undefined,
        lastWateredAt: input?.lastWateredAt || input?.last_watered_at || undefined,
        lastBlessingAt: input?.lastBlessingAt || input?.last_blessing_at || undefined,
        lastMood: input?.lastMood || input?.last_mood || undefined,
        bio: input?.bio || undefined,
        location: input?.location || undefined,
        snaps,
    });
};

const hydrateUserFromProfileApi = async (base: User): Promise<User> => {
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
        if (!merged.roles || merged.roles.length === 0) {
            merged.roles = [merged.activeRole || merged.role];
        }
        return merged;
    } catch {
        return base;
    }
};

type OracleCachedEntry = {
    drawId: string;
    drawnAt: string;
    moodContext: string;
    card: {
        id: string;
        name: string;
        insight: string;
        element: string;
        category: string;
    };
};

const getOracleCache = (): OracleCachedEntry[] => parseSafe<OracleCachedEntry[]>(localStorage.getItem(ORACLE_HISTORY_KEY)) || [];

const saveOracleCache = (entries: OracleCachedEntry[]) => {
    localStorage.setItem(ORACLE_HISTORY_KEY, JSON.stringify(entries.slice(0, ORACLE_MAX_CACHE)));
};

const isSameDay = (isoA: string, isoB: string) => {
    const a = new Date(isoA);
    const b = new Date(isoB);
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
};

const buildOracleFallbackCard = (mood: string) => {
    const deck = [
        { name: 'Respiração da Aurora', insight: 'Hoje, menos pressa revela mais direção.', element: 'Ar', category: 'consciencia' },
        { name: 'Raiz Serena', insight: 'Sua estabilidade cresce quando você honra o presente.', element: 'Terra', category: 'cura_emocional' },
        { name: 'Chama Gentil', insight: 'Ação pequena e consistente vence o excesso de força.', element: 'Fogo', category: 'acao_foco' },
        { name: 'Mar Interno', insight: 'Sentir também é avançar. Escute o que acalma.', element: 'Agua', category: 'cura_emocional' },
    ];
    const seed = hashString(`${mood}:${new Date().toISOString().slice(0, 10)}`);
    const idx = parseInt(seed.slice(0, 2), 16) % deck.length;
    return { id: `oracle_${seed.slice(0, 10)}`, ...deck[idx] };
};

const getHeader = () => {
    const isMockSession = canUseMockSession() && getSessionMode() === 'mock' && !!localStorage.getItem(MOCK_USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || (isMockSession ? MOCK_AUTH_TOKEN : '');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const request = createRequestClient({
    apiUrl: API_URL,
    getHeaders: getHeader,
    retryableStatusCodes: RETRYABLE_STATUS_CODES,
    isLikelyNetworkError,
    captureError: (error, context) => {
        captureFrontendError(error, {
            endpoint: context.endpoint,
            purpose: context.purpose || 'request',
        });
    },
});

export const api = {
    auth: {
        loginWithPassword: async (email: string, password: string): Promise<User> => {
            const normalizedEmail = normalizeEmail(email);
            if (!normalizedEmail || !password) {
                throw new Error('Preencha e-mail e senha.');
            }

            if (isTestRuntimeAllowed() && isStrictTestEmail(normalizedEmail)) {
                if (password !== TEST_ACCOUNT_PASSWORD) {
                    throw new Error('Senha de teste inválida.');
                }
                const mockUser = createMockUser(normalizedEmail);
                saveMockSession(mockUser);
                return mockUser;
            }
            if (isSupabaseMock) {
                throw new Error('No modo teste, use apenas e-mails pré-definidos.');
            }

            // Go straight to backend login - no pre-check needed.
            // The backend validates credentials and auto-creates profile if missing.

            // Primary path: backend /auth/login (works even when Supabase requires email confirmation).
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: normalizedEmail, password })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(toDomainAuthMessage({
                        code: errorData?.code,
                        reason: errorData?.reason,
                        fallback: errorData.error || response.statusText || 'Falha no login',
                    }));
                }

                const payload = await response.json();
                const token = payload?.session?.access_token;
                promoteToRealSession(token);
                localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
                localStorage.removeItem(OAUTH_INTENT_KEY);
                localStorage.removeItem(OAUTH_ROLE_KEY);

                // Best-effort: also establish a Supabase session when possible.
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
                    if (error) throw error;
                    if (data.session?.access_token) {
                        promoteToRealSession(data.session.access_token);
                        localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
                    }
                } catch {
                    // Ignore - internal JWT keeps the user authenticated.
                }

                const user = await api.auth.getCurrentSession();
                if (user) return user;

                return baseUser({
                    id: payload?.user?.id || `user_${hashString(normalizedEmail).slice(0, 8)}`,
                    email: payload?.user?.email || normalizedEmail,
                    name: payload?.user?.name || normalizedEmail.split('@')[0] || 'Viajante',
                    role: normalizeRole(payload?.user?.role || inferRoleFromEmail(normalizedEmail)),
                    activeRole: normalizeRole(payload?.user?.activeRole || payload?.user?.role || inferRoleFromEmail(normalizedEmail)),
                    roles: normalizeRoleList(Array.isArray(payload?.user?.roles) ? payload.user.roles : [payload?.user?.role || inferRoleFromEmail(normalizedEmail)]),
                    avatar: payload?.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${payload?.user?.id || normalizedEmail}`,
                });
            } catch (err: any) {
                // If backend is unreachable, fallback to Supabase auth.
                if (!isLikelyNetworkError(err?.message)) {
                    throw err;
                }

                const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
                if (error) throw error;
                if (!data.session?.access_token) {
                    throw new Error('Login failed: No session data returned');
                }

                promoteToRealSession(data.session.access_token);
                localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
                localStorage.removeItem(OAUTH_INTENT_KEY);
                localStorage.removeItem(OAUTH_ROLE_KEY);

                const user = await api.auth.getCurrentSession();
                if (!user) throw new Error('Sessão criada, mas sem usuário válido.');
                return user;
            }
        },
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT, expectedEmail?: string): Promise<User> => {
            const normalizedExpectedEmail = normalizeEmail(expectedEmail || '');

            if (isTestRuntimeAllowed() && normalizedExpectedEmail && isStrictTestEmail(normalizedExpectedEmail)) {
                const mockUser = createMockUser(normalizedExpectedEmail, role, 'Conta Google (Teste)');
                saveMockSession(mockUser);
                return mockUser;
            }
            if (isSupabaseMock) {
                throw new Error('Google em modo teste aceita apenas contas pré-definidas.');
            }

            const oauthValidation = validateOAuthRuntimeConfig();
            if (!oauthValidation.ok) {
                // If Supabase is not configured, try backend-only Google OAuth
                console.warn('[OAuth] Supabase config issues:', oauthValidation.issues);
                throw new Error('Login com Google indisponível. Use e-mail e senha, ou configure VITE_SUPABASE_URL no painel do Vercel.');
            }

            // Skip eligibility check when no email provided (Google will provide it)
            if (normalizedExpectedEmail) {
                try {
                    const eligibility = await fetchLoginEligibility(normalizedExpectedEmail);
                    if (!eligibility.allowed && !eligibility.canRegister) {
                        // Don't block - let OAuth proceed and handle on callback
                        console.warn('[OAuth] Email pre-check failed, proceeding with OAuth anyway');
                    }
                } catch {
                    // Network error on pre-check - proceed with OAuth anyway
                    console.warn('[OAuth] Pre-check failed, proceeding with OAuth');
                }
            }

            const redirectTo = getOAuthRedirectUrl();
            if (normalizedExpectedEmail) {
                localStorage.setItem(OAUTH_EXPECTED_EMAIL_KEY, normalizedExpectedEmail);
            } else {
                localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
            }
            localStorage.setItem(OAUTH_INTENT_KEY, 'login');
            localStorage.removeItem(OAUTH_ROLE_KEY);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                        ...(normalizedExpectedEmail ? { login_hint: normalizedExpectedEmail } : {}),
                    },
                }
            });

            if (error) {
                localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
                localStorage.removeItem(OAUTH_INTENT_KEY);
                localStorage.removeItem(OAUTH_ROLE_KEY);
                throw error;
            }
            if (data?.url) {
                window.location.assign(data.url);
                throw new Error('REDIRECTING_TO_GOOGLE');
            }

            throw new Error('Falha ao iniciar autenticação Google.');
        },
        registerWithGoogle: async (role: UserRole = UserRole.CLIENT, expectedEmail?: string): Promise<User> => {
            const normalizedExpectedEmail = normalizeEmail(expectedEmail || '');
            if (!normalizedExpectedEmail) {
                throw new Error('Informe o e-mail autorizado antes de continuar com Google.');
            }

            if (isSupabaseMock) {
                throw new Error('Google em modo teste aceita apenas contas pré-definidas.');
            }

            const oauthValidation = validateOAuthRuntimeConfig();
            if (!oauthValidation.ok) {
                throw new Error('Cadastro com Google indisponível. Use e-mail e senha, ou configure VITE_SUPABASE_URL no painel do Vercel.');
            }

            const eligibility = await fetchLoginEligibility(normalizedExpectedEmail);
            if (!eligibility.canRegister) {
                throw new Error('Este e-mail não está aprovado para cadastro com Google.');
            }

            const redirectTo = getOAuthRedirectUrl();
            localStorage.setItem(OAUTH_EXPECTED_EMAIL_KEY, normalizedExpectedEmail);
            localStorage.setItem(OAUTH_INTENT_KEY, 'register');
            localStorage.setItem(OAUTH_ROLE_KEY, normalizeRole(role));

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    },
                }
            });

            if (error) {
                localStorage.removeItem(OAUTH_INTENT_KEY);
                localStorage.removeItem(OAUTH_ROLE_KEY);
                throw error;
            }
            if (data?.url) {
                window.location.assign(data.url);
                throw new Error('REDIRECTING_TO_GOOGLE');
            }

            throw new Error('Falha ao iniciar autenticação Google.');
        },
        register: async (data: any): Promise<User> => {
            const normalizedEmail = normalizeEmail(String(data.email || ''));
            const normalizedRole = normalizeRole(data.role);

            if (isSupabaseMock || canUseMockSession()) {
                throw new Error('Cadastro real está desabilitado no modo teste.');
            }

            // Prefer backend registration so we guarantee a `profiles` row exists (authorized account).
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: normalizedEmail,
                    password: data.password,
                    name: data.name,
                    role: normalizedRole,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(toDomainAuthMessage({
                    code: errorData?.code,
                    reason: errorData?.reason,
                    fallback: errorData.error || response.statusText || 'Falha no cadastro',
                }));
            }

            const payload = await response.json();
            const fallbackToken = payload?.session?.access_token;
            if (fallbackToken) {
                promoteToRealSession(fallbackToken);
            }

            // Best-effort: also create a real Supabase session so password updates work in-app.
            try {
                const { data: signInData, error } = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password: data.password,
                });
                if (error) throw error;
                if (signInData.session?.access_token) {
                    promoteToRealSession(signInData.session.access_token);
                    localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
                }
            } catch {
                // If email confirmation is required, session may not be available yet.
            }

            const sessionUser = await api.auth.getCurrentSession();
            if (sessionUser) return sessionUser;

            return baseUser({
                id: payload?.user?.id || `user_${hashString(normalizedEmail).slice(0, 8)}`,
                email: payload?.user?.email || normalizedEmail,
                name: payload?.user?.name || data.name || normalizedEmail.split('@')[0] || 'Viajante',
                role: normalizeRole(payload?.user?.role || normalizedRole),
                activeRole: normalizeRole(payload?.user?.activeRole || payload?.user?.role || normalizedRole),
                roles: normalizeRoleList(Array.isArray(payload?.user?.roles) ? payload.user.roles : [payload?.user?.role || normalizedRole]),
                avatar: payload?.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${normalizedEmail}`,
            });
        },
        getCurrentSession: async (): Promise<User | null> => {
            if (!canUseMockSession() && localStorage.getItem(MOCK_USER_KEY)) {
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
                    if (expectedOAuthEmail && sessionEmail && expectedOAuthEmail !== sessionEmail) {
                        await supabase.auth.signOut();
                        clearMockArtifacts();
                        localStorage.removeItem(SESSION_MODE_KEY);
                        throw new Error('A conta do Google selecionada não corresponde ao e-mail informado.');
                    }
                    localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);

                    const oauthIntent = String(localStorage.getItem(OAUTH_INTENT_KEY) || '').toLowerCase();
                    const oauthRole = normalizeRole(localStorage.getItem(OAUTH_ROLE_KEY) || '');

                    let eligibility = await fetchLoginEligibility(sessionEmail);
                    if (!eligibility.allowed) {
                        // Always try to auto-create profile for OAuth users regardless of eligibility
                        try {
                            await ensureOAuthProfile(
                                session.access_token,
                                oauthRole || UserRole.CLIENT,
                                String((session.user.user_metadata as any)?.full_name || '').trim() || undefined,
                            );
                            // Re-check after profile creation
                            try {
                                eligibility = await fetchLoginEligibility(sessionEmail);
                            } catch {
                                // If re-check fails, assume success since profile was just created
                                eligibility = { allowed: true, role: oauthRole || UserRole.CLIENT, roles: [oauthRole || UserRole.CLIENT], reason: null, canRegister: false, accountState: 'ACTIVE', nextAction: 'LOGIN' };
                            }
                        } catch (profileErr) {
                            console.error('[OAuth] Failed to auto-create profile:', profileErr);
                        }
                    }
                    // Only block if explicitly blocked (not incomplete/not-authorized)
                    if (!eligibility.allowed && !eligibility.canRegister && eligibility.accountState === 'BLOCKED') {
                        await supabase.auth.signOut();
                        clearMockArtifacts();
                        localStorage.removeItem(SESSION_MODE_KEY);
                        throw new Error('Conta bloqueada. Entre em contato com o suporte.');
                    }
                    // If still not allowed but not blocked, proceed anyway — user authenticated via Google
                    if (!eligibility.allowed) {
                        console.warn('[OAuth] Eligibility not fully resolved, proceeding with session:', eligibility);
                    }

                    const metadataRoleValue = String((session.user.user_metadata as any)?.role || '').trim();
                    const metadataRole = metadataRoleValue ? normalizeRole(metadataRoleValue) : null;
                    const resolvedRole = eligibility.role || metadataRole || inferRoleFromEmail(sessionEmail);
                    const resolvedRoles = normalizeRoleList((eligibility.roles && eligibility.roles.length > 0)
                        ? eligibility.roles
                        : [resolvedRole]);

                    promoteToRealSession(session.access_token);
                    localStorage.removeItem(OAUTH_INTENT_KEY);
                    localStorage.removeItem(OAUTH_ROLE_KEY);
                    return hydrateUserFromProfileApi(baseUser({
                        id: session.user.id,
                        email: sessionEmail,
                        name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Viajante',
                        role: resolvedRole,
                        activeRole: resolvedRole,
                        roles: resolvedRoles,
                        avatar: session.user.user_metadata.avatar_url || '',
                    }));
                }
            } catch (err: any) {
                if (err?.message?.includes('não corresponde') || err?.message?.includes('bloqueada')) {
                    throw err;
                }
                // Fallback handled below.
            }

            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) return null;

            const payload = decodeJwtPayload(token);
            if (!payload?.email) return null;

            const isMockToken = token === MOCK_AUTH_TOKEN;
            if (isMockToken && !canUseMockSession()) {
                clearMockArtifacts();
                localStorage.removeItem(SESSION_MODE_KEY);
                return null;
            }
            if (!isMockToken) {
                setSessionMode('real');
            }

            return hydrateUserFromProfileApi(baseUser({
                id: payload.userId || payload.sub || `user_${hashString(payload.email).slice(0, 8)}`,
                email: payload.email,
                name: payload.name || payload.email.split('@')[0] || 'Viajante',
                role: normalizeRole(payload.role || inferRoleFromEmail(payload.email)),
                activeRole: normalizeRole(payload.activeRole || payload.role || inferRoleFromEmail(payload.email)),
                roles: normalizeRoleList(Array.isArray(payload.roles) ? payload.roles : [payload.activeRole || payload.role || inferRoleFromEmail(payload.email)]),
                avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${payload.email}`,
            }));
        },
        logout: async () => {
            try {
                if (!canUseMockSession()) {
                    await supabase.auth.signOut({ scope: 'global' as any });
                    await supabase.auth.signOut({ scope: 'local' as any });
                }
            } catch {
                // Continue local cleanup even if remote sign-out fails.
            }
            clearMockArtifacts();
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(MOCK_USER_KEY);
            localStorage.removeItem(SESSION_MODE_KEY);
            localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
            localStorage.removeItem(OAUTH_INTENT_KEY);
            localStorage.removeItem(OAUTH_ROLE_KEY);
            clearTestMode();
            clearSupabaseSessionArtifacts();
        },
        deleteAccount: async () => {
            return await request('/auth/account', {
                method: 'DELETE',
                body: JSON.stringify({ confirmText: 'EXCLUIR' }),
            });
        },
        listRoles: async (): Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }> => {
            const payload = await request('/auth/roles');
            const source = payload?.data || payload;
            const roles = normalizeRoleList(Array.isArray(source?.roles) ? source.roles : []);
            const activeRole = normalizeRole(source?.activeRole || roles[0] || UserRole.CLIENT);
            return {
                userId: String(source?.userId || ''),
                roles: roles.length ? roles : [activeRole],
                activeRole,
            };
        },
        selectRole: async (role: UserRole): Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }> => {
            const payload = await request('/auth/select-role', {
                method: 'POST',
                body: JSON.stringify({ role: normalizeRole(role) }),
            });
            const source = payload?.data || payload;
            const roles = normalizeRoleList(Array.isArray(source?.roles) ? source.roles : [role]);
            const activeRole = normalizeRole(source?.activeRole || role);
            return {
                userId: String(source?.userId || ''),
                roles: roles.length ? roles : [activeRole],
                activeRole,
            };
        },
        addRole: async (role: UserRole): Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }> => {
            const payload = await request('/auth/add-role', {
                method: 'POST',
                body: JSON.stringify({ role: normalizeRole(role) }),
            });
            const source = payload?.data || payload;
            const roles = normalizeRoleList(Array.isArray(source?.roles) ? source.roles : [role]);
            const activeRole = normalizeRole(source?.activeRole || roles[0] || role);
            return {
                userId: String(source?.userId || ''),
                roles: roles.length ? roles : [activeRole],
                activeRole,
            };
        }
    },
    users: {
        getById: async (id: string) => {
            try {
                return await request(`/users/${id}`);
            } catch {
                return null;
            }
        },
        update: async (user: User) => {
            try {
                return await request(`/users/${user.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(user)
                });
            } catch {
                return user;
            }
        },
        checkIn: async (_uid: string, reward: number = 50) => {
            let payload: any;
            try {
                payload = await request('/users/checkin', {
                    method: 'POST',
                    purpose: 'daily-checkin',
                    timeoutMs: 7000,
                    retries: 0,
                    body: JSON.stringify({ reward })
                });
            } catch (error: any) {
                const status = Number(error?.status || 0);
                const code = String(error?.code || error?.details?.code || '').toUpperCase();
                if (status === 409 || code === 'CHECKIN_ALREADY_DONE') {
                    const details = error?.details || {};
                    return {
                        ...details,
                        code: 'CHECKIN_ALREADY_DONE',
                        status: 'ALREADY_DONE',
                        ok: true,
                        alreadyDone: true,
                        user: details?.user ? normalizeProfilePayload(details.user) : undefined,
                    };
                }
                throw error;
            }

            if (payload?.user) {
                return {
                    ...payload,
                    ok: true,
                    alreadyDone: String(payload?.status || payload?.code || '').toUpperCase().includes('ALREADY'),
                    user: normalizeProfilePayload(payload.user),
                };
            }

            return { ...payload, ok: true };
        }
    },
    payment: {
        checkout: async (
            amount: number,
            description: string,
            providerId?: string,
            opts?: { contextType?: 'BAZAR' | 'TRIBO' | 'RECRUTAMENTO' | 'ESCAMBO' | 'AGENDA' | 'GERAL'; contextRef?: string; items?: Array<{ id: string; price?: number; type?: string }> }
        ) => {
            return await request('/checkout/pay', {
                method: 'POST',
                purpose: 'checkout-payment',
                body: JSON.stringify({
                    amount,
                    description,
                    receiverId: providerId,
                    contextType: opts?.contextType || 'GERAL',
                    contextRef: opts?.contextRef,
                    items: opts?.items || [],
                })
            });
        }
    },
    professionals: {
        list: async (): Promise<Professional[]> => {
            try {
                return await request('/profiles?role=PROFESSIONAL', {
                    purpose: 'professionals-list',
                    timeoutMs: 6000,
                    retries: 1,
                });
            } catch {
                return [];
            }
        },
        updateNotes: async (pid: string, proId: string, content: string) => {
            try {
                return await request(`/professionals/${proId}/notes`, {
                    method: 'POST',
                    body: JSON.stringify({ patientId: pid, content })
                });
            } catch {
                return true;
            }
        },
        getNotes: async (pid: string, proId: string) => {
            try {
                return await request(`/professionals/${proId}/notes/${pid}`);
            } catch {
                return [];
            }
        },
        grantAccess: async (pid: string) => {
            try {
                return await request(`/professionals/access/${pid}`, { method: 'POST' });
            } catch {
                return true;
            }
        },
        revokeAccess: async () => true,
        getRecordAccessList: async () => [],
        applyToVacancy: async (vid: string) => ({ success: true }),
        getFinanceSummary: async (pid: string) => {
            try {
                const [summary, transactions] = await Promise.all([
                    request('/finance/summary', { purpose: 'finance-summary' }).catch(() => ({ balance: 0 })),
                    request('/finance/transactions', { purpose: 'finance-transactions' }).catch(() => []),
                ]);
                return {
                    ...(summary || {}),
                    transactions: Array.isArray(transactions) ? transactions : [],
                };
            } catch {
                return { balance: 0, transactions: [] };
            }
        }
    },
    records: {
        list: async (patientId: string) => {
            try {
                return await request(`/records/${patientId}`);
            } catch {
                return [];
            }
        },
        create: async (record: any) => {
            try {
                return await request('/records', {
                    method: 'POST',
                    body: JSON.stringify(record)
                });
            } catch {
                return record;
            }
        },
        update: async (recordId: string, patch: { content?: string; type?: 'anamnesis' | 'session' }) => {
            return await request(`/records/${recordId}`, {
                method: 'PATCH',
                body: JSON.stringify(patch),
            });
        }
    },
    appointments: {
        list: async (uid: string, role: UserRole) => {
            try {
                const all = await request('/appointments');
                const normalized = (Array.isArray(all) ? all : []).map((entry: any) => ({
                    id: String(entry.id || ''),
                    clientId: String(entry.clientId || entry.client_id || ''),
                    clientName: String(entry.clientName || entry.client_name || ''),
                    professionalId: String(entry.professionalId || entry.professional_id || ''),
                    professionalName: String(entry.professionalName || entry.professional_name || ''),
                    time: String(entry.time || '00:00'),
                    date: String(entry.date || new Date().toISOString()),
                    status: String(entry.status || 'pending').toLowerCase(),
                    serviceName: String(entry.serviceName || entry.service_name || 'Atendimento'),
                    price: Number(entry.price || 0),
                })) as Appointment[];
                if (role === UserRole.PROFESSIONAL) return normalized.filter((a: Appointment) => a.professionalId === uid);
                return normalized.filter((a: Appointment) => a.clientId === uid);
            } catch {
                return [];
            }
        },
        create: async (apt: Appointment) => {
            try {
                return await request('/appointments', {
                    method: 'POST',
                    body: JSON.stringify(apt)
                });
            } catch {
                return apt;
            }
        },
        reschedule: async (appointmentId: string, data: { date: string; time: string; service_name?: string }) => {
            return await request(`/appointments/${appointmentId}/reschedule`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },
        cancel: async (appointmentId: string, reason?: string) => {
            return await request(`/appointments/${appointmentId}/cancel`, {
                method: 'PATCH',
                body: JSON.stringify({ reason })
            });
        }
    },
    reviews: {
        list: async () => {
            try {
                return await request('/reviews');
            } catch {
                return [];
            }
        },
        create: async (r: any) => {
            try {
                return await request('/reviews', {
                    method: 'POST',
                    body: JSON.stringify(r)
                });
            } catch {
                return r;
            }
        }
    },
    marketplace: {
        listAll: async (): Promise<Product[]> => {
            try {
                return await request('/marketplace/products', {
                    purpose: 'marketplace-list',
                    timeoutMs: 6000,
                    retries: 1,
                });
            } catch {
                return [];
            }
        },
        listByOwner: async (oid: string) => {
            try {
                return await request(`/marketplace/products?ownerId=${oid}`, { purpose: 'marketplace-owner-list' });
            } catch {
                return [];
            }
        },
        create: async (p: any) => {
            try {
                return await request('/marketplace/products', {
                    method: 'POST',
                    purpose: 'marketplace-create',
                    body: JSON.stringify(p)
                });
            } catch {
                return { ...p, id: `prod_${Date.now()}` };
            }
        },
        delete: async (id: string) => {
            try {
                await request(`/marketplace/products/${id}`, { method: 'DELETE', purpose: 'marketplace-delete' });
                return true;
            } catch {
                return false;
            }
        }
    },
    notifications: {
        list: async (uid?: string) => {
            try {
                return await request('/notifications');
            } catch {
                return [];
            }
        },
        markAsRead: async (id: string) => {
            try {
                await request(`/notifications/${id}/read`, { method: 'POST' });
                return true;
            } catch {
                return true;
            }
        },
        markAllAsRead: async (uid?: string) => {
            try {
                await request('/notifications/read-all', { method: 'POST' });
                return true;
            } catch {
                return true;
            }
        }
    },
    tribe: {
        listPosts: async () => {
            try {
                return await request('/tribe/posts');
            } catch {
                return [];
            }
        },
        createPost: async (content: string, type: 'insight' | 'question' | 'celebration') => {
            try {
                return await request('/tribe/posts', {
                    method: 'POST',
                    body: JSON.stringify({ content, type })
                });
            } catch {
                return { id: `pt_${Date.now()}`, content, type };
            }
        },
        likePost: async (id: string) => {
            try {
                await request(`/tribe/posts/${id}/like`, { method: 'POST' });
                return true;
            } catch {
                return true;
            }
        },
        syncVibration: async (userId: string) => {
            try {
                return await request('/tribe/sync', { method: 'POST' });
            } catch {
                return { success: false };
            }
        },
        invite: async (payload: { email: string; inviteType?: 'TEAM' | 'COMMUNITY' | 'JOB'; targetRole?: UserRole; contextRef?: string; expiresInHours?: number }) => {
            return await request('/tribe/invite', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        respondInvite: async (inviteId: string, decision: 'ACCEPT' | 'REJECT') => {
            return await request(`/tribe/invites/${inviteId}/respond`, {
                method: 'POST',
                body: JSON.stringify({ decision }),
            });
        }
    },
    recruitment: {
        listApplications: async (scope: 'candidate' | 'space' = 'candidate') => {
            return await request(`/recruitment/applications?scope=${scope}`);
        },
        apply: async (vacancyId: string, notes?: string) => {
            return await request('/recruitment/applications', {
                method: 'POST',
                body: JSON.stringify({ vacancyId, notes }),
            });
        },
        scheduleInterview: async (applicationId: string, payload: { scheduledFor: string; guardianId?: string }) => {
            return await request(`/recruitment/applications/${applicationId}/interview`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        respondInterview: async (interviewId: string, decision: 'ACCEPT' | 'DECLINE', note?: string) => {
            return await request(`/recruitment/interviews/${interviewId}/respond`, {
                method: 'POST',
                body: JSON.stringify({ decision, note }),
            });
        },
        decideApplication: async (applicationId: string, decision: 'HIRED' | 'REJECTED', note?: string) => {
            return await request(`/recruitment/applications/${applicationId}/decision`, {
                method: 'POST',
                body: JSON.stringify({ decision, note }),
            });
        },
    },
    alchemy: {
        createOffer: async (payload: { requesterId: string; description?: string }) => {
            return await request('/alchemy/offers', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        listOffers: async () => {
            return await request('/alchemy/offers');
        },
        acceptOffer: async (offerId: string) => {
            return await request(`/alchemy/offers/${offerId}/accept`, { method: 'POST' });
        },
        rejectOffer: async (offerId: string) => {
            return await request(`/alchemy/offers/${offerId}/reject`, { method: 'POST' });
        },
        counterOffer: async (offerId: string, counterOffer: string) => {
            return await request(`/alchemy/offers/${offerId}/counter`, {
                method: 'POST',
                body: JSON.stringify({ counterOffer }),
            });
        },
        completeOffer: async (offerId: string) => {
            return await request(`/alchemy/offers/${offerId}/complete`, { method: 'POST' });
        }
    },
    spaces: {
        list: async () => {
            return request('/spaces');
        },
        getRooms: async (uid?: string) => {
            try {
                return await request('/rooms/real-time', { purpose: 'space-rooms' });
            } catch {
                return [];
            }
        },
        getTeam: async (uid?: string) => {
            try {
                return await request('/profiles?role=PROFESSIONAL', { purpose: 'space-team' });
            } catch {
                return [];
            }
        },
        getVacancies: async (uid?: string) => {
            try {
                return await request('/rooms/vacancies', { purpose: 'space-vacancies' });
            } catch {
                return [];
            }
        },
        createVacancy: async (v: any) => {
            try {
                return await request('/rooms/vacancies', {
                    method: 'POST',
                    purpose: 'space-vacancy-create',
                    body: JSON.stringify(v)
                });
            } catch {
                return v;
            }
        },
        getTransactions: async (uid?: string) => {
            try {
                return await request('/finance/transactions', { purpose: 'space-transactions' });
            } catch {
                return [];
            }
        },
        getProposals: async () => {
            try {
                return await request('/spaces/proposals');
            } catch {
                return [];
            }
        },
        voteProposal: async (id: string, vote: 'for'|'against') => {
            try {
                return await request(`/spaces/proposals/${id}/vote`, {
                    method: 'POST',
                    body: JSON.stringify({ vote })
                });
            } catch {
                return { success: true };
            }
        },
        getEvents: async () => {
            try {
                return await request('/calendar', {
                    purpose: 'space-events',
                    timeoutMs: 6000,
                    retries: 1,
                });
            } catch {
                return [];
            }
        },
        createEvent: async (evt: any) => {
            try {
                return await request('/calendar', {
                    method: 'POST',
                    purpose: 'space-events-create',
                    body: JSON.stringify(evt)
                });
            } catch {
                return { ...evt, id: `evt_${Date.now()}` };
            }
        },
        syncCalendar: async () => {
            return await request('/calendar/sync', {
                purpose: 'space-events-sync',
                timeoutMs: 8000,
                retries: 1,
            });
        },
        getAnalytics: async () => {
             return request('/spaces/analytics');
        },
        getReviews: async () => {
             return request('/spaces/reviews');
        },
        getContract: async () => {
             return request('/spaces/contract');
        },
        createRoom: async (data: { name: string; type: string; capacity: number }) => {
             return request('/spaces/rooms', {
                 method: 'POST',
                 body: JSON.stringify(data)
             });
        },
        createInvite: async (data: { role: string; uses: number }) => {
             return request('/spaces/invites', {
                 method: 'POST',
                 body: JSON.stringify(data)
             });
        }
    },
    admin: {
        getDashboard: async () => {
            try {
                return await request('/admin/dashboard');
            } catch {
                return { totalUsers: 0, activeUsers: 0, revenue: 0, systemHealth: { status: 'unknown' } };
            }
        },
        listUsers: async () => {
            try {
                return await request('/admin/users');
            } catch {
                return [];
            }
        },
        blockUser: async () => true,
        getMetrics: async () => {
            try {
                return await request('/admin/metrics');
            } catch {
                return {};
            }
        },
        getMarketplaceOffers: async () => {
            try {
                return await request('/admin/marketplace/offers');
            } catch {
                return [];
            }
        },
        getGlobalFinance: async () => {
            try {
                return await request('/admin/finance/global');
            } catch {
                return {};
            }
        },
        getLgpdAudit: async () => {
            try {
                return await request('/admin/lgpd/audit');
            } catch {
                return [];
            }
        },
        getSystemHealth: async () => {
            try {
                return await request('/admin/system/health');
            } catch {
                return {};
            }
        }
    },
    oracle: {
        draw: async (mood: string) => {
            try {
                const response = await request('/oracle/draw', {
                    method: 'POST',
                    body: JSON.stringify({ mood })
                });
                if (response?.card) {
                    const entry: OracleCachedEntry = {
                        drawId: response.drawId || `${Date.now()}`,
                        drawnAt: response.drawnAt || new Date().toISOString(),
                        moodContext: response.moodContext || mood || 'sereno',
                        card: {
                            id: response.card.id || `oracle_${Date.now()}`,
                            name: response.card.name || 'Oráculo Viva360',
                            insight: response.card.insight || response.card.message || 'Respire e siga seu centro.',
                            element: response.card.element || 'Ar',
                            category: response.card.category || 'consciencia',
                        }
                    };
                    const history = getOracleCache();
                    saveOracleCache([entry, ...history.filter((h) => h.drawId !== entry.drawId)]);
                }
                return response;
            } catch {
                const fallbackCard = buildOracleFallbackCard(mood || 'sereno');
                const fallback: OracleCachedEntry = {
                    drawId: `${Date.now()}`,
                    drawnAt: new Date().toISOString(),
                    moodContext: mood || 'sereno',
                    card: fallbackCard,
                };
                const history = getOracleCache();
                saveOracleCache([fallback, ...history]);
                return {
                    drawId: fallback.drawId,
                    drawnAt: fallback.drawnAt,
                    moodContext: fallback.moodContext,
                    card: fallback.card,
                    source: 'offline-fallback'
                };
            }
        },
        getToday: async () => {
            try {
                const response = await request('/oracle/today');
                if (response?.card) {
                    const entry: OracleCachedEntry = {
                        drawId: `today-${Date.now()}`,
                        drawnAt: new Date().toISOString(),
                        moodContext: 'today',
                        card: {
                            id: response.card.id || `oracle_${Date.now()}`,
                            name: response.card.name || 'Guia Diário',
                            insight: response.card.insight || response.card.message || 'Respire e siga seu centro.',
                            element: response.card.element || 'Ar',
                            category: response.card.category || 'consciencia',
                        }
                    };
                    const history = getOracleCache();
                    saveOracleCache([entry, ...history]);
                }
                return response;
            } catch {
                const today = getOracleCache().find((entry) => isSameDay(entry.drawnAt, new Date().toISOString()));
                return today ? { card: today.card } : null;
            }
        },
        history: async () => {
            try {
                const response = await request('/oracle/history');
                if (Array.isArray(response) && response.length > 0) {
                    const normalized = response.map((entry: any) => ({
                        drawId: entry.drawId || entry.id || `${Date.now()}-${Math.random()}`,
                        drawnAt: entry.drawnAt || entry.drawn_at || new Date().toISOString(),
                        moodContext: entry.moodContext || entry.context?.mood || 'sereno',
                        card: {
                            id: entry.card?.id || entry.message_id || `oracle_${Date.now()}`,
                            name: entry.card?.name || 'Oráculo Viva360',
                            insight: entry.card?.insight || entry.card?.message || 'Respire e siga seu centro.',
                            element: entry.card?.element || 'Ar',
                            category: entry.card?.category || 'consciencia',
                        }
                    })) as OracleCachedEntry[];
                    saveOracleCache(normalized);
                }
                return response;
            } catch {
                return getOracleCache().map((entry) => ({
                    drawId: entry.drawId,
                    drawnAt: entry.drawnAt,
                    moodContext: entry.moodContext,
                    card: entry.card
                }));
            }
        }
    },
    links: {
        create: async (targetId: string, type: 'tribo' | 'paciente' | 'escambo' | 'equipe' | 'bazar') => {
            return await request('/links', {
                method: 'POST',
                body: JSON.stringify({ targetId, type })
            });
        },
        accept: async (linkId: string) => {
            return await request(`/links/${linkId}/accept`, { method: 'POST' });
        },
        getMyLinks: async () => {
            try {
                return await request('/links/me');
            } catch {
                return [];
            }
        },
        getPendingRequests: async () => {
            try {
                return await request('/links/pending');
            } catch {
                return [];
            }
        },
        checkLink: async (targetId: string, type?: string) => {
            try {
                const params = type ? `?type=${type}` : '';
                const result = await request(`/links/check/${targetId}${params}`);
                return result.hasLink || false;
            } catch {
                return false;
            }
        },
        reject: async (linkId: string) => {
            return await request(`/links/${linkId}/reject`, { method: 'POST' });
        }
    },
    rituals: {
        save: async (period: string, data: any) => {
            try {
                return await request('/rituals', {
                    method: 'POST',
                    body: JSON.stringify({ period, data })
                });
            } catch {
                return true;
            }
        },
        get: async (period: string) => {
            try {
                return await request(`/rituals/${period}`);
            } catch {
                return [];
            }
        },
        toggle: async (period: string, id: string) => {
            try {
                return await request(`/rituals/${period}/${id}/toggle`, { method: 'POST' });
            } catch {
                return [];
            }
        }
    },
    metamorphosis: {
        checkIn: async (mood: string, hash: string, thumb: string) => {
            const response = await request('/metamorphosis/checkin', {
                method: 'POST',
                purpose: 'metamorphosis-checkin',
                timeoutMs: 6000,
                retries: 0,
                body: JSON.stringify({
                    mood,
                    photoHash: hash,
                    photoThumb: thumb,
                    // Backward compatibility with older backend payload contracts
                    hash,
                    thumb,
                })
            });
            return response?.entry || response;
        },
        getEvolution: async () => {
            try {
                return await request('/metamorphosis/evolution', {
                    purpose: 'metamorphosis-evolution',
                    timeoutMs: 7000,
                    retries: 1,
                });
            } catch {
                return { entries: [] };
            }
        }
    },
    journal: {
        create: async (entry: Omit<DailyJournalEntry, 'id' | 'createdAt' | 'userId'>) => {
            try {
                return await request('/journal', {
                    method: 'POST',
                    body: JSON.stringify(entry)
                });
            } catch {
                return { ...entry, id: `jnl_${Date.now()}`, createdAt: new Date().toISOString() };
            }
        },
        list: async () => {
            try {
                return await request('/journal');
            } catch {
                return [];
            }
        },
        getStats: async () => {
            try {
                return await request('/journal/stats');
            } catch {
                return { totalEntries: 0, streak: 0, commonWords: [] };
            }
        }
    },
    presence: {
        goOnline: async () => {
            try {
                return await request('/presence/online', { method: 'POST' });
            } catch {
                return { status: 'ONLINE' };
            }
        },
        goOffline: async () => {
            try {
                return await request('/presence/offline', { method: 'POST' });
            } catch {
                return { status: 'OFFLINE' };
            }
        },
        ping: async () => {
            try {
                return await request('/presence/ping', { method: 'POST' });
            } catch {
                return { status: 'ONLINE' };
            }
        },
        listActive: async () => {
            try {
                const result = await request('/presence');
                return result.online || [];
            } catch {
                return [];
            }
        },
        getStatus: async (guardianId: string) => {
            try {
                const result = await request(`/presence/${guardianId}`);
                return result.status || 'OFFLINE';
            } catch {
                return 'OFFLINE';
            }
        },
        getBatch: async (guardianIds: string[]) => {
            try {
                return await request('/presence/batch', {
                    method: 'POST',
                    body: JSON.stringify({ guardianIds })
                });
            } catch {
                const result: Record<string, string> = {};
                guardianIds.forEach(id => { result[id] = 'OFFLINE'; });
                return result;
            }
        }
    },
    clinical: {
        saveIntervention: async (data: any) => {
            try {
                return await request('/clinical/interventions', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            } catch {
                return { ...data, id: Date.now() };
            }
        },
        listInterventions: async () => {
            try {
                return await request('/clinical/interventions');
            } catch {
                return [];
            }
        }
    },
    audit: {
        listLogs: async () => {
            try {
                return await request('/audit/logs');
            } catch {
                return [];
            }
        }
    },
    chat: {
        listRooms: async (filters?: { contextType?: string; contextId?: string }) => {
            try {
                const query = new URLSearchParams();
                if (filters?.contextType) query.set('contextType', filters.contextType);
                if (filters?.contextId) query.set('contextId', filters.contextId);
                const suffix = query.toString() ? `?${query.toString()}` : '';
                return await request(`/chat/rooms${suffix}`);
            } catch {
                return [];
            }
        },
        getMessages: async (roomId: string) => {
            try {
                return await request(`/chat/rooms/${roomId}/messages`);
            } catch {
                return [];
            }
        },
        sendMessage: async (roomId: string, content: string) => {
            try {
                await request(`/chat/rooms/${roomId}/messages`, {
                    method: 'POST',
                    body: JSON.stringify({ content })
                });
                return true;
            } catch {
                return false;
            }
        }
    },

};
