export const ALLOWED_ROLES = new Set(['CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN']);

export type AccessReason =
  | 'PROFILE_ACTIVE'
  | 'INVITE_APPROVED_PENDING_REGISTRATION'
  | 'OPEN_CLIENT_REGISTRATION'
  | 'INVITE_ALREADY_USED'
  | 'INVITE_PENDING_APPROVAL'
  | 'EMAIL_BLOCKED'
  | 'EMAIL_NOT_AUTHORIZED'
  | 'REGISTRATION_INCOMPLETE'
  | 'PROFILE_MISSING_WILL_AUTOCREATE'
  | 'EMAIL_NOT_CONFIRMED';

export type AccountState =
  | 'ACTIVE'
  | 'INVITE_PENDING_REGISTRATION'
  | 'OPEN_SELF_SERVE'
  | 'INCOMPLETE_REGISTRATION'
  | 'BLOCKED'
  | 'PENDING_APPROVAL'
  | 'NOT_AUTHORIZED'
  | 'INVITE_USED_NO_PROFILE';

export type NextAction =
  | 'LOGIN'
  | 'REGISTER'
  | 'COMPLETE_REGISTRATION'
  | 'REQUEST_INVITE'
  | 'WAIT_APPROVAL'
  | 'CONTACT_SUPPORT'
  | 'CONFIRM_EMAIL';

export type AuthorizationStatus = {
  canLogin: boolean;
  canRegister: boolean;
  role: string | null;
  roles: string[];
  reason: AccessReason;
  accountState: AccountState;
  nextAction: NextAction;
};

export const ALLOWLIST_REGISTER_STATUSES = new Set(['APPROVED', 'ACTIVE']);
export const ALLOWLIST_BLOCKED_STATUSES = new Set(['BLOCKED', 'REVOKED']);
export const ALLOWLIST_PENDING_STATUSES = new Set(['PENDING']);

export const normalizeAllowlistStatus = (status?: string | null) => String(status || '').trim().toUpperCase();
export const normalizeRole = (role?: string | null): string | null => {
  const normalized = String(role || '').trim().toUpperCase();
  if (!normalized) return null;
  return ALLOWED_ROLES.has(normalized) ? normalized : null;
};

export const normalizeRoleList = (roles: Array<string | null | undefined>): string[] => {
  const output: string[] = [];
  for (const role of roles) {
    const normalized = normalizeRole(role);
    if (normalized && !output.includes(normalized)) output.push(normalized);
  }
  return output;
};

export const defaultRole = (role?: string | null) => normalizeRole(role) || 'CLIENT';
export const isSelfServeOpenRole = (role?: string | null) => defaultRole(role) === 'CLIENT';

export const isSafeFallbackRuntime = () =>
  process.env.NODE_ENV === 'test' || String(process.env.APP_MODE || '').toUpperCase() === 'MOCK';

export const isDbUnavailableError = (error: unknown) => {
  const code = String((error as { code?: unknown })?.code || '');
  const message = String((error as { message?: unknown })?.message || '');
  return ['P1000', 'P1001', 'P1002', 'P1017'].includes(code)
    || /authentication failed against database server/i.test(message)
    || /circuit breaker open/i.test(message)
    || /too many authentication errors/i.test(message);
};

export const inferRoleFromIdentity = (input?: string | null): string => {
  const normalized = String(input || '').trim().toLowerCase();
  if (normalized.includes('admin')) return 'ADMIN';
  if (normalized.startsWith('pro') || normalized.includes('guard')) return 'PROFESSIONAL';
  if (normalized.startsWith('space') || normalized.includes('hub') || normalized.includes('santuario')) return 'SPACE';
  return 'CLIENT';
};
