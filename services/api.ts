import { captureFrontendError } from '../lib/frontendLogger';
import { createRequestClient } from './api/requestClient';
import { createApiDomains } from './api/domains';
import { createAuthApi } from './api/auth';
import { buildOracleFallbackCard, getOracleCache, isSameDay, saveOracleCache } from './api/oracle';
import { AUTH_TOKEN_KEY, API_URL, RETRYABLE_STATUS_CODES, isLikelyNetworkError } from './api/session';
import { MOCK_AUTH_TOKEN, MOCK_USER_KEY, canUseMockSession } from './api/mock';
import { normalizeProfilePayload, getSessionMode } from './api/session';

const getHeader = () => {
  const isMockSession = canUseMockSession() && getSessionMode() === 'mock' && !!localStorage.getItem(MOCK_USER_KEY);
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || (isMockSession && MOCK_AUTH_TOKEN ? MOCK_AUTH_TOKEN : '');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  auth: createAuthApi(request as any),
  ...createApiDomains({
    request,
    normalizeProfilePayload,
    getOracleCache,
    saveOracleCache,
    isSameDay,
    buildOracleFallbackCard,
  }),
};
