import { Request, Response } from 'express';
import { DeterministicEngine, Mood } from '../lib/determinism';
import { logsQueue } from '../queue';
import { isMockMode } from '../services/supabase.service';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';

// In-memory mock DB
const METAMORPHOSIS_DB: Record<string, any[]> = {};

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { mood, photoHash, photoThumb } = req.body;

    if (!mood) return res.status(400).json({ error: 'Mood is required' });

    // 1. Retrieve History
    const userHistory = METAMORPHOSIS_DB[userId] || [];
    const recentMoods = userHistory.map(h => h.mood);

    // 2. Run Deterministic Engine
    const recommendation = DeterministicEngine.process(mood as Mood, recentMoods);

    // 3. Persist
    const entry = {
        id: Date.now().toString(),
        userId,
        timestamp: new Date().toISOString(),
        mood,
        photoHash,
        photoThumb,
        ...recommendation
    };

    if (!METAMORPHOSIS_DB[userId]) METAMORPHOSIS_DB[userId] = [];
    METAMORPHOSIS_DB[userId].push(entry);

    // ASYNC
    logsQueue.add('emotional_log', entry).catch(err => console.error('Queue Error:', err));

    return res.json({ success: true, entry });
});

export const getEvolution = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { days } = req.query; 

    if (isMockMode()) {
        const userHistory = METAMORPHOSIS_DB[userId] || [];
        return res.json({
            entries: userHistory,
            totalEntries: userHistory.length,
            lastMood: userHistory[userHistory.length-1]?.mood || 'Neutral',
            streak: 3, 
            evolutionScore: 850,
            readFrom: 'In-Memory Store (Mock)'
        });
    }

    const projection = await prisma.metamorphosisProjection.findUnique({
        where: { user_id: userId }
    });

    if (!projection) {
        return res.json({
            entries: [],
            totalEntries: 0,
            evolutionScore: 0,
            note: "No projection found yet (async processing)"
        });
    }

    return res.json({
        totalEntries: projection.total_checkins,
        lastMood: projection.last_mood,
        streak: projection.streak_days,
        evolutionScore: projection.evolution_score,
        readFrom: 'MetamorphosisProjection (Materialized View)'
    });
});
