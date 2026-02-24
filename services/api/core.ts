import { captureFrontendError } from '../../lib/frontendLogger';
import { createRequestClient } from './requestClient';
import { AUTH_TOKEN_KEY, API_URL, RETRYABLE_STATUS_CODES, getSessionMode, isLikelyNetworkError } from './session';
import { MOCK_AUTH_TOKEN, MOCK_USER_KEY, canUseMockSession } from './mock';

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
