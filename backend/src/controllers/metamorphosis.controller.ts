import { Request, Response } from 'express';
import { DeterministicEngine, Mood } from '../lib/determinism';
import { logsQueue } from '../lib/queue';
import { isMockMode } from '../services/supabase.service';
import prisma from '../lib/prisma';
import { CloudinaryService } from '../services/cloudinary.service';
import { asyncHandler } from '../middleware/async.middleware';
import { oracleService } from '../services/oracle.service';
import { logger } from '../lib/logger';

// In-memory mock DB
const METAMORPHOSIS_DB: Record<string, any[]> = {};

const normalizeMood = (input: string): Mood => {
    const value = String(input || '').trim().toLowerCase();
    if (value === 'feliz' || value === 'vibrante') return 'Feliz';
    if (value === 'calmo' || value === 'sereno') return 'Calmo';
    if (value === 'grato') return 'Grato';
    if (value === 'motivado' || value === 'focado') return 'Motivado';
    if (value === 'cansado' || value === 'exausto') return 'Cansado';
    if (value === 'ansioso') return 'Ansioso';
    if (value === 'triste' || value === 'melancólico' || value === 'melancolico') return 'Triste';
    if (value === 'sobrecarregado') return 'Sobrecarregado';
    return 'Calmo';
};

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
    const userId = String((req as any).user?.userId || '').trim();
    const mood = String(req.body?.mood || '').trim();
    const photoHash = String(req.body?.photoHash || req.body?.hash || '').trim() || `hash_${Date.now()}`;
    const photoThumb = String(req.body?.photoThumb || req.body?.thumb || '').trim();

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!mood) return res.status(400).json({ error: 'Mood is required' });

    // Asset Optimization: Upload to CDN
    const optimizedPhotoUrl = photoThumb ? await CloudinaryService.uploadImage(photoThumb) : null;

    const normalizedMood = normalizeMood(mood);

    // 1. Retrieve History
    const runtimeHistory = METAMORPHOSIS_DB[userId] || [];
    let recentMoods = runtimeHistory.map((h) => normalizeMood(String(h.mood || '')));
    if (!isMockMode()) {
        const previousEvents = await prisma.event.findMany({
            where: { stream_id: userId, type: 'MOOD_LOGGED' },
            orderBy: { created_at: 'desc' },
            take: 10,
            select: { payload: true },
        }).catch(() => []);
        const dbMoods = previousEvents
            .map((event) => normalizeMood(String((event.payload as any)?.mood || '')))
            .filter(Boolean);
        if (dbMoods.length > 0) {
            recentMoods = dbMoods;
        }
    }

    // 2. Run Deterministic Engine
    const recommendation = DeterministicEngine.process(normalizedMood, recentMoods as Mood[]);

    // 3. Persist
    const entry = {
        id: Date.now().toString(),
        userId,
        timestamp: new Date().toISOString(),
        mood: normalizedMood,
        photoHash,
        photoThumb: optimizedPhotoUrl || photoThumb || null,
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
                    last_mood: normalizedMood,
                    evolution_score: 10
                },
                update: {
                    total_checkins: { increment: 1 },
                    last_mood: normalizedMood,
                    evolution_score: { increment: 10 }
                }
            });
        });
    }

    // ASYNC
    logsQueue.add('emotional_log', entry).catch((err: unknown) => logger.warn('queue.logs_add_failed', err));

    return res.json({ success: true, entry });
});

export const getEvolution = asyncHandler(async (req: Request, res: Response) => {
    const userId = String((req as any).user?.userId || '').trim();
    const { days } = req.query; 

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

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
        photoThumb: (e.payload as any).photoThumb || (e.payload as any).thumb || (e.payload as any).image || null
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
