import { User, UserRole } from '../../types';
import { isMockMode as isSupabaseMock, TEST_MODE_ENABLED } from '../../lib/supabase';
import {
  AUTH_TOKEN_KEY,
  IS_PROD_BUILD,
  baseUser,
  getSessionMode,
  hashString,
  normalizeEmail,
  normalizeRole,
  parseSafe,
  setSessionMode,
} from './session';
import { ORACLE_HISTORY_KEY } from './oracle';

export const MOCK_USER_KEY = 'viva360.mock_user';
// SEC-01: Mock token read from env var, never hardcoded in source code.
export const MOCK_AUTH_TOKEN = String(import.meta.env.VITE_MOCK_AUTH_TOKEN || '').trim();
const TEST_MODE_ACTIVATION_KEY = 'viva360.test_mode.active';
// DATA-01: Unified mock flag — single source of truth.
const MOCK_ENABLED = String(import.meta.env.VITE_MOCK_ENABLED || '').trim().toLowerCase() === 'true';
export const TEST_ACCOUNT_PASSWORD = '123456';

const STRICT_TEST_ACCOUNTS: Record<string, { id: string; role: UserRole; name: string }> = {
  'client0@viva360.com': { id: '11111111-1111-4111-8111-111111111111', role: UserRole.CLIENT, name: 'Buscador Teste' },
  'cliente@viva360.com': { id: '11111111-1111-4111-8111-111111111111', role: UserRole.CLIENT, name: 'Buscador Master' },
  'pro0@viva360.com': { id: '22222222-2222-4222-8222-222222222222', role: UserRole.PROFESSIONAL, name: 'Guardião Teste' },
  'pro@viva360.com': { id: '22222222-2222-4222-8222-222222222222', role: UserRole.PROFESSIONAL, name: 'Guardião Master' },
  'contato.hub0@viva360.com': { id: '33333333-3333-4333-8333-333333333333', role: UserRole.SPACE, name: 'Santuário Teste' },
  'space@viva360.com': { id: '33333333-3333-4333-8333-333333333333', role: UserRole.SPACE, name: 'Santuário Master' },
  'admin@viva360.com': { id: '11111111-1111-4111-8111-111111111111', role: UserRole.ADMIN, name: 'Admin Viva360' },
};
const STRICT_TEST_EMAILS = new Set(Object.keys(STRICT_TEST_ACCOUNTS));

export const isStrictTestEmail = (email: string) => STRICT_TEST_EMAILS.has(normalizeEmail(email));

const isLocalDevRuntime = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// DATA-01: Simplified mock eligibility — single flag instead of chain of localStorage + env checks.
export const isTestRuntimeAllowed = () =>
  !IS_PROD_BUILD && MOCK_ENABLED && (isSupabaseMock || (TEST_MODE_ENABLED && isLocalDevRuntime()));

const isTestModeActivated = () => {
  if (!MOCK_ENABLED) return false;
  const activation = localStorage.getItem(TEST_MODE_ACTIVATION_KEY) === '1';
  const currentMode = getSessionMode() === 'mock';
  return activation || currentMode;
};

const activateTestMode = () => {
  localStorage.setItem(TEST_MODE_ACTIVATION_KEY, '1');
};

export const clearTestMode = () => {
  localStorage.removeItem(TEST_MODE_ACTIVATION_KEY);
};

export const canUseMockSession = () => MOCK_ENABLED && isTestRuntimeAllowed() && isTestModeActivated();

export const clearMockArtifacts = (opts?: { preserveAuthToken?: boolean }) => {
  const preserveAuthToken = !!opts?.preserveAuthToken;
  const keysToDrop = [
    MOCK_USER_KEY,
    ORACLE_HISTORY_KEY,
    'viva360.oauth.expected_email',
    'viva360.oauth.intent',
    'viva360.oauth.role',
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

export const promoteToRealSession = (token?: string) => {
  clearMockArtifacts({ preserveAuthToken: true });
  clearTestMode();
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
  setSessionMode('real');
};

const inferRoleFromEmail = (email: string): UserRole => {
  const normalized = email.toLowerCase();
  if (normalized.startsWith('admin') || normalized.includes('admin@')) return UserRole.ADMIN;
  if (normalized.startsWith('pro') || normalized.includes('guard')) return UserRole.PROFESSIONAL;
  if (normalized.startsWith('space') || normalized.includes('hub') || normalized.includes('santuario')) return UserRole.SPACE;
  return UserRole.CLIENT;
};

export const createMockUser = (email: string, role?: UserRole, name?: string): User => {
  const normalizedEmail = normalizeEmail(email);
  const strictTest = STRICT_TEST_ACCOUNTS[normalizedEmail];
  const normalizedRole = role || strictTest?.role || inferRoleFromEmail(normalizedEmail);
  const prefix =
    normalizedRole === UserRole.PROFESSIONAL
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

export const saveMockSession = (user: User) => {
  if (!isTestRuntimeAllowed()) {
    throw new Error('Modo teste indisponível neste ambiente.');
  }
  if (!MOCK_AUTH_TOKEN) {
    throw new Error('Mock token não configurado (VITE_MOCK_AUTH_TOKEN).');
  }
  activateTestMode();
  setSessionMode('mock');
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_TOKEN_KEY, MOCK_AUTH_TOKEN);
};

export const getMockSession = (): User | null => {
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
