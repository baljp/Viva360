import { createCommerceDomain } from './domains/commerce';
import { request } from './core';

export const commerceApi = createCommerceDomain({
  request: request as any,
});

