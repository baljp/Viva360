import { Request, Response } from 'express';
import prisma from '../lib/prisma';

import { cacheGet, cacheSet, cacheInvalidate } from '../lib/cache';

export const getSummary = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  
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
};

export const getTransactions = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  
  const transactions = await prisma.transaction.findMany({
    where: { user_id: userId },
    orderBy: { date: 'desc' },
    take: 20
  });

  return res.json(transactions);
};
