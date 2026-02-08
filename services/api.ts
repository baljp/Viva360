import { User, Professional, UserRole, Appointment, Product, Notification, DailyJournalEntry } from '../types';
import { supabase, isMockMode as isSupabaseMock, getOAuthRedirectUrl, validateOAuthRuntimeConfig } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_TOKEN_KEY = 'viva360.auth.token';
const MOCK_USER_KEY = 'viva360.mock_user';
const MOCK_AUTH_TOKEN = 'admin-excellence-2026';
const SESSION_MODE_KEY = 'viva360.session.mode';
const OAUTH_EXPECTED_EMAIL_KEY = 'viva360.oauth.expected_email';
const ORACLE_HISTORY_KEY = 'viva360.oracle.history';
const ORACLE_MAX_CACHE = 40;
const TEST_ACCOUNT_PASSWORD = '123456';

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
    avatar: overrides.avatar || '',
    karma: overrides.karma ?? 0,
    streak: overrides.streak ?? 0,
    multiplier: overrides.multiplier ?? 1,
    personalBalance: overrides.personalBalance ?? 0,
    corporateBalance: overrides.corporateBalance ?? 0,
    plantStage: overrides.plantStage || 'seed',
    plantXp: overrides.plantXp ?? 0,
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
    ];
    keysToDrop.forEach((key) => localStorage.removeItem(key));

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
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${id}`,
        karma: normalizedRole === UserRole.PROFESSIONAL ? 1500 : 500,
    });
};

const saveMockSession = (user: User) => {
    setSessionMode('mock');
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, MOCK_AUTH_TOKEN);
};

const promoteToRealSession = (token?: string) => {
    clearMockArtifacts({ preserveAuthToken: true });
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    setSessionMode('real');
};

const getMockSession = (): User | null => {
    if (!isSupabaseMock) return null;
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
    const isMockSession = isSupabaseMock && getSessionMode() === 'mock' && !!localStorage.getItem(MOCK_USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || (isMockSession ? MOCK_AUTH_TOKEN : '');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const request = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...getHeader(), ...options.headers }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || res.statusText || 'API Request Failed');
    }

    return res.json();
};

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
                if (password !== TEST_ACCOUNT_PASSWORD) {
                    throw new Error('Senha de teste inválida.');
                }
                const mockUser = createMockUser(normalizedEmail);
                saveMockSession(mockUser);
                return mockUser;
            }

            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
                if (error) throw error;

                if (!data.session) {
                    throw new Error('Login failed: No session data returned');
                }

                promoteToRealSession(data.session.access_token);
                localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);

                const user = await api.auth.getCurrentSession();
                if (!user) throw new Error('Sessão criada, mas sem usuário válido.');
                return user;
            } catch (err: any) {
                if (!isLikelyNetworkError(err?.message)) {
                    throw err;
                }
                // Fallback: backend /auth/login token flow
                try {
                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: normalizedEmail, password })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || response.statusText || 'Falha no login');
                    }

                    const payload = await response.json();
                    const token = payload?.session?.access_token;
                    promoteToRealSession(token);
                    localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);

                    const user = baseUser({
                        id: payload?.user?.id || `user_${hashString(normalizedEmail).slice(0, 8)}`,
                        email: payload?.user?.email || normalizedEmail,
                        name: payload?.user?.name || normalizedEmail.split('@')[0] || 'Viajante',
                        role: normalizeRole(payload?.user?.role || inferRoleFromEmail(normalizedEmail)),
                        avatar: payload?.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${payload?.user?.id || normalizedEmail}`,
                    });

                    return user;
                } catch (fallbackError) {
                    throw fallbackError instanceof Error ? fallbackError : err;
                }
            }
        },
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT, expectedEmail?: string): Promise<User> => {
            const normalizedExpectedEmail = normalizeEmail(expectedEmail || '');
            if (!normalizedExpectedEmail) {
                throw new Error('Informe seu e-mail antes de continuar com Google.');
            }

            if (isSupabaseMock) {
                if (!isStrictTestEmail(normalizedExpectedEmail)) {
                    throw new Error('Google em modo teste aceita apenas contas pré-definidas.');
                }
                const mockUser = createMockUser(normalizedExpectedEmail, role, 'Conta Google (Teste)');
                saveMockSession(mockUser);
                return mockUser;
            }

            const oauthValidation = validateOAuthRuntimeConfig();
            if (!oauthValidation.ok) {
                throw new Error(`Configuração OAuth inválida: ${oauthValidation.issues.join(' | ')}`);
            }

            const precheckResponse = await fetch(`${API_URL}/auth/precheck-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedExpectedEmail }),
            });
            const precheckPayload = await precheckResponse.json().catch(() => ({}));
            if (!precheckResponse.ok || !precheckPayload?.allowed) {
                throw new Error('Este e-mail ainda não está autorizado para login com Google.');
            }

            const redirectTo = getOAuthRedirectUrl();
            localStorage.setItem(OAUTH_EXPECTED_EMAIL_KEY, normalizedExpectedEmail);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                        login_hint: normalizedExpectedEmail,
                    },
                    data: { role }
                }
            });

            if (error) {
                localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
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

            if (isSupabaseMock) {
                throw new Error('Cadastro real está desabilitado no modo teste.');
            }

            try {
                const { data: authData, error } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password: data.password,
                    options: {
                        data: {
                            full_name: data.name,
                            role: normalizedRole
                        }
                    }
                });
                
                if (error) throw error;
                
                if (authData.session) {
                    promoteToRealSession(authData.session.access_token);
                }
                
                const user = await api.auth.getCurrentSession();
                if (user) return user;

                return baseUser({
                    id: authData.user?.id || `user_${hashString(normalizedEmail).slice(0, 8)}`,
                    email: normalizedEmail,
                    name: data.name || normalizedEmail.split('@')[0] || 'Viajante',
                    role: normalizedRole,
                    avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${normalizedEmail}`,
                });
            } catch (err: any) {
                if (!isLikelyNetworkError(err?.message)) {
                    throw err;
                }
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
                    throw new Error(errorData.error || response.statusText || 'Falha no cadastro');
                }

                const payload = await response.json();
                const token = payload?.session?.access_token;
                promoteToRealSession(token);

                return baseUser({
                    id: payload?.user?.id || `user_${hashString(normalizedEmail).slice(0, 8)}`,
                    email: payload?.user?.email || normalizedEmail,
                    name: payload?.user?.name || data.name || normalizedEmail.split('@')[0] || 'Viajante',
                    role: normalizeRole(payload?.user?.role || normalizedRole),
                    avatar: payload?.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${normalizedEmail}`,
                });
            }
        },
        getCurrentSession: async (): Promise<User | null> => {
            if (!isSupabaseMock && localStorage.getItem(MOCK_USER_KEY)) {
                clearMockArtifacts({ preserveAuthToken: true });
                localStorage.removeItem(SESSION_MODE_KEY);
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

                    const rawRole = normalizeRole(session.user.user_metadata.role);
                    if (!session.user.user_metadata?.role && !isSupabaseMock) {
                        await supabase.auth.signOut();
                        clearMockArtifacts();
                        localStorage.removeItem(SESSION_MODE_KEY);
                        throw new Error('Conta não autorizada. Faça cadastro primeiro ou use conta de teste.');
                    }

                    promoteToRealSession(session.access_token);
                    return baseUser({
                        id: session.user.id,
                        email: sessionEmail,
                        name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Viajante',
                        role: rawRole,
                        avatar: session.user.user_metadata.avatar_url || '',
                    });
                }
            } catch (err: any) {
                if (err?.message?.includes('não corresponde') || err?.message?.includes('Conta não autorizada')) {
                    throw err;
                }
                // Fallback handled below.
            }

            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) return null;

            const payload = decodeJwtPayload(token);
            if (!payload?.email) return null;

            const isMockToken = token === MOCK_AUTH_TOKEN;
            if (isMockToken && !isSupabaseMock && getSessionMode() !== 'mock') {
                clearMockArtifacts();
                localStorage.removeItem(SESSION_MODE_KEY);
                return null;
            }
            if (!isMockToken) {
                setSessionMode('real');
            }

            return baseUser({
                id: payload.userId || payload.sub || `user_${hashString(payload.email).slice(0, 8)}`,
                email: payload.email,
                name: payload.name || payload.email.split('@')[0] || 'Viajante',
                role: normalizeRole(payload.role || inferRoleFromEmail(payload.email)),
                avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${payload.email}`,
            });
        },
        logout: async () => {
            try {
                if (!isSupabaseMock) {
                    await supabase.auth.signOut();
                }
            } catch {
                // Continue local cleanup even if remote sign-out fails.
            }
            clearMockArtifacts();
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(MOCK_USER_KEY);
            localStorage.removeItem(SESSION_MODE_KEY);
            localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
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
        checkIn: async (uid: string, reward: number = 50) => {
            try {
                return await request('/users/checkin', {
                    method: 'POST',
                    body: JSON.stringify({ userId: uid, reward })
                });
            } catch {
                return { user: null, reward: 0 };
            }
        }
    },
    payment: {
        checkout: async (amount: number, description: string, providerId?: string) => {
            try {
                return await request('/checkout', {
                    method: 'POST',
                    body: JSON.stringify({ amount, description, receiverId: providerId })
                });
            } catch {
                return { success: false };
            }
        }
    },
    professionals: {
        list: async (): Promise<Professional[]> => {
            try {
                return await request('/profiles?role=PROFESSIONAL');
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
                return await request(`/professionals/${pid}/finance`);
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
        }
    },
    appointments: {
        list: async (uid: string, role: UserRole) => {
            try {
                const all = await request('/appointments');
                if (role === UserRole.PROFESSIONAL) return all.filter((a: Appointment) => a.professionalId === uid);
                return all.filter((a: Appointment) => a.clientId === uid);
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
                return await request('/marketplace');
            } catch {
                return [];
            }
        },
        listByOwner: async (oid: string) => {
            try {
                return await request(`/marketplace?owner=${oid}`);
            } catch {
                return [];
            }
        },
        create: async (p: any) => {
            try {
                return await request('/marketplace', {
                    method: 'POST',
                    body: JSON.stringify(p)
                });
            } catch {
                return { ...p, id: `prod_${Date.now()}` };
            }
        },
        delete: async (id: string) => {
            try {
                await request(`/marketplace/${id}`, { method: 'DELETE' });
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
        }
    },
    spaces: {
        getRooms: async (uid?: string) => {
            try {
                return await request('/spaces/rooms');
            } catch {
                return [];
            }
        },
        getTeam: async (uid?: string) => {
            try {
                return await request('/spaces/team');
            } catch {
                return [];
            }
        },
        getVacancies: async (uid?: string) => {
            try {
                return await request('/spaces/vacancies');
            } catch {
                return [];
            }
        },
        createVacancy: async (v: any) => {
            try {
                return await request('/spaces/vacancies', {
                    method: 'POST',
                    body: JSON.stringify(v)
                });
            } catch {
                return v;
            }
        },
        getTransactions: async (uid?: string) => {
            try {
                return await request('/spaces/transactions');
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
                return await request('/spaces/events');
            } catch {
                return [];
            }
        },
        createEvent: async (evt: any) => {
            try {
                return await request('/spaces/events', {
                    method: 'POST',
                    body: JSON.stringify(evt)
                });
            } catch {
                return { ...evt, id: `evt_${Date.now()}` };
            }
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
                return await request('/admin/marketplace');
            } catch {
                return [];
            }
        },
        getGlobalFinance: async () => {
            try {
                return await request('/admin/finance');
            } catch {
                return {};
            }
        },
        getLgpdAudit: async () => {
            try {
                return await request('/admin/lgpd');
            } catch {
                return [];
            }
        },
        getSystemHealth: async () => {
            try {
                return await request('/admin/health');
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
            try {
                return await request('/metamorphosis/checkin', {
                    method: 'POST',
                    body: JSON.stringify({ mood, hash, thumb })
                });
            } catch {
                return { id: Date.now(), mood, photoThumb: thumb };
            }
        },
        getEvolution: async () => {
            try {
                return await request('/metamorphosis/evolution');
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
        listRooms: async () => {
            try {
                return await request('/chat/rooms');
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
    }
};
