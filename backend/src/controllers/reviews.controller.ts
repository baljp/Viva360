import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { logger } from '../lib/logger';
import { isMockMode } from '../services/supabase.service';
import { mockAdapter } from '../services/mockAdapter';

const parseEventPayload = (payload: unknown): Record<string, unknown> => {
    if (typeof payload === 'string') {
        try {
            const parsed = JSON.parse(payload);
            return (parsed && typeof parsed === 'object') ? (parsed as Record<string, unknown>) : {};
        } catch {
            return {};
        }
    }
    return (payload && typeof payload === 'object') ? (payload as Record<string, unknown>) : {};
};

/**
 * GET /reviews/:spaceId
 * Returns reviews for a space (from events store).
 * Query params: ?type=guardian|space&page=1&limit=10
 */
export const getReviews = asyncHandler(async (req: Request, res: Response) => {
    const rawSpaceId = req.params.spaceId;
    const spaceId = rawSpaceId === 'me' ? String(req.user?.userId || '') : rawSpaceId;
    const type = String(req.query.type || 'all').toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const targetType = type !== 'all' ? (type === 'guardian' ? 'guardian' : 'space') : 'all';

    if (isMockMode()) {
        const allReviews = mockAdapter.reviews.listBySpace(spaceId, targetType);
        const paged = allReviews.slice(skip, skip + limit);
        const reviews = paged.map((review) => ({
            id: review.id,
            authorName: review.authorName,
            rating: review.rating,
            comment: review.comment,
            date: review.createdAt,
            targetName: review.targetName || '',
            targetType: review.targetType || 'guardian',
        }));
        const ratings = allReviews.map((r) => r.rating).filter((r) => r > 0);
        const averageRating = ratings.length > 0
            ? +(ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
            : 0;
        return res.json({ reviews, total: allReviews.length, page, limit, averageRating });
    }

    const [countResult, events] = await Promise.all([
        prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM public.events WHERE type = 'REVIEW_SUBMITTED' AND payload->>'spaceId' = $1 AND ($2 = 'all' OR payload->>'targetType' = $2)`,
            spaceId, targetType
        ),
        prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
            `SELECT id, payload, created_at FROM public.events WHERE type = 'REVIEW_SUBMITTED' AND payload->>'spaceId' = $1 AND ($2 = 'all' OR payload->>'targetType' = $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
            spaceId, targetType, limit, skip
        ),
    ]);

    const total = Number(countResult?.[0]?.count || 0);
    const reviews = events.map((e) => {
        const row = e as { id?: string | number; payload?: unknown; created_at?: string };
        const p = parseEventPayload(row.payload);
        return {
            id: String(row.id || ''),
            authorName: String(p.authorName || 'Anônimo'),
            rating: Number(p.rating || 0),
            comment: String(p.comment || ''),
            date: row.created_at,
            targetName: String(p.targetName || ''),
            targetType: String(p.targetType || 'guardian'),
        };
    });

    const ratings = reviews.map((r) => r.rating).filter((r: number) => r > 0);
    const averageRating = ratings.length > 0
        ? +(ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length).toFixed(1)
        : 0;

    return res.json({ reviews, total, page, limit, averageRating });
});

/**
 * GET /reviews/:spaceId/summary
 */
export const getReviewSummary = asyncHandler(async (req: Request, res: Response) => {
    const rawSpaceId = req.params.spaceId;
    const spaceId = rawSpaceId === 'me' ? String(req.user?.userId || '') : rawSpaceId;

    if (isMockMode()) {
        const events = mockAdapter.reviews.listBySpace(spaceId, 'all');
        const ratings = events.map((e) => e.rating).filter((r) => r > 0);
        const totalReviews = ratings.length;
        const averageRating = totalReviews > 0
            ? +(ratings.reduce((s, r) => s + r, 0) / totalReviews).toFixed(1)
            : 0;
        const recommendRate = totalReviews > 0
            ? Math.round((ratings.filter((r) => r >= 7).length / totalReviews) * 100)
            : 0;
        const guardianRatings = events.filter((e) => e.targetType === 'guardian').map((e) => e.rating).filter((r) => r > 0);
        const guardianAverage = guardianRatings.length > 0
            ? +(guardianRatings.reduce((s, r) => s + r, 0) / guardianRatings.length).toFixed(1)
            : 0;
        return res.json({ averageRating, totalReviews, recommendRate, guardianAverage });
    }

    const events = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT payload FROM public.events WHERE type = 'REVIEW_SUBMITTED' AND payload->>'spaceId' = $1`,
        spaceId
    );

    const ratings = events.map((e) => {
        const p = parseEventPayload((e as { payload?: unknown }).payload);
        return Number(p.rating || 0);
    }).filter((r: number) => r > 0);

    const totalReviews = ratings.length;
    const averageRating = totalReviews > 0
        ? +(ratings.reduce((s, r) => s + r, 0) / totalReviews).toFixed(1)
        : 0;
    const recommendRate = totalReviews > 0
        ? Math.round((ratings.filter(r => r >= 7).length / totalReviews) * 100)
        : 0;

    const guardianEvents = events.filter((e) => {
        const p = parseEventPayload((e as { payload?: unknown }).payload);
        return p.targetType === 'guardian';
    });
    const guardianRatings = guardianEvents.map((e) => {
        const p = parseEventPayload((e as { payload?: unknown }).payload);
        return Number(p.rating || 0);
    }).filter((r: number) => r > 0);
    const guardianAverage = guardianRatings.length > 0
        ? +(guardianRatings.reduce((s, r) => s + r, 0) / guardianRatings.length).toFixed(1)
        : 0;

    return res.json({ averageRating, totalReviews, recommendRate, guardianAverage });
});

/**
 * POST /reviews
 * Submit a new service review.
 * Body: { spaceId, targetType, targetName, authorName, rating, comment }
 */
export const createReview = asyncHandler(async (req: Request, res: Response) => {
    const userId = String(req.user?.userId || '').trim();
    const userEmail = String(req.user?.email || '').trim();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const spaceId = String(body.spaceId || '').trim();
    const targetId = String(body.targetId || '').trim();
    const targetType = String(body.targetType || (targetId ? 'guardian' : 'space')).trim().toLowerCase();
    const targetName = String(body.targetName || '').trim();
    const authorName = String(body.authorName || userEmail || 'Anônimo').trim();
    const comment = typeof body.comment === 'string' ? body.comment : '';
    const rawRating = Number(body.rating);

    if (!Number.isFinite(rawRating)) {
        return res.status(400).json({ error: 'rating inválido.', code: 'INVALID_RATING' });
    }
    if (rawRating < 0 || rawRating > 10) {
        return res.status(400).json({ error: 'rating deve estar entre 0 e 10.', code: 'INVALID_RATING_RANGE' });
    }
    if (!spaceId && !targetId) {
        return res.status(400).json({ error: 'targetId ou spaceId é obrigatório.', code: 'TARGET_REQUIRED' });
    }

    const numericRating = +rawRating.toFixed(1);
    const resolvedSpaceId = spaceId || String(body.space_id || '').trim() || 'mock-space';

    if (isMockMode()) {
        const created = mockAdapter.reviews.createReview({
            spaceId: resolvedSpaceId,
            targetId: targetId || null,
            targetType: targetType || 'guardian',
            targetName: targetName || '',
            authorName,
            rating: numericRating,
            comment,
        });
        logger.info('reviews.created.mock', { id: created.id, resolvedSpaceId, userId, rating: numericRating });
        return res.status(201).json(created);
    }

    const payload = {
        spaceId: resolvedSpaceId,
        userId,
        targetId: targetId || null,
        targetType: targetType || 'guardian',
        targetName: targetName || '',
        authorName,
        rating: numericRating,
        comment,
    };

    const created = await (prisma as any).event.create({
        data: {
            stream_id: userId,
            type: 'REVIEW_SUBMITTED',
            payload,
        },
    });

    logger.info('reviews.created', { spaceId: resolvedSpaceId, userId, rating: numericRating });
    return res.status(201).json({
        id: String((created as any)?.id || ''),
        ...payload,
    });
});
