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
    operations: {
        getSummary: async () => {
            return await request('/finance/summary', { purpose: 'finance-summary' });
        },
        getTransactions: async () => {
            return await request('/finance/transactions', { purpose: 'finance-transactions' });
        },
        requestWithdrawal: async (amount: number, destination: 'pix' | 'bank' = 'pix', note?: string) => {
            return await request('/finance/withdraw', {
                method: 'POST',
                purpose: 'finance-withdraw',
                body: JSON.stringify({ amount, destination, note }),
            });
        },
        donate: async (amount: number, cause: string) => {
            return await request('/finance/donate', {
                method: 'POST',
                purpose: 'finance-donate',
                body: JSON.stringify({ amount, cause }),
            });
        },
        reinvest: async (amount: number, target: string) => {
            return await request('/finance/reinvest', {
                method: 'POST',
                purpose: 'finance-reinvest',
                body: JSON.stringify({ amount, target }),
            });
        },
        exportReport: async () => {
            return await request('/finance/export', {
                purpose: 'finance-export',
                timeoutMs: 12000,
                retries: 0,
            });
        },
    },
});
