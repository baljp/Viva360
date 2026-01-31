import { Request, Response } from 'express';
import prisma, { prismaRead } from '../lib/prisma';
import { DeterministicEngine, Mood } from '../lib/determinism';
import { asyncHandler } from '../middleware/async.middleware';

import { oracleService } from '../services/oracle.service';

// Mock DB/Service calls for context until authentic User/Profile services are fully typed/linked
const getUserContext = async (userId: string, moodBody: string) => {
    // In real app, fetch from Profile/GardenService
    return {
        mood: moodBody || 'sereno',
        gardenStatus: { health: 80, waterNeeded: false }, // Mock
        metamorphosisPhase: 'germinacao' // Mock
    };
};

export const drawCard = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || 'mock-user-id'; // Fallback for dev
    const { mood } = req.body;

    // Simulate "shuffling" delay for UX
    await new Promise(r => setTimeout(r, 1500));

    const context = await getUserContext(userId, mood);
    const card = await oracleService.drawCard(userId, context);

    return res.json({
        drawId: Date.now().toString(),
        card: {
            id: card.id,
            name: 'Oráculo Viva360', // Generic title or from Category
            insight: (card as any).text || (card as any).message,
            element: card.element,
            intensity: 'Média', // Could calculate based on depth
            category: card.category
        },
        drawnAt: new Date().toISOString(),
        moodContext: mood || 'neutral'
    });
});

// History endpoint to be implemented with real OracleHistory model
export const getHistory = asyncHandler(async (req: Request, res: Response) => {
     // Mock return for now
     return res.json([]);
});

export const getToday = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || 'mock-user-id';
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
