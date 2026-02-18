import { User, UserRole } from '../../types';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const AUTH_TOKEN_KEY = 'viva360.auth.token';
export const SESSION_MODE_KEY = 'viva360.session.mode';
export const OAUTH_EXPECTED_EMAIL_KEY = 'viva360.oauth.expected_email';
export const OAUTH_INTENT_KEY = 'viva360.oauth.intent';
export const OAUTH_ROLE_KEY = 'viva360.oauth.role';

export const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
export const IS_PROD_BUILD = import.meta.env.PROD || import.meta.env.MODE === 'production';

export const parseSafe = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const normalizeRole = (value?: string | UserRole): UserRole => {
  const role = String(value || '').toUpperCase();
  if (role === UserRole.PROFESSIONAL) return UserRole.PROFESSIONAL;
  if (role === UserRole.SPACE) return UserRole.SPACE;
  if (role === UserRole.ADMIN) return UserRole.ADMIN;
  return UserRole.CLIENT;
};

export const normalizeRoleList = (values?: Array<string | UserRole | null | undefined>): UserRole[] => {
  const result: UserRole[] = [];
  (values || []).forEach((value) => {
    const normalized = normalizeRole(value || UserRole.CLIENT);
    if (!result.includes(normalized)) result.push(normalized);
  });
  return result;
};

export const inferRoleFromEmail = (email: string): UserRole => {
  const normalized = String(email || '').toLowerCase();
  if (normalized.startsWith('admin') || normalized.includes('admin@')) return UserRole.ADMIN;
  if (normalized.startsWith('pro') || normalized.includes('guard')) return UserRole.PROFESSIONAL;
  if (normalized.startsWith('space') || normalized.includes('hub') || normalized.includes('santuario')) return UserRole.SPACE;
  return UserRole.CLIENT;
};

export const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

export const isLikelyNetworkError = (message?: string): boolean => {
  const text = String(message || '').toLowerCase();
  return ['network', 'fetch', 'dns', 'nxdomain', 'failed to fetch'].some((token) => text.includes(token));
};

export const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();

const canonicalizeGoogleMailbox = (email: string): string => {
  const normalized = normalizeEmail(email);
  const [local, domain] = normalized.split('@');
  if (!local || !domain) return normalized;

  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
  if (!isGmail) return normalized;

  const noPlus = local.split('+')[0] || local;
  const noDots = noPlus.replace(/\./g, '');
  return `${noDots}@gmail.com`;
};

export const emailsMatchForOAuth = (expected: string, actual: string): boolean => {
  const a = normalizeEmail(expected);
  const b = normalizeEmail(actual);
  if (!a || !b) return false;
  if (a === b) return true;
  return canonicalizeGoogleMailbox(a) === canonicalizeGoogleMailbox(b);
};

export const baseUser = (overrides: Partial<User> & Pick<User, 'id' | 'email' | 'name' | 'role'>): User => ({
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

export const getSessionMode = (): 'mock' | 'real' | null => {
  const value = localStorage.getItem(SESSION_MODE_KEY);
  if (value === 'mock' || value === 'real') return value;
  return null;
};

export const setSessionMode = (mode: 'mock' | 'real') => {
  localStorage.setItem(SESSION_MODE_KEY, mode);
};

export const clearSupabaseSessionArtifacts = () => {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('sb-') && key.includes('-auth-token')) {
      localStorage.removeItem(key);
    }
  }
};

export type TimedFetchOptions = RequestInit & { timeoutMs?: number };

export const fetchWithTimeout = async (url: string, options: TimedFetchOptions = {}) => {
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

export const decodeJwtPayload = (token: string): any | null => {
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

export const normalizeProfilePayload = (input: any): User => {
  const role = normalizeRole(input?.role || input?.active_role || input?.activeRole || UserRole.CLIENT);
  const roles = normalizeRoleList(Array.isArray(input?.roles) ? input.roles : [role]);
  const snaps = Array.isArray(input?.snaps)
    ? input.snaps
        .map((entry: any) => ({
          id: String(entry?.id || ''),
          date: String(entry?.date || entry?.timestamp || new Date().toISOString()),
          // May be blank when images are kept device-local (IndexedDB).
          image: String(entry?.image || entry?.photoThumb || entry?.thumb || ''),
          mood: String(entry?.mood || 'SERENO') as any,
          note: String(entry?.note || entry?.reflection || entry?.quote || ''),
          phrases: Array.isArray(entry?.phrases) ? entry.phrases : [],
        }))
        .filter((entry: any) => entry.id)
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

