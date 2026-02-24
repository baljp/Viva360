import { createHubDomain } from './domains/hub';
import { request } from './core';

export const hubApi = createHubDomain({
  request: request as any,
});
