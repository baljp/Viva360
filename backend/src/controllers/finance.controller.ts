import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { financeService } from '../services/finance.service';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  
  const data = await financeService.getSummary(userId);
  return res.json(data);
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  
  const transactions = await financeService.getTransactions(userId);
  return res.json(transactions);
});
