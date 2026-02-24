import { createCommunityDomain } from './domains/community';
import { request } from './core';

export const communityApi = createCommunityDomain({
  request: request as any,
});

