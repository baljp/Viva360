import type { Achievement, DailyQuest, DailyRitualSnap, GrimoireMeta, MoodType, PlantStage, User } from '../../types';
import { UserRole } from '../../types';

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

const asRecord = (value: unknown): Record<string, unknown> =>
  (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};

const asDailyQuest = (value: unknown): DailyQuest | null => {
  const entry = asRecord(value);
  const id = String(entry.id || '').trim();
  const label = String(entry.label || '').trim();
  if (!id || !label) return null;
  return {
    id,
    label,
    description: entry.description ? String(entry.description) : undefined,
    reward: Number(entry.reward || 0),
    isCompleted: !!entry.isCompleted,
    type: entry.type && ['ritual', 'water', 'breathe', 'other'].includes(String(entry.type))
      ? (String(entry.type) as DailyQuest['type'])
      : undefined,
  };
};

const asAchievement = (value: unknown): Achievement | null => {
  const entry = asRecord(value);
  const id = String(entry.id || '').trim();
  const label = String(entry.label || '').trim();
  const description = String(entry.description || '').trim();
  const icon = String(entry.icon || '').trim();
  const category = String(entry.category || '').trim();
  if (!id || !label || !description || !icon) return null;
  if (!['streak', 'karma', 'social', 'ritual', 'mastery'].includes(category)) return null;
  return {
    id,
    label,
    description,
    icon,
    category: category as Achievement['category'],
    threshold: Number(entry.threshold || 0),
    unlockedAt: entry.unlockedAt ? String(entry.unlockedAt) : undefined,
  };
};

const asSnap = (value: unknown): DailyRitualSnap | null => {
  const entry = asRecord(value);
  const id = String(entry.id || '').trim();
  if (!id) return null;
  const moodRaw = String(entry.mood || 'SERENO').toUpperCase();
  const allowedMoods: MoodType[] = ['SERENO', 'VIBRANTE', 'MELANCÓLICO', 'ANSIOSO', 'FOCADO', 'EXAUSTO', 'GRATO'];
  const mood = (allowedMoods.includes(moodRaw as MoodType) ? moodRaw : 'SERENO') as MoodType;
  const rawPhrases = Array.isArray(entry.phrases) ? entry.phrases.filter((p): p is string => typeof p === 'string') : [];
  return {
    id,
    date: String(entry.date || entry.timestamp || new Date().toISOString()),
    image: String(entry.image || entry.photoThumb || entry.thumb || ''),
    mood,
    note: entry.note || entry.reflection || entry.quote ? String(entry.note || entry.reflection || entry.quote) : undefined,
    phrases: rawPhrases.length >= 2 ? [rawPhrases[0], rawPhrases[1]] : undefined,
  };
};

const asGrimoireMeta = (value: unknown): GrimoireMeta | undefined => {
  const entry = asRecord(value);
  if (entry.totalCards === undefined && entry.total_cards === undefined) return undefined;
  return {
    totalCards: Number(entry.totalCards ?? entry.total_cards ?? 0),
    lastSyncedAt: entry.lastSyncedAt || entry.last_synced_at ? String(entry.lastSyncedAt || entry.last_synced_at) : null,
    source: entry.source ? String(entry.source) : undefined,
  };
};

export const normalizeProfilePayload = (input: unknown): User => {
  const payload = asRecord(input);
  const role = normalizeRole(String(payload.role || payload.active_role || payload.activeRole || UserRole.CLIENT));
  const roles = normalizeRoleList(Array.isArray(payload.roles) ? payload.roles as Array<string | UserRole> : [role]);
  const snaps = Array.isArray(payload.snaps)
    ? payload.snaps.map(asSnap).filter((entry): entry is DailyRitualSnap => !!entry)
    : [];
  const dailyQuests = Array.isArray(payload.dailyQuests)
    ? payload.dailyQuests.map(asDailyQuest).filter((entry): entry is DailyQuest => !!entry)
    : undefined;
  const achievements = Array.isArray(payload.achievements)
    ? payload.achievements.map(asAchievement).filter((entry): entry is Achievement => !!entry)
    : undefined;
  const grimoireMeta = asGrimoireMeta(payload.grimoireMeta);
  const plantStageRaw = String(payload.plantStage || payload.plant_stage || 'seed');
  const plantStage = (['seed', 'sprout', 'bud', 'flower', 'tree', 'withered'].includes(plantStageRaw) ? plantStageRaw : 'seed') as PlantStage;

  return baseUser({
    id: String(payload.id || ''),
    email: String(payload.email || ''),
    name: String(payload.name || payload.full_name || 'Viajante'),
    role,
    activeRole: role,
    roles,
    avatar: String(payload.avatar || ''),
    karma: Number(payload.karma ?? 0),
    streak: Number(payload.streak ?? 0),
    multiplier: Number(payload.multiplier ?? 1),
    personalBalance: Number(payload.personalBalance ?? payload.personal_balance ?? 0),
    corporateBalance: Number(payload.corporateBalance ?? payload.corporate_balance ?? 0),
    plantStage,
    plantXp: Number(payload.plantXp ?? payload.plant_xp ?? 0),
    plantHealth: Number(payload.plantHealth ?? payload.plant_health ?? 100),
    lastCheckIn: payload.lastCheckIn || payload.last_check_in ? String(payload.lastCheckIn || payload.last_check_in) : undefined,
    lastWateredAt: payload.lastWateredAt || payload.last_watered_at ? String(payload.lastWateredAt || payload.last_watered_at) : undefined,
    lastBlessingAt: payload.lastBlessingAt || payload.last_blessing_at ? String(payload.lastBlessingAt || payload.last_blessing_at) : undefined,
    lastMood: payload.lastMood || payload.last_mood ? String(payload.lastMood || payload.last_mood) as MoodType : undefined,
    bio: payload.bio ? String(payload.bio) : undefined,
    location: payload.location ? String(payload.location) : undefined,
    snaps,
    dailyQuests,
    achievements,
    grimoireMeta,
  });
};
