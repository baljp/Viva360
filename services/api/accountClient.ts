import { createAccountDomain } from './domains/account';
import { request } from './core';
import { normalizeProfilePayload } from './session';
import type { DomainRequest } from './domains/common';

export const accountApi = createAccountDomain({
  request: request as DomainRequest,
  normalizeProfilePayload,
});
