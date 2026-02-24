import { createCommunityDomain } from './domains/community';
import { request } from './core';
import type { DomainRequest } from './domains/common';

export const communityApi = createCommunityDomain({
  request: request as DomainRequest,
});
