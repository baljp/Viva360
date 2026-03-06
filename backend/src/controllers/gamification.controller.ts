import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async.middleware';
import prisma from '../lib/prisma';
import { gamificationService } from '../services/gamification.service';

const questSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  reward: z.number(),
  type: z.enum(['ritual', 'water', 'breathe', 'other']).optional(),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const achievementSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  category: z.enum(['streak', 'karma', 'social', 'ritual', 'mastery']),
  threshold: z.number(),
  unlockedAt: z.string().optional(),
});

const getUserId = (req: Request) => String(req.user?.userId || req.user?.id || '').trim();

export const getState = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const dateKey = typeof req.query.dateKey === 'string' ? req.query.dateKey : undefined;
  const state = await gamificationService.getState(userId, dateKey);
  return res.json(state);
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const leaderboard = await gamificationService.getLeaderboard(userId);
  return res.json(leaderboard);
});

export const getSeasonalLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const leaderboard = await gamificationService.getSeasonalLeaderboard(userId);
  return res.json(leaderboard);
});

export const completeQuest = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const questId = String(req.params.questId || '').trim();
  const parsed = questSchema.safeParse({ ...(req.body || {}), id: questId || req.body?.id });
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid quest payload', details: parsed.error.flatten() });
  }
  const quest = {
    id: parsed.data.id,
    label: parsed.data.label,
    description: parsed.data.description,
    reward: parsed.data.reward,
    type: parsed.data.type,
    dateKey: parsed.data.dateKey,
  };
  const result = await gamificationService.completeQuest(userId, quest);
  return res.json({ ok: true, ...result });
});

export const syncAchievements = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const parsed = z.object({ achievements: z.array(achievementSchema).max(200) }).safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid achievements payload', details: parsed.error.flatten() });
  }
  const achievements = parsed.data.achievements.map((achievement) => ({
    id: achievement.id,
    label: achievement.label,
    description: achievement.description,
    icon: achievement.icon,
    category: achievement.category,
    threshold: achievement.threshold,
    unlockedAt: achievement.unlockedAt,
  }));
  const state = await gamificationService.syncAchievements(userId, achievements);
  return res.json({ ok: true, state });
});

export const getKarmaHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const limit = Math.min(Number(req.query.limit) || 30, 100);

  try {
    const receipts = await prisma.interactionReceipt.findMany({
      where: {
        actor_id: userId,
        status: { in: ['COMPLETED', 'CREATED'] },
      },
      orderBy: { updated_at: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entity_type: true,
        payload: true,
        updated_at: true,
      },
    });

    const LABELS: Record<string, string> = {
      CHECKIN: 'Check-in Diário',
      DAILY_QUEST: 'Missão Diária',
      METAMORPHOSIS: 'Ritual de Metamorfose',
      ORACLE: 'Consulta ao Oráculo',
      TRIBE: 'Interação na Tribo',
      QUEST: 'Missão Concluída',
    };

    const transactions = receipts.map((r) => {
      const payloadObj = (r.payload && typeof r.payload === 'object') ? (r.payload as Record<string, unknown>) : {};
      const reward = Number(payloadObj.reward ?? payloadObj.karma ?? 0);
      const action = String(r.action || '').toUpperCase();
      const actionKey = Object.keys(LABELS).find((k) => action.includes(k)) || r.entity_type;
      return {
        id: String(r.id),
        action: LABELS[actionKey] || String(r.action || 'Ação').replace(/_/g, ' '),
        amount: reward || (action.includes('CHECKIN') ? 5 : action.includes('QUEST') ? 15 : action.includes('RITUAL') ? 10 : 5),
        date: r.updated_at.toISOString(),
        type: reward < 0 ? 'spend' : 'earn',
      };
    });

    return res.json({ transactions });
  } catch (err) {
    // Graceful fallback: return empty list, don't crash
    return res.json({ transactions: [] });
  }
});
