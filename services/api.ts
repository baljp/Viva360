import { User, UserRole } from '../types';
import { supabase, isMockMode as isSupabaseMock, getOAuthRedirectUrl, validateOAuthRuntimeConfig, TEST_MODE_ENABLED } from '../lib/supabase';
import { captureFrontendError, captureFrontendMessage } from '../lib/monitoring';
import { createRequestClient } from './api/requestClient';
import { createApiDomains } from './api/domains';

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
const IS_PROD_BUILD = import.meta.env.PROD || import.meta.env.MODE === 'production';

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
const canonicalizeGoogleMailbox = (email: string): string => {
    const normalized = normalizeEmail(email);
    const [local, domain] = normalized.split('@');
    if (!local || !domain) return normalized;

    // Gmail treats dots as insignificant and supports plus aliases.
    const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
    if (!isGmail) return normalized;

    const noPlus = local.split('+')[0] || local;
    const noDots = noPlus.replace(/\./g, '');
    return `${noDots}@gmail.com`;
};

const emailsMatchForOAuth = (expected: string, actual: string): boolean => {
    const a = normalizeEmail(expected);
    const b = normalizeEmail(actual);
    if (!a || !b) return false;
    if (a === b) return true;
    return canonicalizeGoogleMailbox(a) === canonicalizeGoogleMailbox(b);
};
const isStrictTestEmail = (email: string) => STRICT_TEST_EMAILS.has(normalizeEmail(email));
const isLocalDevRuntime = () => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};
const isTestRuntimeAllowed = () => !IS_PROD_BUILD && (isSupabaseMock || (TEST_MODE_ENABLED && isLocalDevRuntime()));
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
    if (reason === 'MOCK_STRICT_ONLY') return 'No modo teste, use apenas e-mails pré-definidos.';
    if (code === 'EMAIL_NOT_AUTHORIZED' || reason === 'EMAIL_NOT_AUTHORIZED') return 'Conta não autorizada. Faça cadastro antes de entrar.';
    if (code === 'INVALID_CREDENTIALS') return 'Credenciais inválidas.';
    return input.fallback || 'Não foi possível concluir autenticação.';
};

type TimedFetchOptions = RequestInit & { timeoutMs?: number };

const fetchWithTimeout = async (url: string, options: TimedFetchOptions = {}) => {
    const { timeoutMs = 10000, signal, ...rest } = options;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
    const onExternalAbort = () => controller.abort();

    if (signal) {
        if (signal.aborted) {
            controller.abort();
        } else {
            signal.addEventListener('abort', onExternalAbort, { once: true });
        }
    }

    try {
        return await fetch(url, {
            ...rest,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutHandle);
        if (signal) signal.removeEventListener('abort', onExternalAbort);
    }
};

const fetchLoginEligibility = async (email: string): Promise<LoginEligibility> => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return { allowed: false, role: null };

    if (isSupabaseMock) {
        if (isStrictTestEmail(normalizedEmail)) {
            const account = STRICT_TEST_ACCOUNTS[normalizedEmail];
            return {
                allowed: true,
                role: account.role,
                roles: [account.role],
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

    try {
        const response = await fetchWithTimeout(`${API_URL}/auth/precheck-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail }),
            timeoutMs: 7000,
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
    if (!userId) {
        console.warn("[Hydration] userId is missing or empty", base);
        return base;
    }

    try {
        console.log(`[Hydration] Starting hydration for user ${userId}`);
        const profilePayload = await request(`/users/${userId}`, {
            purpose: 'session-hydration',
            timeoutMs: 7000,
            retries: 1,
        });
        
        if (!profilePayload) {
            console.error(`[Hydration] Received empty payload for user ${userId}`);
            return base;
        }

        const hydrated = normalizeProfilePayload(profilePayload || {});
        console.log(`[Hydration] Successfully normalized payload for ${userId}`, hydrated);

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
        console.log(`[Hydration] Final merged user for ${userId}:`, { id: merged.id, role: merged.role, activeRole: merged.activeRole, roles: merged.roles });
        return merged;
    } catch (err) {
        console.error(`[Hydration] Failed to hydrate user ${userId}:`, err);
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

            if (isSupabaseMock) {
                if (!isStrictTestEmail(normalizedEmail)) {
                    throw new Error('No modo teste, use apenas e-mails pré-definidos.');
                }
                if (password !== TEST_ACCOUNT_PASSWORD) throw new Error('Senha de teste inválida.');
                const mockUser = createMockUser(normalizedEmail);
                saveMockSession(mockUser);
                return mockUser;
            }

            if (isTestRuntimeAllowed() && isStrictTestEmail(normalizedEmail)) {
                if (password !== TEST_ACCOUNT_PASSWORD) throw new Error('Senha de teste inválida.');
                const mockUser = createMockUser(normalizedEmail);
                saveMockSession(mockUser);
                return mockUser;
            }

            // Go straight to backend login - no pre-check needed.
            // The backend validates credentials and auto-creates profile if missing.

            // Primary path: backend /auth/login (works even when Supabase requires email confirmation).
            try {
                console.log(`[Login] Attempting backend login for ${normalizedEmail} at ${API_URL}/auth/login`);
                const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: normalizedEmail, password }),
                    timeoutMs: 12000,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error(`[Login] Backend login failed for ${normalizedEmail}`, errorData);
                    throw new Error(toDomainAuthMessage({
                        code: errorData?.code,
                        reason: errorData?.reason,
                        fallback: errorData.error || response.statusText || 'Falha no login',
                    }));
                }

                const payload = await response.json();
                const token = payload?.session?.access_token;
                console.log(`[Login] Backend login success for ${normalizedEmail}, token present: ${!!token}`);
                promoteToRealSession(token);
                localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
                localStorage.removeItem(OAUTH_INTENT_KEY);
                localStorage.removeItem(OAUTH_ROLE_KEY);

                // Best-effort: also establish a Supabase session when possible.
                try {
                    console.log(`[Login] Establishing side Supabase session for ${normalizedEmail}`);
                    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
                    if (error) {
                        console.warn(`[Login] Side Supabase session failed for ${normalizedEmail}:`, error.message);
                        throw error;
                    }
                    if (data.session?.access_token) {
                        promoteToRealSession(data.session.access_token);
                        localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
                    }
                } catch {
                    // Ignore - internal JWT keeps the user authenticated.
                }

                const user = await api.auth.getCurrentSession();
                if (user) {
                    console.log(`[Login] Session established and hydrated for ${normalizedEmail}`);
                    return user;
                }

                console.warn(`[Login] Hydration failed after login, returning manual user object for ${normalizedEmail}`);
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
                console.warn(`[Login] Backend path failed for ${normalizedEmail}, checking for fallback. Error:`, err.message);
                if (!isLikelyNetworkError(err?.message)) {
                    throw err;
                }

                console.log(`[Login] Falling back to direct Supabase auth for ${normalizedEmail}`);
                const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
                if (error) {
                    console.error(`[Login] Fallback Supabase auth failed for ${normalizedEmail}:`, error.message);
                    throw error;
                }
                if (!data.session?.access_token) {
                    throw new Error('Login failed: No session data returned');
                }

                promoteToRealSession(data.session.access_token);
                localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
                localStorage.removeItem(OAUTH_INTENT_KEY);
                localStorage.removeItem(OAUTH_ROLE_KEY);

                const user = await api.auth.getCurrentSession();
                if (!user) throw new Error('Sessão criada, mas sem usuário válido.');
                console.log(`[Login] Fallback login success for ${normalizedEmail}`);
                return user;
            }
        },
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT, expectedEmail?: string): Promise<User> => {
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
                // If Supabase is not configured, try backend-only Google OAuth
                console.warn('[OAuth] Supabase config issues:', oauthValidation.issues);
                const details = oauthValidation.issues.length
                  ? `Config faltando: ${oauthValidation.issues.join(' | ')}`
                  : 'Configuração OAuth/Supabase inválida.';
                throw new Error(`Login com Google indisponível. ${details}`);
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

            // If the user typed an email, use it to decide whether this should be treated as
            // registration or login (existing accounts should not be blocked).
            //
            // IMPORTANT: Even when we end up "logging in" (account already exists),
            // this call can be initiated from role-specific registration screens
            // (e.g. "Sou Guardiao"). In that case we still want to *enable* the
            // requested role after OAuth completes. We persist the requested role
            // in localStorage and handle the role upgrade in getCurrentSession().
            let intent: 'register' | 'login' = 'register';
            if (normalizedExpectedEmail) {
                const eligibility = await fetchLoginEligibility(normalizedExpectedEmail);
                if (eligibility.allowed) {
                    // Account already exists: proceed as login so users don't hit a dead-end on the register page.
                    intent = 'login';
                } else if (!eligibility.canRegister) {
                    throw new Error('Este e-mail não está aprovado para cadastro com Google.');
                }
            }

            const redirectTo = getOAuthRedirectUrl();
            // Only lock the expected email if user intentionally provided it.
            if (normalizedExpectedEmail) {
                localStorage.setItem(OAUTH_EXPECTED_EMAIL_KEY, normalizedExpectedEmail);
            } else {
                localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
            }
            localStorage.setItem(OAUTH_INTENT_KEY, intent);
            // Persist requested role even when intent becomes "login" (existing account),
            // so we can enable/switch to that role after OAuth returns.
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
            const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: normalizedEmail,
                    password: data.password,
                    name: data.name,
                    role: normalizedRole,
                }),
                timeoutMs: 12000,
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
                    if (expectedOAuthEmail && sessionEmail && !emailsMatchForOAuth(expectedOAuthEmail, sessionEmail)) {
                        await supabase.auth.signOut();
                        clearMockArtifacts();
                        localStorage.removeItem(SESSION_MODE_KEY);
                        throw new Error('A conta do Google selecionada não corresponde ao e-mail informado.');
                    }
                    localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);

                    const oauthIntent = String(localStorage.getItem(OAUTH_INTENT_KEY) || '').toLowerCase();
                    const oauthRole = normalizeRole(localStorage.getItem(OAUTH_ROLE_KEY) || '');

                    // Persist token early so downstream API calls (e.g. addRole/selectRole) have auth.
                    // Note: promoteToRealSession clears OAuth keys, so we must read them before calling it.
                    promoteToRealSession(session.access_token);

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

                    // Role upgrade path: If OAuth was triggered from a role-specific register screen but
                    // the account already existed, we proceed as login. After session is established,
                    // enable the requested role and switch active role.
                    //
                    // This avoids dead-ends like: user selects "Sou Guardiao" -> Google -> account exists -> stuck as CLIENT.
                    if (oauthIntent === 'login' && oauthRole) {
                        const alreadyHasRole = Array.isArray(eligibility.roles) && eligibility.roles.includes(oauthRole);
                        if (!alreadyHasRole) {
                            try {
                                await api.auth.addRole(oauthRole as UserRole);
                                await api.auth.selectRole(oauthRole as UserRole);
                                // Refresh eligibility snapshot (best-effort) so resolved roles reflect the upgrade.
                                try {
                                    eligibility = await fetchLoginEligibility(sessionEmail);
                                } catch {
                                    // ignore - we'll still proceed with the base session
                                }
                            } catch (roleErr) {
                                console.warn('[OAuth] Role upgrade failed:', roleErr);
                            }
                        }
                    }

                    const metadataRoleValue = String((session.user.user_metadata as any)?.role || '').trim();
                    const metadataRole = metadataRoleValue ? normalizeRole(metadataRoleValue) : null;
                    const resolvedRole = eligibility.role || metadataRole || inferRoleFromEmail(sessionEmail);
                    const resolvedRoles = normalizeRoleList((eligibility.roles && eligibility.roles.length > 0)
                        ? eligibility.roles
                        : [resolvedRole]);

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
    ...createApiDomains({
        request,
        normalizeProfilePayload,
        getOracleCache,
        saveOracleCache,
        isSameDay,
        buildOracleFallbackCard,
    }),

};
