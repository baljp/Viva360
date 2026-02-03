import { Request, Response } from 'express';
import { DeterministicEngine, Mood } from '../lib/determinism';
import { logsQueue } from '../queue';
import { isMockMode } from '../services/supabase.service';
import prisma from '../lib/prisma';
import { CloudinaryService } from '../services/cloudinary.service';
import { asyncHandler } from '../middleware/async.middleware';
import { oracleService } from '../services/oracle.service';

// In-memory mock DB
const METAMORPHOSIS_DB: Record<string, any[]> = {};

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { mood, photoHash, photoThumb } = req.body;

    if (!mood) return res.status(400).json({ error: 'Mood is required' });

    // Asset Optimization: Upload to CDN
    const optimizedPhotoUrl = photoThumb ? await CloudinaryService.uploadImage(photoThumb) : null;

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
        photoThumb: optimizedPhotoUrl,
        ...recommendation
    };

    if (!METAMORPHOSIS_DB[userId]) METAMORPHOSIS_DB[userId] = [];
    METAMORPHOSIS_DB[userId].push(entry);

    // PERSISTENCE (Non-Mock)
    if (!isMockMode()) {
        await prisma.$transaction(async (tx) => {
            // 1. Create Event
            await tx.event.create({
                data: {
                    stream_id: userId,
                    type: 'MOOD_LOGGED',
                    payload: entry as any
                }
            });

            // 2. Upsert Projection
            await tx.metamorphosisProjection.upsert({
                where: { user_id: userId },
                create: {
                    user_id: userId,
                    total_checkins: 1,
                    last_mood: mood,
                    evolution_score: 10
                },
                update: {
                    total_checkins: { increment: 1 },
                    last_mood: mood,
                    evolution_score: { increment: 10 }
                }
            });
        });
    }

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

    const [projection, events] = await Promise.all([
        prisma.metamorphosisProjection.findUnique({
            where: { user_id: userId }
        }),
        prisma.event.findMany({
            where: { stream_id: userId, type: 'MOOD_LOGGED' },
            orderBy: { created_at: 'desc' },
            take: 20
        })
    ]);

    if (!projection && events.length === 0) {
        return res.json({
            entries: [],
            totalEntries: 0,
            evolutionScore: 0,
            note: "No projection found yet (async processing)"
        });
    }

    const entries = events.map(e => ({
        id: e.id,
        timestamp: e.created_at,
        mood: (e.payload as any).mood,
        quote: (e.payload as any).quote,
        reflection: (e.payload as any).reflection,
        photoThumb: (e.payload as any).photoThumb
    }));

    return res.json({
        entries,
        totalEntries: projection?.total_checkins || entries.length,
        lastMood: projection?.last_mood || entries[0]?.mood,
        streak: projection?.streak_days || 1,
        evolutionScore: projection?.evolution_score || 0,
        readFrom: 'DB (Events + Projection)'
    });
});
