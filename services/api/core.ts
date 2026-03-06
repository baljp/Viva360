// ─── services/api/core.ts ─────────────────────────────────────────────────────
// Monta o requestClient com:
//   • Sessão real via cookie HttpOnly
//   • Header Bearer apenas para sessão mock
//   • Silent 401 refresh via Supabase
//   • Telemetria estruturada (lib/telemetry)
// ─────────────────────────────────────────────────────────────────────────────

import { errorTelemetry, sessionTelemetry } from '../../lib/telemetry';
import { createRequestClient } from './requestClient';
import {
  API_URL,
  RETRYABLE_STATUS_CODES,
  isLikelyNetworkError,
} from './session';
import { MOCK_AUTH_TOKEN, MOCK_USER_KEY, canUseMockSession } from './mock';
import { getSessionMode } from './session';

// Importação lazy do Supabase para não criar dependência circular em testes
const getSupabase = () => import('../../lib/supabase').then(m => m.supabase);

const getHeader = () => {
  const isMockSession =
    canUseMockSession() &&
    getSessionMode() === 'mock' &&
    !!localStorage.getItem(MOCK_USER_KEY);
  return {
    'Content-Type': 'application/json',
    ...(isMockSession && MOCK_AUTH_TOKEN ? { Authorization: `Bearer ${MOCK_AUTH_TOKEN}` } : {}),
  };
};

/**
 * Silent 401 refresh:
 *  1. Tenta supabase.auth.refreshSession()
 *  2. Se ok: salva novo token e retorna — requestClient vai retentar a request
 *  3. Se falhou: dispara evento global 'viva360:session-expired'
 *     e retorna null (requestClient vai lançar SESSION_EXPIRED)
 */
/**
 * handleUnauthorized — chamado pelo requestClient em 401.
 *
 * Contrato:
 *   • Renova a sessão Supabase e replica o token para cookie HttpOnly.
 *   • Retorna o token em sucesso, null em falha.
 *   • NÃO dispara 'viva360:session-expired' — isso é responsabilidade
 *     do requestClient, que é o único ponto de despacho do evento.
 *     (Evita duplo dispatch quando refresh falha.)
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
      return null; // requestClient vai despachar 'viva360:session-expired'
    }

    const newToken = data.session.access_token;
    const cookieResponse = await fetch(`${API_URL}/auth/session/cookie`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
      },
      body: '{}',
    });

    if (!cookieResponse.ok) {
      sessionTelemetry.record('token_refresh_fail', {
        error: `cookie_${cookieResponse.status}`,
      });
      return null;
    }

    sessionTelemetry.record('token_refresh_ok');
    return newToken;
  } catch (err) {
    sessionTelemetry.record('token_refresh_fail', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return null; // requestClient vai despachar 'viva360:session-expired'
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
