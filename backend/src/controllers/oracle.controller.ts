import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import prisma from '../lib/prisma';
import { oracleService } from '../services/oracle.service';
import { OracleResponseDTO } from '../../../types';
import type { AuthenticatedRequest } from '../types/request';

type OracleCardView = {
    id: string;
    text?: string | null;
    message?: string | null;
    element?: string | null;
    category?: string | null;
};

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
    const request = req as AuthenticatedRequest;
    const userId = String(request.user?.userId || request.user?.id || '').trim();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { mood } = req.body;

    const context = await getUserContext(userId, mood);
    const card = await oracleService.drawCard(userId, context);

    if (!card) {
        return res.status(503).json({ error: 'Oráculo temporariamente indisponível.' });
    }

    const response: OracleResponseDTO = {
        drawId: Date.now().toString(),
        card: {
            id: String(card.id),
            name: 'Oráculo Viva360',
            insight: String((card as OracleCardView).text || (card as OracleCardView).message || ''),
            element: String(card.element || ''),
            intensity: 'Média',
            category: String(card.category || '')
        },
        drawnAt: new Date().toISOString(),
        moodContext: String(mood || 'neutral')
    };

    return res.json(response);
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    const userId = String(request.user?.userId || request.user?.id || '').trim();
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
    const request = req as AuthenticatedRequest;
    const userId = String(request.user?.userId || request.user?.id || '').trim();
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
            insight: (card as OracleCardView).text || (card as OracleCardView).message,
            element: card.element
        }
    });
});
