import { createFinanceDomain } from './domains/finance';
import { request } from './core';
import type { DomainRequest } from './domains/common';

export const financeApi = createFinanceDomain({
    request: request as DomainRequest,
});
