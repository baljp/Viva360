import { Request, Response } from 'express';
import { DeterministicEngine, Mood } from '../lib/determinism';
import { logsQueue } from '../lib/queue';
import prisma from '../lib/prisma';
import { CloudinaryService } from '../services/cloudinary.service';
import { asyncHandler } from '../middleware/async.middleware';
import { logger } from '../lib/logger';
import { CheckInSchema } from '../schemas/metamorphosis.schema';

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
    const user = (req as any).user;
    if (!user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = CheckInSchema.parse(req.body);
    const userId = String(user.userId).trim();
    const mood = validated.mood;
    const photoHash = String(validated.photoHash || validated.hash || '').trim() || `hash_${Date.now()}`;
    const photoThumb = String(validated.photoThumb || validated.thumb || '').trim();

    // Asset Optimization: Upload to CDN (best-effort; never block check-in persistence).
    let optimizedPhotoUrl: string | null = null;
    if (photoThumb) {
        try {
            optimizedPhotoUrl = await CloudinaryService.uploadImage(photoThumb);
        } catch (e) {
            logger.warn('metamorphosis.photo_upload_failed', e);
            optimizedPhotoUrl = null;
        }
    }

    const normalizedMood = normalizeMood(mood);

    // 1. Retrieve History from DB
    const previousEvents = await prisma.event.findMany({
        where: { stream_id: userId, type: 'MOOD_LOGGED' },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: { payload: true },
    }).catch(() => []);
    const recentMoods = previousEvents
        .map((event) => normalizeMood(String((event.payload as any)?.mood || '')))
        .filter(Boolean) as Mood[];

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

    // 3. Persist to DB
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
        photoThumb: (e.payload as any).photoThumb || (e.payload as any).thumb || (e.payload as any).image || null,
        photoHash: (e.payload as any).photoHash || (e.payload as any).hash || null,
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
