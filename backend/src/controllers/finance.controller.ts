import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { financeService } from '../services/finance.service';
import { handleDbReadFallback } from '../lib/dbReadFallback';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
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
  const userId = req.user?.userId;
  try {
    const transactions = await financeService.getTransactions(userId);
    return res.json(transactions);
  } catch (err) {
    if (handleDbReadFallback(res, err, {
      route: 'finance.getTransactions',
      userId,
      fallbackPayload: [],
    })) return;
    throw err;
  }
});
