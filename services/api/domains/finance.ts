import type { Transaction } from '../../../types';
import type { DomainRequest } from './common';

type FinanceDomainDeps = {
    request: DomainRequest;
};

export const createFinanceDomain = ({ request }: FinanceDomainDeps) => ({
    client: {
        getSummary: async (): Promise<{ transactions: Transaction[]; personal_balance: number; corporate_balance: number; totalPaid: number; last30Days: number }> => {
            return await request('/finance/client/summary', {
                purpose: 'finance-client-summary',
            });
        },
    },
});
