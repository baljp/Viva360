import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { financeService } from '../services/finance.service';
import { handleDbReadFallback } from '../lib/dbReadFallback';

const resolveAuthUserId = (req: Request): string => String(req.user?.userId || req.user?.id || '').trim();

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
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
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = resolveAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
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
      fallbackPayload: [],
    })) return;
    throw err;
  }
});
