import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';
import prisma from '../lib/prisma';
import { z } from 'zod';

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

// POST /soul-cards/draw — persiste uma carta sorteada
router.post('/draw', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || '').trim();
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const body = drawSchema.parse(req.body);

  // Upsert: se a carta já existe na coleção do usuário, apenas atualiza drawn_at
  const entry = await (prisma as any).soulCardEntry.upsert({
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
  }).catch(() => null); // graceful: DB pode não ter a tabela ainda

  return res.json({ success: true, entry });
}));

// GET /soul-cards/collection — retorna toda a coleção do usuário
router.get('/collection', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || '').trim();
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const rows = await (prisma as any).soulCardEntry.findMany({
    where:   { profile_id: userId },
    orderBy: { drawn_at: 'desc' },
  }).catch(() => []); // graceful fallback

  const collection = (rows as any[]).map((r: any) => ({
    id:          r.card_id,
    archetype:   r.archetype,
    element:     r.element,
    rarity:      r.rarity,
    message:     r.message,
    visualTheme: r.visual_theme,
    xpReward:    r.xp_reward,
    createdAt:   r.drawn_at?.toISOString?.() ?? new Date().toISOString(),
  }));

  return res.json(collection);
}));

export default router;
