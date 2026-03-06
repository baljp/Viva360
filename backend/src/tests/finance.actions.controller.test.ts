import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  financeServiceMock,
  handleDbReadFallbackMock,
  prismaMock,
  saveMockFinanceTransactionMock,
  listMockFinanceTransactionsMock,
} = vi.hoisted(() => ({
  financeServiceMock: {
    getSummary: vi.fn(),
    getTransactions: vi.fn(),
  },
  handleDbReadFallbackMock: vi.fn(),
  prismaMock: {
    profile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  saveMockFinanceTransactionMock: vi.fn(),
  listMockFinanceTransactionsMock: vi.fn(),
}));

vi.mock('../services/finance.service', () => ({ financeService: financeServiceMock }));
vi.mock('../lib/dbReadFallback', () => ({ handleDbReadFallback: handleDbReadFallbackMock }));
vi.mock('../lib/prisma', () => ({ default: prismaMock }));
vi.mock('../services/mockAdapter', () => ({
  saveMockFinanceTransaction: saveMockFinanceTransactionMock,
  listMockFinanceTransactions: listMockFinanceTransactionsMock,
}));

import {
  exportReportInternal,
  requestWithdrawalInternal,
} from '../controllers/finance.controller';

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('Finance actions controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.APP_MODE;
    delete process.env.ENABLE_TEST_MODE;
  });

  it('blocks withdrawal when authenticated user lacks balance', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'pro-1',
      personal_balance: 40,
      corporate_balance: 0,
    });

    const req: any = {
      user: { userId: 'pro-1', role: 'PROFESSIONAL' },
      body: { amount: 80, destination: 'pix' },
    };
    const res = makeRes();

    await requestWithdrawalInternal(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'INSUFFICIENT_FUNDS',
      available: 40,
    }));
  });

  it('creates a real withdrawal transaction and decrements the correct balance', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'space-1',
      personal_balance: 10,
      corporate_balance: 500,
    });
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback({
      profile: {
        update: vi.fn().mockResolvedValue({
          personal_balance: 10,
          corporate_balance: 350,
        }),
      },
      transaction: {
        create: vi.fn().mockResolvedValue({ id: 'tx-1' }),
      },
    }));

    const req: any = {
      user: { userId: 'space-1', role: 'SPACE' },
      body: { amount: 150, destination: 'bank' },
    };
    const res = makeRes();

    await requestWithdrawalInternal(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'WITHDRAWAL_REQUESTED',
      protocol: 'tx-1',
      balanceField: 'corporate_balance',
      balance: 350,
    }));
  });

  it('exports a normalized financial report', async () => {
    financeServiceMock.getSummary.mockResolvedValue({ personal_balance: 120, corporate_balance: 0 });
    financeServiceMock.getTransactions.mockResolvedValue([
      {
        id: 'tx-1',
        user_id: 'client-1',
        amount: 55,
        type: 'expense',
        status: 'completed',
        date: new Date('2026-03-05T00:00:00.000Z'),
      },
    ]);

    const req: any = { user: { userId: 'client-1' } };
    const res = makeRes();

    await exportReportInternal(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      summary: { personal_balance: 120, corporate_balance: 0 },
      transactions: [
        expect.objectContaining({
          id: 'tx-1',
          amount: 55,
          date: '2026-03-05T00:00:00.000Z',
        }),
      ],
    }));
  });
});
