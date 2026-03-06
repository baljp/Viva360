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
import { AppError } from '../lib/AppError';
import { supabaseAdmin } from '../services/supabase.service';
import { AuthUser } from '../middleware/auth.middleware';
import type { AuthenticatedRequest } from '../types/request';

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

const isMissingMetamorphosisPersistenceError = (error: unknown): boolean => {
    const code = String((error as { code?: string })?.code || '').toUpperCase();
    if (code === 'P2021' || code === 'P2022') {
        return true;
    }

    const metaCode = String((error as { meta?: { code?: string } })?.meta?.code || '').toUpperCase();
    if (metaCode === '42P01' || metaCode === '42703') {
        return true;
    }

    const message = String((error as { message?: string })?.message || '').toLowerCase();
    return message.includes('events') || message.includes('metamorphosis_projections');
};

const buildDailyBlessingAction = (date: Date) => `DAILY_BLESSING_${date.toISOString().slice(0, 10)}`;

type BlessingFallbackResult =
    | { alreadyDone: true; lastCheckIn: Date | null }
    | { alreadyDone: false; user: Record<string, unknown>; reward: number; lastCheckIn: string };

type MetamorphosisEventPayload = {
    mood?: string;
    quote?: string;
    reflection?: string;
    photoThumb?: string;
    thumb?: string;
    image?: string;
    photoHash?: string;
    hash?: string;
};

const applyDailyBlessingFallback = async (userId: string, reward: number, requestId: string): Promise<BlessingFallbackResult> => {
    const now = new Date();
    const todayAction = buildDailyBlessingAction(now);
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayAction = buildDailyBlessingAction(yesterday);

    const receiptWhere = {
        entity_type_entity_id_action_actor_id: {
            entity_type: 'PROFILE',
            entity_id: userId,
            action: todayAction,
            actor_id: userId,
        },
    } as const;

    let hadYesterday = false;
    try {
        await prisma.interactionReceipt.create({
            data: {
                entity_type: 'PROFILE',
                entity_id: userId,
                action: todayAction,
                actor_id: userId,
                status: 'PENDING',
                request_id: requestId || null,
                payload: { reward, source: 'metamorphosis.checkin.fallback' },
            },
        });
        const yesterdayReceipt = await prisma.interactionReceipt.findUnique({
            where: {
                entity_type_entity_id_action_actor_id: {
                    entity_type: 'PROFILE',
                    entity_id: userId,
                    action: yesterdayAction,
                    actor_id: userId,
                },
            },
            select: { id: true },
        });
        hadYesterday = Boolean(yesterdayReceipt?.id);
    } catch (createError) {
        if (String((createError as { code?: string })?.code || '') === 'P2002') {
            const existing = await prisma.interactionReceipt.findUnique({
                where: receiptWhere,
                select: { created_at: true },
            });
            return { alreadyDone: true, lastCheckIn: existing?.created_at || null };
        }
        if (isMissingMetamorphosisPersistenceError(createError)) {
            throw new AppError(
                'Benção temporariamente indisponível. Tente novamente em instantes.',
                503,
                'METAMORPHOSIS_UNAVAILABLE',
            );
        }
        throw createError;
    }

    const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (currentProfileError || !currentProfile) {
        throw new AppError('Perfil não encontrado para receber benção.', 404, 'PROFILE_NOT_FOUND');
    }

    const nextStreak = hadYesterday
        ? Math.max(1, Number((currentProfile as { streak?: number }).streak || 0) + 1)
        : 1;
    const nextKarma = Number((currentProfile as { karma?: number }).karma || 0) + reward;

    const { data: updatedProfile, error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
            karma: nextKarma,
            streak: nextStreak,
        })
        .eq('id', userId)
        .select('*')
        .single();

    if (updateProfileError || !updatedProfile) {
        await prisma.interactionReceipt.update({
            where: receiptWhere,
            data: {
                status: 'ERROR',
                request_id: requestId || null,
                payload: { reward, reason: 'PROFILE_UPDATE_FAILED', source: 'metamorphosis.checkin.fallback' },
            },
        }).catch(() => null);
        throw new AppError('Não foi possível finalizar sua benção agora.', 503, 'CHECKIN_PROFILE_UPDATE_FAILED');
    }

    const checkInAt = now.toISOString();
    await prisma.interactionReceipt.update({
        where: receiptWhere,
        data: {
            status: 'DONE',
            request_id: requestId || null,
            next_step: 'NONE',
            payload: { reward, streak: nextStreak, source: 'metamorphosis.checkin.fallback' },
        },
    }).catch(() => null);

    return {
        alreadyDone: false,
        reward,
        lastCheckIn: checkInAt,
        user: {
            ...(updatedProfile as Record<string, unknown>),
            lastCheckIn: checkInAt,
        },
    };
};

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    const user = request.user;
    if (!user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = CheckInSchema.parse(req.body);
    const userId = String(user.userId).trim();
    const reward = Math.max(1, Math.min(1500, Number(validated.reward || 50)));
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
        .map((event) => normalizeMood(String((event.payload as MetamorphosisEventPayload | null)?.mood || '')))
        .filter(Boolean) as Mood[];

    // 2. Run Deterministic Engine
    const recommendation = DeterministicEngine.process(normalizedMood, recentMoods as Mood[]);

    // 3. Persist
    const entry = {
        id: Date.now().toString(),
        userId,
        timestamp: new Date().toISOString(),
        reward,
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
                    payload: entry
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
        } else if (isMissingMetamorphosisPersistenceError(error)) {
            logger.warn('metamorphosis.checkin.persistence_fallback', {
                userId,
                requestId: String(request.requestId || ''),
                errorCode: String((error as { code?: string })?.code || ''),
                message: String((error as { message?: string })?.message || ''),
            });

            const fallback = await applyDailyBlessingFallback(
                userId,
                reward,
                String(request.requestId || ''),
            );

            if (fallback.alreadyDone) {
                return res.status(409).json({
                    ok: true,
                    code: 'CHECKIN_ALREADY_DONE',
                    status: 'ALREADY_DONE',
                    reward: 0,
                    lastCheckIn: fallback.lastCheckIn,
                });
            }

            const successfulFallback = fallback as Exclude<BlessingFallbackResult, { alreadyDone: true }>;
            return res.json({
                ok: true,
                success: true,
                reward: successfulFallback.reward,
                lastCheckIn: successfulFallback.lastCheckIn,
                source: 'PROFILE_RECEIPT_FALLBACK',
                entry,
                user: successfulFallback.user,
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
        reward,
        entry,
        user: updatedProfile
    });
});

export const getEvolution = asyncHandler(async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    const userId = String(request.user?.userId || '').trim();
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

    const dbEntries = events.map(e => {
        const payload = (e.payload as MetamorphosisEventPayload | null) || {};
        return ({
        id: e.id,
        timestamp: e.created_at,
        mood: payload.mood,
        quote: payload.quote,
        reflection: payload.reflection,
        photoThumb: payload.photoThumb || payload.thumb || payload.image || null,
        photoHash: payload.photoHash || payload.hash || null,
    })});
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
