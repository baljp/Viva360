// ─── services/api/core.ts ─────────────────────────────────────────────────────
// Monta o requestClient com:
//   • Headers de auth (Bearer token do localStorage)
//   • Silent 401 refresh via Supabase
//   • Telemetria estruturada (lib/telemetry)
// ─────────────────────────────────────────────────────────────────────────────

import { errorTelemetry, sessionTelemetry } from '../../lib/telemetry';
import { createRequestClient } from './requestClient';
import {
  AUTH_TOKEN_KEY,
  API_URL,
  RETRYABLE_STATUS_CODES,
  isLikelyNetworkError,
} from './session';
import { MOCK_AUTH_TOKEN, MOCK_USER_KEY, canUseMockSession, getSessionMode } from './mock';

// Importação lazy do Supabase para não criar dependência circular em testes
const getSupabase = () => import('../../lib/supabase').then(m => m.supabase);

const getHeader = () => {
  const isMockSession =
    canUseMockSession() &&
    getSessionMode() === 'mock' &&
    !!localStorage.getItem(MOCK_USER_KEY);
  const token =
    localStorage.getItem(AUTH_TOKEN_KEY) ||
    (isMockSession && MOCK_AUTH_TOKEN ? MOCK_AUTH_TOKEN : '');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Silent 401 refresh:
 *  1. Tenta supabase.auth.refreshSession()
 *  2. Se ok: salva novo token e retorna — requestClient vai retentar a request
 *  3. Se falhou: dispara evento global 'viva360:session-expired'
 *     e retorna null (requestClient vai lançar SESSION_EXPIRED)
 */
const handleUnauthorized = async (_endpoint: string): Promise<string | null> => {
  // Sessões mock nunca expiram
  if (canUseMockSession() && getSessionMode() === 'mock') return null;

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session?.access_token) {
      sessionTelemetry.record('token_refresh_fail', {
        error: error?.message || 'no_session',
      });
      // Avisa a app para redirecionar ao login
      window.dispatchEvent(new CustomEvent('viva360:session-expired'));
      return null;
    }

    const newToken = data.session.access_token;
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    sessionTelemetry.record('token_refresh_ok');
    return newToken;
  } catch (err) {
    sessionTelemetry.record('token_refresh_fail', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    window.dispatchEvent(new CustomEvent('viva360:session-expired'));
    return null;
  }
};

export const request = createRequestClient({
  apiUrl: API_URL,
  getHeaders: getHeader,
  retryableStatusCodes: RETRYABLE_STATUS_CODES,
  isLikelyNetworkError,
  onUnauthorized: handleUnauthorized,
  captureError: (error, context) => {
    errorTelemetry.capture(error, {
      endpoint: context.endpoint,
      op: context.purpose || 'request',
    });
  },
});
