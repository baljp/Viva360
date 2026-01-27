import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';
import { cacheGet, cacheSet } from '../lib/cache';
import { asyncHandler } from '../middleware/async.middleware';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  if (isMockMode()) {
    return res.json({
      personal_balance: 500,
      corporate_balance: 1500
    });
  }
  
  const cacheKey = `fin_summary:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const data = {
    personal_balance: profile.personal_balance,
    corporate_balance: profile.corporate_balance
  };
  await cacheSet(cacheKey, data, 10); // Short cache (10s) as balance changes often
  return res.json(data);
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  
  if (isMockMode()) {
    return res.json([
      { id: 'tx-1', amount: 100, description: 'Consulta Inicial', date: new Date().toISOString(), type: 'credit' },
      { id: 'tx-2', amount: -50, description: 'Taxa de Plataforma', date: new Date().toISOString(), type: 'debit' }
    ]);
  }

  const transactions = await prisma.transaction.findMany({
    where: { user_id: userId },
    orderBy: { date: 'desc' },
    take: 20
  });

  return res.json(transactions);
});
