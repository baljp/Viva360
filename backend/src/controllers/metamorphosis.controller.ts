import { Request, Response } from 'express';
import { DeterministicEngine, Mood } from '../lib/determinism';
import { logsQueue } from '../lib/queue';
import prisma from '../lib/prisma';
import { CloudinaryService } from '../services/cloudinary.service';
import { asyncHandler } from '../middleware/async.middleware';
import { logger } from '../lib/logger';
import { CheckInSchema } from '../schemas/metamorphosis.schema';
import { isMockMode } from '../lib/appMode';
import { isDbUnavailableError } from '../lib/dbReadFallback';
import { listMockMetamorphosisEntries, saveMockMetamorphosisEntry } from '../services/mockAdapter';

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

    // 3. Persist to DB (or mock store when DB is unavailable in mock/test mode)
    try {
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
    } catch (error) {
        if (isMockMode() && isDbUnavailableError(error)) {
            saveMockMetamorphosisEntry({
                id: String(entry.id),
                userId,
                timestamp: String(entry.timestamp),
                mood: String(entry.mood),
                photoHash: String(entry.photoHash || ''),
                photoThumb: entry.photoThumb ? String(entry.photoThumb) : null,
                quote: recommendation.quote ? String(recommendation.quote) : null,
            });
        } else {
            throw error;
        }
    }

    // ASYNC
    logsQueue.add('emotional_log', entry).catch((err: unknown) => logger.warn('queue.logs_add_failed', err));

    // 4. Fetch updated profile for the frontend
    const updatedProfile = await prisma.profile.findUnique({
        where: { id: userId }
    }).catch((error) => {
        if (isMockMode() && isDbUnavailableError(error)) {
            return {
                id: userId,
                karma: null,
            };
        }
        throw error;
    });

    return res.json({
        ok: true,
        success: true,
        entry,
        user: updatedProfile
    });
});

export const getEvolution = asyncHandler(async (req: Request, res: Response) => {
    const userId = String((req as any).user?.userId || '').trim();
    const { days } = req.query;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let projection: { total_checkins?: number | null; last_mood?: string | null; streak_days?: number | null; evolution_score?: number | null } | null = null;
    let events: Array<{ id: string; created_at: Date; payload: unknown }> = [];
    let usedMockFallback = false;

    try {
        [projection, events] = await Promise.all([
            prisma.metamorphosisProjection.findUnique({
                where: { user_id: userId }
            }),
            prisma.event.findMany({
                where: { stream_id: userId, type: 'MOOD_LOGGED' },
                orderBy: { created_at: 'desc' },
                take: 20
            })
        ]);
    } catch (error) {
        if (isMockMode() && isDbUnavailableError(error)) {
            usedMockFallback = true;
        } else {
            throw error;
        }
    }

    const mockEntries = usedMockFallback ? listMockMetamorphosisEntries(userId) : [];

    if (!projection && events.length === 0 && mockEntries.length === 0) {
        return res.json({
            entries: [],
            totalEntries: 0,
            evolutionScore: 0,
            note: "No projection found yet (async processing)"
        });
    }

    const dbEntries = events.map(e => ({
        id: e.id,
        timestamp: e.created_at,
        mood: (e.payload as any).mood,
        quote: (e.payload as any).quote,
        reflection: (e.payload as any).reflection,
        photoThumb: (e.payload as any).photoThumb || (e.payload as any).thumb || (e.payload as any).image || null,
        photoHash: (e.payload as any).photoHash || (e.payload as any).hash || null,
    }));
    const fallbackEntries = mockEntries.map((entry) => ({
        id: entry.id,
        timestamp: entry.timestamp,
        mood: entry.mood,
        quote: entry.quote || null,
        reflection: entry.reflection || null,
        photoThumb: entry.photoThumb || null,
        photoHash: entry.photoHash || null,
    }));
    const entries = usedMockFallback ? fallbackEntries : dbEntries;

    return res.json({
        entries,
        totalEntries: projection?.total_checkins || entries.length,
        lastMood: projection?.last_mood || entries[0]?.mood,
        streak: projection?.streak_days || 1,
        evolutionScore: projection?.evolution_score || 0,
        readFrom: 'DB (Events + Projection)'
    });
});
