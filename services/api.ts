import { createApiDomains } from './api/domains';
import { authApi } from './api/authProxy';
import { buildOracleFallbackCard, getOracleCache, isSameDay, saveOracleCache } from './api/oracle';
import { request } from './api/core';
import { normalizeProfilePayload, getSessionMode } from './api/session';
export { request } from './api/core';

export const api = {
  auth: authApi,
  ...createApiDomains({
    request,
    normalizeProfilePayload,
    getOracleCache,
    saveOracleCache,
    isSameDay,
    buildOracleFallbackCard,
  }),
};
