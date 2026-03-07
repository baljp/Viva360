import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { z } from 'zod';
import { isMockMode } from '../lib/appMode';
import { isDbUnavailableError } from '../lib/dbReadFallback';

const router = Router();

const drawSchema = z.object({
  cardId:      z.string().min(1),
  archetype:   z.string().min(1),
  element:     z.string().min(1),
  rarity:      z.enum(['common', 'rare', 'epic', 'legendary']),
  message:     z.string().min(1),
  visualTheme: z.string().min(1),
  xpReward:    z.number().int().min(0),
});

const isMissingSoulCardPersistenceError = (error: unknown): boolean => {
  const code = String((error as { code?: string })?.code || '').toUpperCase();
  if (code === 'P2021' || code === 'P2022') return true;

  const metaCode = String((error as { meta?: { code?: string } })?.meta?.code || '').toUpperCase();
  if (metaCode === '42P01' || metaCode === '42703') return true;

  return String((error as { message?: string })?.message || '').toLowerCase().includes('soul_card_entries');
};

// POST /soul-cards/draw — persiste uma carta sorteada
router.post('/draw', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || '').trim();
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const body = drawSchema.parse(req.body);

  // Upsert: se a carta já existe na coleção do usuário, apenas atualiza drawn_at
  let entry = null;
  try {
    entry = await prisma.soulCardEntry.upsert({
      where:  { profile_id_card_id: { profile_id: userId, card_id: body.cardId } },
      create: {
        profile_id:   userId,
        card_id:      body.cardId,
        archetype:    body.archetype,
        element:      body.element,
        rarity:       body.rarity,
        message:      body.message,
        visual_theme: body.visualTheme,
        xp_reward:    body.xpReward,
      },
      update: { drawn_at: new Date() },
    });
  } catch (error) {
    if (!isMissingSoulCardPersistenceError(error) && !(isMockMode() && isDbUnavailableError(error))) throw error;
    logger.warn('soul_cards.draw.persistence_unavailable', {
      userId,
      code: String((error as { code?: string })?.code || ''),
      message: String((error as { message?: string })?.message || ''),
    });
  }

  return res.json({ success: true, entry });
}));

// GET /soul-cards/collection — retorna toda a coleção do usuário
router.get('/collection', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || '').trim();
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  let rows: Array<{
    card_id: string;
    archetype: string;
    element: string;
    rarity: string;
    message: string;
    visual_theme: string;
    xp_reward: number;
    drawn_at: Date;
  }> = [];
  try {
    rows = await prisma.soulCardEntry.findMany({
      where:   { profile_id: userId },
      orderBy: { drawn_at: 'desc' },
      select: {
        card_id: true,
        archetype: true,
        element: true,
        rarity: true,
        message: true,
        visual_theme: true,
        xp_reward: true,
        drawn_at: true,
      },
    });
  } catch (error) {
    if (!isMissingSoulCardPersistenceError(error) && !(isMockMode() && isDbUnavailableError(error))) throw error;
    logger.warn('soul_cards.collection.persistence_unavailable', {
      userId,
      code: String((error as { code?: string })?.code || ''),
      message: String((error as { message?: string })?.message || ''),
    });
  }

  const collection = rows.map((r) => ({
    id:          r.card_id,
    archetype:   r.archetype,
    element:     r.element,
    rarity:      r.rarity,
    message:     r.message,
    visualTheme: r.visual_theme,
    xpReward:    r.xp_reward,
    createdAt:   r.drawn_at.toISOString(),
  }));

  return res.json(collection);
}));

export default router;
