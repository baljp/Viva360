import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { financeService } from '../services/finance.service';
import { handleDbReadFallback } from '../lib/dbReadFallback';
import prisma from '../lib/prisma';
import { z } from 'zod';
import {
  getMockProfile,
  isMockMode,
  listMockFinanceTransactions,
  saveMockFinanceTransaction,
  saveMockProfile,
} from '../services/mockAdapter';

const resolveAuthUserId = (req: Request): string => String(req.user?.userId || req.user?.id || '').trim();
const resolveAuthRole = (req: Request): string => String(req.user?.role || '').trim().toUpperCase();
const resolveBalanceField = (role: string) => (role === 'SPACE' ? 'corporate_balance' : 'personal_balance');
const isMockFinanceRuntime = () =>
  isMockMode() || String(process.env.ENABLE_TEST_MODE || '').toLowerCase() === 'true';

const financeActionSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  cause: z.string().max(120).optional(),
  target: z.string().max(80).optional(),
  destination: z.enum(['pix', 'bank']).optional(),
  note: z.string().max(240).optional(),
});

const mockTx = (input: {
  userId: string;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  contextType: 'WITHDRAWAL' | 'DONATION' | 'REINVESTMENT';
}) => saveMockFinanceTransaction({
  id: `mock-fin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  user_id: input.userId,
  type: 'expense',
  amount: input.amount,
  description: input.description,
  status: input.status,
  date: new Date().toISOString(),
});

const getMockSummary = (userId: string) => {
  const profile = getMockProfile(userId);
  return {
    personal_balance: Number(profile?.personal_balance || 0),
    corporate_balance: Number(profile?.corporate_balance || 0),
  };
};

const decrementMockBalance = (userId: string, balanceField: 'personal_balance' | 'corporate_balance', amount: number) => {
  const current = getMockProfile(userId);
  if (!current) return null;
  if (Number(current[balanceField] || 0) < amount) return { error: 'INSUFFICIENT_FUNDS' as const, available: Number(current[balanceField] || 0) };

  const updated = saveMockProfile({
    ...current,
    [balanceField]: Number(current[balanceField] || 0) - amount,
  });

  return { profile: updated };
};

const resolveMockBalanceResult = (userId: string, balanceField: 'personal_balance' | 'corporate_balance', amount: number) => {
  const result = decrementMockBalance(userId, balanceField, amount);
  if (!result) {
    return { response: { error: 'Profile not found', code: 'PROFILE_NOT_FOUND' }, status: 404 as const };
  }
  if ('error' in result) {
    return {
      response: { error: 'Saldo insuficiente.', code: 'INSUFFICIENT_FUNDS', available: result.available },
      status: 409 as const,
    };
  }
  return { profile: result.profile, status: 200 as const };
};

const buildReportPayload = async (userId: string) => {
  if (isMockFinanceRuntime()) {
    return {
      generatedAt: new Date().toISOString(),
      summary: getMockSummary(userId),
      transactions: listMockFinanceTransactions(userId).map((tx) => ({
        ...tx,
        amount: Number(tx.amount || 0),
        date: String(tx.date || ''),
      })),
    };
  }

  const [summary, transactions] = await Promise.all([
    financeService.getSummary(userId),
    financeService.getTransactions(userId),
  ]);

  const scopedTransactions = Array.isArray(transactions)
    ? transactions.filter((row) => String((row as { user_id?: unknown }).user_id || '') === userId)
    : [];

  return {
    generatedAt: new Date().toISOString(),
    summary,
    transactions: scopedTransactions.map((tx) => ({
      ...tx,
      amount: Number((tx as { amount?: unknown }).amount || 0),
      date: (tx as { date?: Date | string | null }).date instanceof Date
        ? ((tx as { date: Date }).date.toISOString())
        : String((tx as { date?: unknown }).date || ''),
    })),
  };
};

export const getSummaryInternal = async (req: Request, res: Response) => {
  const userId = resolveAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
  if (isMockFinanceRuntime()) {
    return res.json(getMockSummary(userId));
  }
  try {
    const data = await financeService.getSummary(userId);
    return res.json(data);
  } catch (err) {
    if (handleDbReadFallback(res, err, {
      route: 'finance.getSummary',
      userId,
      fallbackPayload: { personal_balance: 0, corporate_balance: 0 },
    })) return;
    throw err;
  }
};
export const getSummary = asyncHandler(getSummaryInternal);

export const getTransactionsInternal = async (req: Request, res: Response) => {
  const userId = resolveAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
  const mockTransactions = listMockFinanceTransactions(userId);
  if (isMockFinanceRuntime()) {
    return res.json(mockTransactions);
  }
  try {
    const transactions = await financeService.getTransactions(userId);
    // Defensive filter: response scope is always the authenticated user.
    const scoped = Array.isArray(transactions)
      ? transactions.filter((row) => String((row as { user_id?: unknown }).user_id || '') === userId)
      : [];
    return res.json(scoped);
  } catch (err) {
    if (handleDbReadFallback(res, err, {
      route: 'finance.getTransactions',
      userId,
      fallbackPayload: mockTransactions,
    })) return;
    throw err;
  }
};
export const getTransactions = asyncHandler(getTransactionsInternal);

export const requestWithdrawalInternal = async (req: Request, res: Response) => {
  const userId = resolveAuthUserId(req);
  const role = resolveAuthRole(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const { amount, destination = 'pix', note } = financeActionSchema.parse(req.body || {});
  const balanceField = resolveBalanceField(role);
  const description = `Solicitação de saque via ${destination.toUpperCase()}`;

  if (isMockFinanceRuntime()) {
    const balanceUpdate = resolveMockBalanceResult(userId, balanceField, amount);
    if (!('profile' in balanceUpdate)) {
      return res.status(balanceUpdate.status).json(balanceUpdate.response);
    }
    const transaction = mockTx({ userId, amount, description, status: 'pending', contextType: 'WITHDRAWAL' });
    return res.status(201).json({
      code: 'WITHDRAWAL_REQUESTED',
      protocol: transaction.id,
      balanceField,
      balance: Number(balanceUpdate.profile[balanceField] || 0),
      transaction,
      metadata: { destination, note: note || null },
    });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, personal_balance: true, corporate_balance: true },
  });
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' });
  }

  const currentBalance = Number(profile[balanceField] || 0);
  if (currentBalance < amount) {
    return res.status(409).json({ error: 'Saldo insuficiente.', code: 'INSUFFICIENT_FUNDS', available: currentBalance });
  }

  const { updatedProfile, transaction } = await prisma.$transaction(async (tx) => {
    const updatedProfile = await tx.profile.update({
      where: { id: userId },
      data: { [balanceField]: { decrement: amount } },
      select: { personal_balance: true, corporate_balance: true },
    });
    const transaction = await tx.transaction.create({
      data: {
        user_id: userId,
        type: 'expense',
        amount,
        description,
        status: 'pending',
        provider: 'internal_wallet',
        provider_status: 'pending',
        context_type: 'WITHDRAWAL',
        metadata: {
          destination,
          note: note || null,
          requestedAt: new Date().toISOString(),
        },
      },
    });
    return { updatedProfile, transaction };
  });

  return res.status(201).json({
    code: 'WITHDRAWAL_REQUESTED',
    protocol: transaction.id,
    balanceField,
    balance: Number(updatedProfile[balanceField] || 0),
    transaction,
  });
};
export const requestWithdrawal = asyncHandler(requestWithdrawalInternal);

export const donateInternal = async (req: Request, res: Response) => {
  const userId = resolveAuthUserId(req);
  const role = resolveAuthRole(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const { amount, cause } = financeActionSchema.parse(req.body || {});
  const donationCause = String(cause || 'fundo-solidario').trim() || 'fundo-solidario';
  const balanceField = resolveBalanceField(role);
  const description = `Doação para ${donationCause}`;
  const karmaReward = Math.max(1, Math.round(amount));

  if (isMockFinanceRuntime()) {
    const balanceUpdate = resolveMockBalanceResult(userId, balanceField, amount);
    if (!('profile' in balanceUpdate)) {
      return res.status(balanceUpdate.status).json(balanceUpdate.response);
    }
    const transaction = mockTx({ userId, amount, description, status: 'completed', contextType: 'DONATION' });
    return res.status(201).json({
      code: 'DONATION_COMPLETED',
      karmaReward,
      balanceField,
      balance: Number(balanceUpdate.profile[balanceField] || 0),
      transaction,
    });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, personal_balance: true, corporate_balance: true },
  });
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' });
  }

  const currentBalance = Number(profile[balanceField] || 0);
  if (currentBalance < amount) {
    return res.status(409).json({ error: 'Saldo insuficiente.', code: 'INSUFFICIENT_FUNDS', available: currentBalance });
  }

  const { updatedProfile, transaction } = await prisma.$transaction(async (tx) => {
    const updatedProfile = await tx.profile.update({
      where: { id: userId },
      data: { [balanceField]: { decrement: amount } },
      select: { personal_balance: true, corporate_balance: true },
    });
    const transaction = await tx.transaction.create({
      data: {
        user_id: userId,
        type: 'expense',
        amount,
        description,
        status: 'completed',
        provider: 'internal_wallet',
        provider_status: 'completed',
        context_type: 'DONATION',
        metadata: {
          cause: donationCause,
          karmaReward,
        },
      },
    });
    return { updatedProfile, transaction };
  });

  return res.status(201).json({
    code: 'DONATION_COMPLETED',
    karmaReward,
    balanceField,
    balance: Number(updatedProfile[balanceField] || 0),
    transaction,
  });
};
export const donate = asyncHandler(donateInternal);

export const reinvestInternal = async (req: Request, res: Response) => {
  const userId = resolveAuthUserId(req);
  const role = resolveAuthRole(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const { amount, target } = financeActionSchema.parse(req.body || {});
  const reinvestTarget = String(target || 'garden').trim() || 'garden';
  const balanceField = resolveBalanceField(role);
  const description = `Reinvestimento em ${reinvestTarget}`;

  if (isMockFinanceRuntime()) {
    const balanceUpdate = resolveMockBalanceResult(userId, balanceField, amount);
    if (!('profile' in balanceUpdate)) {
      return res.status(balanceUpdate.status).json(balanceUpdate.response);
    }
    const transaction = mockTx({ userId, amount, description, status: 'completed', contextType: 'REINVESTMENT' });
    return res.status(201).json({
      code: 'REINVESTMENT_COMPLETED',
      balanceField,
      balance: Number(balanceUpdate.profile[balanceField] || 0),
      transaction,
    });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, personal_balance: true, corporate_balance: true },
  });
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' });
  }

  const currentBalance = Number(profile[balanceField] || 0);
  if (currentBalance < amount) {
    return res.status(409).json({ error: 'Saldo insuficiente.', code: 'INSUFFICIENT_FUNDS', available: currentBalance });
  }

  const { updatedProfile, transaction } = await prisma.$transaction(async (tx) => {
    const updatedProfile = await tx.profile.update({
      where: { id: userId },
      data: { [balanceField]: { decrement: amount } },
      select: { personal_balance: true, corporate_balance: true },
    });
    const transaction = await tx.transaction.create({
      data: {
        user_id: userId,
        type: 'expense',
        amount,
        description,
        status: 'completed',
        provider: 'internal_wallet',
        provider_status: 'completed',
        context_type: 'REINVESTMENT',
        metadata: { target: reinvestTarget },
      },
    });
    return { updatedProfile, transaction };
  });

  return res.status(201).json({
    code: 'REINVESTMENT_COMPLETED',
    balanceField,
    balance: Number(updatedProfile[balanceField] || 0),
    transaction,
  });
};
export const reinvest = asyncHandler(reinvestInternal);

export const exportReportInternal = async (req: Request, res: Response) => {
  const userId = resolveAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  try {
    const payload = await buildReportPayload(userId);
    return res.json(payload);
  } catch (err) {
    if (handleDbReadFallback(res, err, {
      route: 'finance.exportReport',
      userId,
      fallbackPayload: {
        generatedAt: new Date().toISOString(),
        summary: { personal_balance: 0, corporate_balance: 0 },
        transactions: listMockFinanceTransactions(userId),
      },
    })) return;
    throw err;
  }
};
export const exportReport = asyncHandler(exportReportInternal);

export const getClientSummaryInternal = async (req: Request, res: Response) => {
  const userId = resolveAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
  if (isMockFinanceRuntime()) {
    const summary = getMockSummary(userId);
    const transactions = listMockFinanceTransactions(userId);
    const totalPaid = transactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    return res.json({
      ...summary,
      transactions,
      totalPaid,
      last30Days: totalPaid,
    });
  }
  try {
    const [summary, transactions] = await Promise.all([
      financeService.getSummary(userId),
      financeService.getTransactions(userId),
    ]);

    // Calculate derived metrics if needed, or just return raw data for frontend
    const transactionsList = Array.isArray(transactions) ? transactions : [];
    const totalPaid = transactionsList
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const summaryPayload = summary && typeof summary === 'object' ? summary : {};

    return res.json({
      ...summaryPayload,
      transactions: transactionsList,
      totalPaid,
      last30Days: totalPaid, // Simplified for now
    });
  } catch (err) {
    if (handleDbReadFallback(res, err, {
      route: 'finance.getClientSummary',
      userId,
      fallbackPayload: { personal_balance: 0, corporate_balance: 0, transactions: [] },
    })) return;
    throw err;
  }
};
export const getClientSummary = asyncHandler(getClientSummaryInternal);
