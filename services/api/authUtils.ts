import { UserRole } from '../../types';
import { supabase } from '../../lib/supabase';
import {
  OAUTH_EXPECTED_EMAIL_KEY,
  OAUTH_INTENT_KEY,
  OAUTH_ROLE_KEY,
  normalizeEmail,
  normalizeRole,
  normalizeRoleList,
} from './session';

type OAuthIntent = 'login' | 'register';

export const clearOAuthIntentStorage = () => {
  localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
  localStorage.removeItem(OAUTH_INTENT_KEY);
  localStorage.removeItem(OAUTH_ROLE_KEY);
};

export const setOAuthIntentStorage = (params: { expectedEmail?: string; intent: OAuthIntent; role?: UserRole | null }) => {
  const normalizedExpectedEmail = normalizeEmail(params.expectedEmail || '');
  if (normalizedExpectedEmail) localStorage.setItem(OAUTH_EXPECTED_EMAIL_KEY, normalizedExpectedEmail);
  else localStorage.removeItem(OAUTH_EXPECTED_EMAIL_KEY);
  localStorage.setItem(OAUTH_INTENT_KEY, params.intent);
  if (params.role) {
    localStorage.setItem(OAUTH_ROLE_KEY, normalizeRole(params.role));
  } else {
    localStorage.removeItem(OAUTH_ROLE_KEY);
  }
  return normalizedExpectedEmail;
};

export const startGoogleOAuthRedirect = async (params: {
  redirectTo: string;
  expectedEmail?: string;
  intent: OAuthIntent;
  role?: UserRole | null;
}) => {
  const normalizedExpectedEmail = setOAuthIntentStorage({
    expectedEmail: params.expectedEmail,
    intent: params.intent,
    role: params.intent === 'register' ? (params.role || null) : null,
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: params.redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
        ...(normalizedExpectedEmail ? { login_hint: normalizedExpectedEmail } : {}),
      },
    },
  });

  if (error) {
    clearOAuthIntentStorage();
    throw error;
  }
  if (data?.url) {
    window.location.assign(data.url);
    throw new Error('REDIRECTING_TO_GOOGLE');
  }
  throw new Error('Falha ao iniciar autenticação Google.');
};

export const normalizeAuthRoleMutationPayload = (
  payload: any,
  fallbackRole: UserRole,
): { userId: string; roles: UserRole[]; activeRole: UserRole } => {
  const source = payload?.data || payload;
  const roles = normalizeRoleList(Array.isArray(source?.roles) ? source.roles : [fallbackRole]);
  const activeRole = normalizeRole(source?.activeRole || roles[0] || fallbackRole);
  return {
    userId: String(source?.userId || ''),
    roles: roles.length ? roles : [activeRole],
    activeRole,
  };
};

export const normalizeAuthRoleListPayload = (
  payload: any,
): { userId: string; roles: UserRole[]; activeRole: UserRole } => {
  const source = payload?.data || payload;
  const roles = normalizeRoleList(Array.isArray(source?.roles) ? source.roles : []);
  const activeRole = normalizeRole(source?.activeRole || roles[0] || UserRole.CLIENT);
  return {
    userId: String(source?.userId || ''),
    roles: roles.length ? roles : [activeRole],
    activeRole,
  };
};
