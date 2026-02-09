import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { supabaseAdmin } from '../services/supabase.service';
import { z } from 'zod';
import prisma from '../lib/prisma';

const checkInSchema = z.object({
  reward: z.number().int().min(1).max(500).optional()
});

const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  location: z.string().optional(),
  specialty: z.array(z.string()).optional(),
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
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'User not found' });
    }

    const [projection, events, lastCheckIn] = await Promise.all([
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
    ]);

    const snaps = (events || []).map((event) => {
        const payload = event.payload as any;
        return {
            id: String(event.id),
            date: event.created_at,
            mood: String(payload?.mood || 'SERENO'),
            image: payload?.photoThumb || payload?.thumb || payload?.image || '',
            note: payload?.reflection || payload?.quote || '',
            phrases: payload?.quote ? [String(payload.quote)] : [],
        };
    });

    return res.json({
        ...data,
        lastCheckIn: lastCheckIn?.created_at || null,
        last_mood: projection?.last_mood || snaps[0]?.mood || null,
        evolution_score: Number(projection?.evolution_score || 0),
        snaps,
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

    const sanitized = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(sanitized).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(sanitized)
        .eq('id', id)
        .select('*')
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'User not found or update failed' });
    }

    return res.json(data);
});
