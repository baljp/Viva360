import type { User } from '../../../types';
import type { DomainRequest } from './common';
import { createAccountDomain } from './account';
import { createCommerceDomain } from './commerce';
import { createCommunityDomain } from './community';
import { createHubDomain } from './hub';
import { createWellnessDomain, type OracleCachedEntry } from './wellness';

type DomainFactoryDeps = {
  request: DomainRequest;
  normalizeProfilePayload: (input: any) => User;
  getOracleCache: () => OracleCachedEntry[];
  saveOracleCache: (entries: OracleCachedEntry[]) => void;
  isSameDay: (isoA: string, isoB: string) => boolean;
  buildOracleFallbackCard: (mood: string) => OracleCachedEntry['card'];
};

export const createApiDomains = (deps: DomainFactoryDeps) => ({
  ...createAccountDomain({
    request: deps.request,
    normalizeProfilePayload: deps.normalizeProfilePayload,
  }),
  ...createCommerceDomain({ request: deps.request }),
  ...createCommunityDomain({ request: deps.request }),
  ...createHubDomain({ request: deps.request }),
  ...createWellnessDomain({
    request: deps.request,
    getOracleCache: deps.getOracleCache,
    saveOracleCache: deps.saveOracleCache,
    isSameDay: deps.isSameDay,
    buildOracleFallbackCard: deps.buildOracleFallbackCard,
  }),
});
