import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { isMockMode } from '../services/supabase.service';

import { cacheGet, cacheSet, cacheInvalidate } from '../lib/cache';

export const getStatus = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (isMockMode()) {
    return res.json({
        karma: 120,
        streak: 5,
        multiplier: 1.2,
        plant: { xp: 45, stage: 'seed' }
    });
  }

  const cacheKey = `status:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const data = {
    karma: profile.karma,
    streak: profile.streak,
    multiplier: profile.multiplier,
    plant: {
      xp: profile.plant_xp,
      stage: profile.plant_stage
    }
  };
  
  await cacheSet(cacheKey, data, 30); // 30s Cache
  return res.json(data);
};

export const getQuests = async (req: Request, res: Response) => {
  // Return static quests for stress test
  return res.json([
    { id: 'q1', title: 'Morning Meditation', reward: 50, completed: false },
    { id: 'q2', title: 'Drink Water', reward: 10, completed: true },
    { id: 'q3', title: 'Journaling', reward: 30, completed: false }
  ]);
};

export const checkIn = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { mood } = req.body;
  
  if (isMockMode()) {
     return res.json({ success: true, new_streak: 6 });
  }

  const profile = await prisma.profile.update({
    where: { id: userId },
    data: {
      streak: { increment: 1 },
      karma: { increment: 20 },
      plant_xp: { increment: 15 }
    }
  });

  await cacheInvalidate(`status:${userId}`);

  return res.json({ success: true, new_streak: profile.streak });
};
