import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────
const { financeServiceMock, handleDbReadFallbackMock } = vi.hoisted(() => ({
    financeServiceMock: {
        getSummary: vi.fn(),
        getTransactions: vi.fn(),
    },
    handleDbReadFallbackMock: vi.fn(),
}));

vi.mock('../services/finance.service', () => ({ financeService: financeServiceMock }));
vi.mock('../lib/dbReadFallback', () => ({ handleDbReadFallback: handleDbReadFallbackMock }));

import { getClientSummaryInternal } from '../controllers/finance.controller';

// ── Helpers ────────────────────────────────────────────────────────────
const makeRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('Finance Controller: getClientSummary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns combined finance summary and transactions for a client', async () => {
        const userId = 'client-1';
        const summary = { personal_balance: 100, corporate_balance: 50 };
        const transactions = [
            { id: 't-1', amount: 30, type: 'expense', status: 'paid', user_id: userId },
            { id: 't-2', amount: 20, type: 'expense', status: 'paid', user_id: userId },
            { id: 't-3', amount: 15, type: 'income', status: 'paid', user_id: userId },
        ];

        financeServiceMock.getSummary.mockResolvedValue(summary);
        financeServiceMock.getTransactions.mockResolvedValue(transactions);

        const req: any = { user: { userId } };
        const res = makeRes();
        const next = vi.fn();

        await getClientSummaryInternal(req, res);

        expect(financeServiceMock.getSummary).toHaveBeenCalledWith(userId);
        expect(financeServiceMock.getTransactions).toHaveBeenCalledWith(userId);
        expect(res.json).toHaveBeenCalledWith({
            ...summary,
            transactions,
            totalPaid: 50,
            last30Days: 50,
        });
    });

    it('returns 401 if user is not authenticated', async () => {
        const req: any = { user: {} };
        const res = makeRes();
        const next = vi.fn();

        await getClientSummaryInternal(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    });

    it('handles service errors via dbReadFallback', async () => {
        const userId = 'client-1';
        const error = new Error('Database error');
        financeServiceMock.getSummary.mockRejectedValue(error);
        handleDbReadFallbackMock.mockReturnValue(true);

        const req: any = { user: { userId } };
        const res = makeRes();
        const next = vi.fn();

        await getClientSummaryInternal(req, res);

        expect(handleDbReadFallbackMock).toHaveBeenCalledWith(res, error, expect.objectContaining({
            route: 'finance.getClientSummary',
        }));
    });
});
