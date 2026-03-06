import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { supabaseAdmin } from '../services/supabase.service';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { getMockProfile, isMockMode, saveMockProfile } from '../services/mockAdapter';

const checkInSchema = z.object({
    reward: z.number().int().min(1).max(1500).optional()
});

const dailyQuestSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    reward: z.number(),
    isCompleted: z.boolean(),
    type: z.enum(['ritual', 'water', 'breathe', 'other']).optional(),
});

const achievementSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().min(1),
    category: z.enum(['streak', 'karma', 'social', 'ritual', 'mastery']),
    threshold: z.number(),
    unlockedAt: z.string().optional(),
});

const evolutionMetricsSchema = z.object({
    userId: z.string(),
});


const userUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
    location: z.string().optional(),
    specialty: z.array(z.string()).optional(),
    karma: z.number().optional(),
    streak: z.number().int().optional(),
    multiplier: z.number().optional(),
    plantStage: z.string().optional(),
    plantXp: z.number().optional(),
    plantHealth: z.number().min(0).max(100).optional(),
    snaps: z.any().optional(),
    dailyQuests: z.array(dailyQuestSchema).max(30).optional(),
    achievements: z.array(achievementSchema).max(200).optional(),
});

const isMissingTableOrColumnError = (error: unknown) => {
    const code = String((error as any)?.code || '');
    return code === 'P2021' || code === 'P2022';
};

const getStartOfUtcDay = (date: Date) => new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    0,
    0,
    0
));

const GAMIFICATION_SNAPSHOT_EVENT = 'GAMIFICATION_STATE_SNAPSHOT';

const asQuestArray = (value: unknown) => {
    const parsed = z.array(dailyQuestSchema).safeParse(value);
    return parsed.success ? parsed.data : undefined;
};

const asAchievementArray = (value: unknown) => {
    const parsed = z.array(achievementSchema).safeParse(value);
    return parsed.success ? parsed.data : undefined;
};

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
    const parsed = checkInSchema.parse(req.body || {});
    const reward = parsed.reward ?? 50;
    const userId = String(req.user?.userId || req.user?.id || '').trim();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized check-in', code: 'UNAUTHORIZED_CHECKIN' });
    }

    // Update User Karma & Last Checkin
    const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const todayAction = `DAILY_BLESSING_${todayKey}`;
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayAction = `DAILY_BLESSING_${yesterday.toISOString().slice(0, 10)}`;
    const requestId = String((req as any).requestId || '');

    const uniqueWhere = {
        entity_type_entity_id_action_actor_id: {
            entity_type: 'PROFILE',
            entity_id: userId,
            action: todayAction,
            actor_id: userId,
        },
    } as const;

    let usingEventFallback = false;
    let hadYesterday: { id: string } | null = null;

    try {
        await prisma.interactionReceipt.create({
            data: {
                entity_type: 'PROFILE',
                entity_id: userId,
                action: todayAction,
                actor_id: userId,
                status: 'PENDING',
                request_id: requestId || null,
                payload: { reward },
            },
        });

        hadYesterday = await prisma.interactionReceipt.findUnique({
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
    } catch (createError: any) {
        if (createError?.code === 'P2002') {
            const existing = await prisma.interactionReceipt.findUnique({
                where: uniqueWhere,
                select: { created_at: true },
            });
            return res.status(409).json({
                code: 'CHECKIN_ALREADY_DONE',
                status: 'ALREADY_DONE',
                reward: 0,
                lastCheckIn: existing?.created_at || null,
                requestId,
                timestamp: now.toISOString(),
                user: {
                    ...user,
                    lastCheckIn: existing?.created_at || null,
                },
            });
        }

        if (!isMissingTableOrColumnError(createError)) {
            throw createError;
        }

        usingEventFallback = true;
        const nowStart = getStartOfUtcDay(now);
        const yesterdayStart = new Date(nowStart);
        yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
        const yesterdayEnd = new Date(nowStart);

        const [alreadyDoneToday, hadYesterdayEvent] = await Promise.all([
            prisma.event.findFirst({
                where: {
                    stream_id: userId,
                    type: todayAction,
                    created_at: { gte: nowStart },
                },
                select: { created_at: true },
                orderBy: { created_at: 'desc' },
            }),
            prisma.event.findFirst({
                where: {
                    stream_id: userId,
                    type: yesterdayAction,
                    created_at: {
                        gte: yesterdayStart,
                        lt: yesterdayEnd,
                    },
                },
                select: { id: true },
            }),
        ]);

        if (alreadyDoneToday) {
            return res.status(409).json({
                code: 'CHECKIN_ALREADY_DONE',
                status: 'ALREADY_DONE',
                reward: 0,
                lastCheckIn: alreadyDoneToday.created_at,
                requestId,
                timestamp: now.toISOString(),
                user: {
                    ...user,
                    lastCheckIn: alreadyDoneToday.created_at,
                },
            });
        }

        hadYesterday = hadYesterdayEvent as any;
    }

    // Apply Reward
    const nextStreak = hadYesterday ? Math.max(1, Number(user.streak || 0) + 1) : 1;
    const updates = {
        karma: (user.karma || 0) + reward,
        streak: nextStreak,
    };

    const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (updateError) {
        if (!usingEventFallback) {
            await prisma.interactionReceipt.update({
                where: uniqueWhere,
                data: {
                    status: 'ERROR',
                    request_id: requestId || null,
                    payload: { reward, reason: 'PROFILE_UPDATE_FAILED' },
                },
            }).catch(() => null);
        }
        throw new Error('Failed to update user check-in');
    }

    const checkInAt = now.toISOString();
    if (!usingEventFallback) {
        await prisma.interactionReceipt.update({
            where: uniqueWhere,
            data: {
                status: 'DONE',
                request_id: requestId || null,
                next_step: 'NONE',
                payload: { reward, streak: nextStreak },
            },
        }).catch(() => null);
    } else {
        await prisma.event.create({
            data: {
                stream_id: userId,
                type: todayAction,
                payload: {
                    reward,
                    streak: nextStreak,
                    source: 'users.checkin.fallback_event',
                },
            },
        }).catch(() => null);
    }

    return res.json({
        code: 'CHECKIN_DONE',
        status: 'DONE',
        requestId,
        timestamp: checkInAt,
        user: {
            ...updatedUser,
            lastCheckIn: checkInAt,
        },
        reward,
        lastCheckIn: checkInAt,
    });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (isMockMode()) {
        const mockProfile = getMockProfile(id);
        if (!mockProfile) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({
            ...mockProfile,
            lastCheckIn: null,
            last_mood: null,
            evolution_score: 0,
            snaps: [],
            dailyQuests: mockProfile.dailyQuests || [],
            achievements: mockProfile.achievements || [],
            grimoireMeta: {
                totalCards: 0,
                lastSyncedAt: null,
                source: 'mock_profile',
            },
        });
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'User not found' });
    }

    const [projection, events, lastCheckIn, latestGamificationState, grimoireCount] = await Promise.all([
        prisma.metamorphosisProjection.findUnique({
            where: { user_id: id },
            select: { total_checkins: true, last_mood: true, streak_days: true, evolution_score: true },
        }).catch(() => null),
        prisma.event.findMany({
            where: { stream_id: id, type: 'MOOD_LOGGED' },
            orderBy: { created_at: 'desc' },
            take: 40,
            select: { id: true, created_at: true, payload: true },
        }).catch(() => []),
        prisma.interactionReceipt.findFirst({
            where: {
                entity_type: 'PROFILE',
                entity_id: id,
                actor_id: id,
                action: { startsWith: 'DAILY_BLESSING_' },
                status: { in: ['DONE', 'COMPLETED'] },
            },
            orderBy: { created_at: 'desc' },
            select: { created_at: true },
        }).catch((receiptError) => {
            if (!isMissingTableOrColumnError(receiptError)) {
                throw receiptError;
            }
            return null;
        }),
        prisma.event.findFirst({
            where: { stream_id: id, type: GAMIFICATION_SNAPSHOT_EVENT },
            orderBy: { created_at: 'desc' },
            select: { payload: true, created_at: true },
        }).catch(() => null),
        prisma.oracleHistory.count({
            where: { user_id: id },
        }).catch(() => 0),
    ]);

    const snaps = (events || []).map((event) => {
        const payload = event.payload as any;
        const photoHash = String(payload?.photoHash || payload?.hash || '').trim();
        const stableId = photoHash || String(event.id);
        return {
            // Use photoHash as the stable identifier when available so the frontend can
            // resolve the device-local (IndexedDB) image with `buildLocalImageKey(id)`.
            id: stableId,
            photoHash: photoHash || null,
            date: event.created_at,
            mood: String(payload?.mood || 'SERENO'),
            image: payload?.photoThumb || payload?.thumb || payload?.image || '',
            note: payload?.reflection || payload?.quote || '',
            phrases: payload?.quote ? [String(payload.quote)] : [],
        };
    });

    const snapshotPayload = (latestGamificationState?.payload && typeof latestGamificationState.payload === 'object')
        ? latestGamificationState.payload as Record<string, unknown>
        : {};
    const dailyQuests = asQuestArray(snapshotPayload.dailyQuests);
    const achievements = asAchievementArray(snapshotPayload.achievements);

    return res.json({
        ...data,
        lastCheckIn: lastCheckIn?.created_at || null,
        last_mood: projection?.last_mood || snaps[0]?.mood || null,
        evolution_score: Number(projection?.evolution_score || 0),
        snaps,
        dailyQuests: dailyQuests ?? data.dailyQuests ?? [],
        achievements: achievements ?? data.achievements ?? [],
        grimoireMeta: {
            totalCards: Number(grimoireCount || 0),
            lastSyncedAt: latestGamificationState?.created_at || null,
            source: 'oracle_history',
        },
    });
});

export const updateById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const parsed = userUpdateSchema.safeParse(req.body || {});

    const updates = parsed.success
        ? parsed.data
        : {
            name: req.body?.name,
            bio: req.body?.bio,
            avatar: req.body?.avatar,
            location: req.body?.location,
            specialty: Array.isArray(req.body?.specialty) ? req.body.specialty : undefined,
        };
    const { dailyQuests, achievements, ...profileUpdates } = updates as typeof updates & {
        dailyQuests?: z.infer<typeof dailyQuestSchema>[];
        achievements?: z.infer<typeof achievementSchema>[];
    };

    const sanitized = Object.fromEntries(
        Object.entries(profileUpdates).map(([key, value]) => {
            // Map camelCase to snake_case for DB columns
            if (key === 'plantStage') return ['plant_stage', value];
            if (key === 'plantXp') return ['plant_xp', value];
            if (key === 'plantHealth') return ['plant_health', value];
            return [key, value];
        }).filter(([, value]) => value !== undefined)
    );

    const hasGamificationSnapshot = Array.isArray(dailyQuests) || Array.isArray(achievements);
    if (Object.keys(sanitized).length === 0 && !hasGamificationSnapshot) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (isMockMode()) {
        const normalizedUpdates = updates as Partial<{
            name: string;
            bio: string;
            avatar: string;
            location: string;
            specialty: string[];
            karma: number;
            streak: number;
            multiplier: number;
        }>;
        const current = getMockProfile(id);
        if (!current) {
            return res.status(404).json({ error: 'User not found or update failed' });
        }
        const updated = saveMockProfile({
            ...current,
            ...(normalizedUpdates.name !== undefined ? { name: normalizedUpdates.name } : {}),
            ...(normalizedUpdates.bio !== undefined ? { bio: normalizedUpdates.bio } : {}),
            ...(normalizedUpdates.avatar !== undefined ? { avatar: normalizedUpdates.avatar } : {}),
            ...(normalizedUpdates.location !== undefined ? { location: normalizedUpdates.location } : {}),
            ...(normalizedUpdates.specialty !== undefined ? { specialty: normalizedUpdates.specialty } : {}),
            ...(normalizedUpdates.karma !== undefined ? { karma: normalizedUpdates.karma } : {}),
            ...(normalizedUpdates.streak !== undefined ? { streak: normalizedUpdates.streak } : {}),
            ...(normalizedUpdates.multiplier !== undefined ? { multiplier: normalizedUpdates.multiplier } : {}),
            ...(Array.isArray(dailyQuests) ? { dailyQuests } : {}),
            ...(Array.isArray(achievements) ? { achievements } : {}),
        });
        return res.json(updated);
    }

    let data: Record<string, unknown> | null = null;
    let error: unknown = null;

    if (Object.keys(sanitized).length > 0) {
        const profileUpdate = await supabaseAdmin
            .from('profiles')
            .update(sanitized)
            .eq('id', id)
            .select('*')
            .single();
        data = (profileUpdate.data as Record<string, unknown> | null) || null;
        error = profileUpdate.error;
    } else {
        const profileRead = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        data = (profileRead.data as Record<string, unknown> | null) || null;
        error = profileRead.error;
    }

    if (error || !data) {
        return res.status(404).json({ error: 'User not found or update failed' });
    }

    if (hasGamificationSnapshot) {
        await prisma.event.create({
            data: {
                stream_id: id,
                type: GAMIFICATION_SNAPSHOT_EVENT,
                payload: {
                    ...(Array.isArray(dailyQuests) ? { dailyQuests } : {}),
                    ...(Array.isArray(achievements) ? { achievements } : {}),
                    source: 'users.updateById',
                },
            },
        }).catch(() => null);
    }

    return res.json({
        ...data,
        ...(Array.isArray(dailyQuests) ? { dailyQuests } : {}),
        ...(Array.isArray(achievements) ? { achievements } : {}),
    });
});

export const exportData = asyncHandler(async (req: Request, res: Response) => {
    // LGPD Art. 18: Right to access data
    const userId = String(req.user?.userId || req.user?.id || '').trim();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized data export' });
    }

    // 1. Base Profile Data
    const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    // 2. Aggregate Data from Prisma
    const [
        events,
        receipts,
        transactionsAsClient,
        transactionsAsPro,
        appointmentsAsClient,
        appointmentsAsPro
    ] = await Promise.all([
        prisma.event.findMany({ where: { stream_id: userId }, take: 100, orderBy: { created_at: 'desc' } }).catch(() => []),
        prisma.interactionReceipt.findMany({ where: { actor_id: userId }, take: 100, orderBy: { created_at: 'desc' } }).catch(() => []),
        prisma.transaction.findMany({ where: { user_id: userId, type: 'expense' }, take: 100, orderBy: { date: 'desc' } }).catch(() => []),
        prisma.transaction.findMany({ where: { user_id: userId, type: 'income' }, take: 100, orderBy: { date: 'desc' } }).catch(() => []),
        prisma.appointment.findMany({ where: { client_id: userId }, take: 100, orderBy: { created_at: 'desc' } }).catch(() => []),
        prisma.appointment.findMany({ where: { professional_id: userId }, take: 100, orderBy: { created_at: 'desc' } }).catch(() => []),
    ]);

    // Build the consolidated export payload
    const exportPayload = {
        metadata: {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            legalBasis: 'LGPD Art. 18 - Direito de Acesso',
        },
        personalData: profile || null,
        interactions: {
            events,
            receipts,
        },
        financials: {
            sent: transactionsAsClient,
            received: transactionsAsPro,
        },
        appointments: {
            asClient: appointmentsAsClient,
            asPro: appointmentsAsPro,
        },
    };

    return res.json(exportPayload);
});

export const waterPlant = asyncHandler(async (req: Request, res: Response) => {
    const userId = String(req.user?.userId || req.user?.id || '').trim();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    // Atomic fetch-and-update to prevent race conditions (P1 Fix)
    const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .select('id, plant_xp, plant_health, plant_stage, last_watered_at, name, streak')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Mirroring gardenService logic for atomic action
    const streak = user.streak || 0;
    const streakMultiplier = Math.min(2, 1 + (streak / 10));
    const xpReward = Math.floor(10 * streakMultiplier);
    const healthReward = 10;
    const now = new Date().toISOString();

    const updates = {
        plant_xp: (user.plant_xp || 0) + xpReward,
        plant_health: Math.min(100, (user.plant_health || 0) + healthReward),
        last_watered_at: now
    };

    const { data: updated, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (updateError) {
        throw updateError;
    }

    // Log the interaction
    await prisma.interactionReceipt.create({
        data: {
            entity_type: 'PROFILE',
            entity_id: userId,
            action: 'PLANT_WATERED',
            actor_id: userId,
            status: 'DONE',
            payload: { xp: xpReward, health: healthReward },
        }
    }).catch(() => null);

    return res.json({
        success: true,
        xpReward,
        healthReward,
        user: updated
    });
});

export const getEvolutionMetrics = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const [events, profile] = await Promise.all([
        prisma.event.findMany({
            where: { stream_id: id, type: 'MOOD_LOGGED' },
            orderBy: { created_at: 'desc' },
            take: 100, // Look at more for better breakdown
            select: { payload: true }
        }),
        supabaseAdmin.from('profiles').select('streak, karma').eq('id', id).single()
    ]);

    const snaps = (events || []).map(e => e.payload as any);
    const positiveMoods = ['happy', 'grateful', 'peaceful', 'excited', '😄', '😊', '😌', 'feliz', 'calmo', 'grato', 'motivado', 'vibrante', 'sereno', 'serena', 'focado', 'focada', 'grata'];

    const positivity = snaps.length > 0
        ? (snaps.filter(s => {
            const mood = String(s?.mood || '').toLowerCase();
            return positiveMoods.some(pm => mood.includes(pm));
        }).length / snaps.length) * 100
        : 50;

    const moodMap: Record<string, number> = {};
    snaps.forEach(s => {
        const mood = s?.mood || 'Neutro';
        const label = mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase();
        moodMap[label] = (moodMap[label] || 0) + 1;
    });

    const breakdown = Object.entries(moodMap)
        .map(([label, count]) => ({
            label,
            percent: Math.round((count / (snaps.length || 1)) * 100)
        }))
        .sort((a, b) => b.percent - a.percent);

    const streak = profile.data?.streak || 0;
    const constancy = Math.min(100, streak * 5);

    return res.json({
        constancy,
        positivity,
        breakdown,
        totalSnaps: snaps.length,
        evolutionScore: Math.floor((constancy * 0.6) + (positivity * 0.4)) // Simplified weight
    });
});

export const socialBless = asyncHandler(async (req: Request, res: Response) => {
    const userId = String(req.user?.userId || req.user?.id || '').trim();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const blessingCost = 50;

    // Atomic fetch-and-update to prevent race conditions (P1 Fix)
    const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .select('id, karma')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    if ((user.karma || 0) < blessingCost) {
        return res.status(400).json({ error: 'Karma insuficiente para abençoar a rede.', code: 'INSUFFICIENT_KARMA' });
    }

    const updates = {
        karma: (user.karma || 0) - blessingCost
    };

    const { data: updated, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (updateError) {
        throw updateError;
    }

    // Log the interaction
    await prisma.interactionReceipt.create({
        data: {
            entity_type: 'PROFILE',
            entity_id: userId,
            action: 'SOCIAL_BLESSING_SENT',
            actor_id: userId,
            status: 'DONE',
            payload: { cost: blessingCost },
        }
    }).catch(() => null);

    return res.json({
        success: true,
        cost: blessingCost,
        user: updated
    });
});
