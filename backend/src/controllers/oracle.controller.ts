import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import prisma from '../lib/prisma';
import { oracleService } from '../services/oracle.service';

const getUserContext = async (userId: string, moodBody: string) => {
    const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { plant_xp: true, plant_stage: true },
    }).catch(() => null);

    return {
        mood: moodBody || 'sereno',
        gardenStatus: {
            health: Math.min(100, (profile?.plant_xp || 0)),
            waterNeeded: (profile?.plant_xp || 0) < 20,
        },
        metamorphosisPhase: profile?.plant_stage || 'seed',
    };
};

export const drawCard = asyncHandler(async (req: Request, res: Response) => {
    const userId = String((req as any).user?.userId || (req as any).user?.id || '').trim();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { mood } = req.body;

    const context = await getUserContext(userId, mood);
    const card = await oracleService.drawCard(userId, context);

    if (!card) {
        return res.status(503).json({ error: 'Oráculo temporariamente indisponível.' });
    }

    return res.json({
        drawId: Date.now().toString(),
        card: {
            id: card.id,
            name: 'Oráculo Viva360',
            insight: (card as any).text || (card as any).message,
            element: card.element,
            intensity: 'Média',
            category: card.category
        },
        drawnAt: new Date().toISOString(),
        moodContext: mood || 'neutral'
    });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
     const userId = String((req as any).user?.userId || (req as any).user?.id || '').trim();
     if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
     }
     const history = await oracleService.getHistory(userId);
     return res.json(
        history.map((entry) => ({
            drawId: entry.id,
            drawnAt: entry.drawn_at,
            card: {
                id: entry.message.id,
                name: 'Oráculo Viva360',
                insight: entry.message.text,
                element: entry.message.element,
                category: entry.message.category,
            },
            context: entry.context,
        }))
     );
});

export const getToday = asyncHandler(async (req: Request, res: Response) => {
    const userId = String((req as any).user?.userId || (req as any).user?.id || '').trim();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const card = await oracleService.getToday(userId);
    
    if (!card) {
        return res.status(404).json({ error: 'Nenhuma carta revelada hoje ainda.' });
    }

    return res.json({
        card: {
            id: card.id,
            name: 'Guia Diário',
            insight: (card as any).text || (card as any).message,
            element: card.element
        }
    });
});
