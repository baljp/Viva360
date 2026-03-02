import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { financeService } from '../services/finance.service';
import { handleDbReadFallback } from '../lib/dbReadFallback';
import { listMockFinanceTransactions } from '../services/mockAdapter';

const resolveAuthUserId = (req: Request): string => String(req.user?.userId || req.user?.id || '').trim();

export const getSummaryInternal = async (req: Request, res: Response) => {
  const userId = resolveAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
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

export const getClientSummaryInternal = async (req: Request, res: Response) => {
  const userId = resolveAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
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

    return res.json({
      ...summary,
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
