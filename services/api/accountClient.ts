import { createAccountDomain } from './domains/account';
import { request } from './core';
import { normalizeProfilePayload } from './session';

export const accountApi = createAccountDomain({
  request: request as any,
  normalizeProfilePayload,
});

