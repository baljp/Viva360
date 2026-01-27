import { Request, Response } from 'express';
import prisma, { prismaRead } from '../lib/prisma';
import { DeterministicEngine, Mood } from '../lib/determinism';
import { asyncHandler } from '../middleware/async.middleware';

const ORACLE_DECK = [
    { id: 'sun', name: 'O Sol', insight: 'Sua luz interior é suficiente para guiar o caminho hoje. Brilhe sem medo.', element: 'Fogo', intensity: 'Alta' },
    { id: 'moon', name: 'A Lua', insight: 'Intuição é sua bússola. O que está oculto logo será revelado.', element: 'Água', intensity: 'Média' },
    { id: 'star', name: 'A Estrela', insight: 'Esperança renovada. Um ciclo difícil se encerra para o novo surgir.', element: 'Ar', intensity: 'Suave' },
    { id: 'root', name: 'Raízes', insight: 'Conecte-se com a terra. Estabilidade é o que você precisa agora.', element: 'Terra', intensity: 'Média' },
    { id: 'wind', name: 'Vento de Mudança', insight: 'Não resista ao fluxo. A mudança trará o crescimento que você pediu.', element: 'Ar', intensity: 'Alta' }
];

export const drawCard = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { mood } = req.body;

    // Simulate "shuffling" delay
    await new Promise(r => setTimeout(r, 1500));

    // Simple random logic for now, could be enhanced with mood seed
    const randomIndex = Math.floor(Math.random() * ORACLE_DECK.length);
    // 7. ASYNC ARCHITECTURE: Using Read Replica (Phase 2)
    // Placeholder for actual DB query when OracleDraw model is added
    // const history = await prismaRead.oracleDraw.findMany(...)
    
    // Simulate Read Replica delay
    await new Promise(r => setTimeout(r, 50)); 

    const card = ORACLE_DECK[randomIndex];

    return res.json({
        drawId: Date.now().toString(),
        card,
        drawnAt: new Date().toISOString(),
        moodContext: mood || 'neutral'
    });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
     return res.json([
         { date: '2024-01-20', card: ORACLE_DECK[0] },
         { date: '2024-01-21', card: ORACLE_DECK[2] }
     ]);
});
