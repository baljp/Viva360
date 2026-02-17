import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';
import { asyncHandler } from '../middleware/async.middleware';

const MOCK_REVIEWS = [
    { id: 'r1', authorName: 'Julia S.', rating: 9.8, comment: 'Sessão transformadora! Energia incrível.', date: new Date(Date.now() - 2 * 86400000).toISOString(), targetName: 'Ana Luz', targetType: 'guardian' },
    { id: 'r2', authorName: 'Marcos P.', rating: 10.0, comment: 'O Santuário é um oásis. A sala é perfeita.', date: new Date(Date.now() - 5 * 86400000).toISOString(), targetName: 'Sala Cristal', targetType: 'space' },
    { id: 'r3', authorName: 'Fernanda L.', rating: 8.5, comment: 'Ótimo atendimento, mas houve um pequeno atraso.', date: new Date(Date.now() - 7 * 86400000).toISOString(), targetName: 'João Sol', targetType: 'guardian' },
];

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

    if (isMockMode()) {
        const filtered = type === 'all'
            ? MOCK_REVIEWS
            : MOCK_REVIEWS.filter(r => r.targetType === type);
        return res.json({
            reviews: filtered.slice(skip, skip + limit),
            total: filtered.length,
            page,
            limit,
            averageRating: filtered.length > 0
                ? +(filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1)
                : 0,
        });
    }

    // Query events of type REVIEW_SUBMITTED for this space
    const where: { type: string; payload: Record<string, unknown> } = {
        type: 'REVIEW_SUBMITTED',
        payload: { path: ['spaceId'], equals: spaceId },
    };
    if (type !== 'all') {
        where.payload = {
            ...where.payload,
            path: ['targetType'],
            equals: type,
        };
    }

    // For complex JSON filtering we use a raw approach
    const typeFilter = type !== 'all'
        ? `AND payload->>'targetType' = '${type === 'guardian' ? 'guardian' : 'space'}'`
        : '';

    const [countResult, events] = await Promise.all([
        prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM public.events WHERE type = 'REVIEW_SUBMITTED' AND payload->>'spaceId' = $1 ${typeFilter}`,
            spaceId
        ),
        prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
            `SELECT id, payload, created_at FROM public.events WHERE type = 'REVIEW_SUBMITTED' AND payload->>'spaceId' = $1 ${typeFilter} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            spaceId, limit, skip
        ),
    ]);

    const total = Number(countResult?.[0]?.count || 0);
    const reviews = events.map((e) => {
        const payload = (e as any).payload;
        const p = typeof payload === 'string' ? JSON.parse(payload) : payload;
        return {
            id: String((e as any).id || ''),
            authorName: p.authorName || 'Anônimo',
            rating: Number(p.rating || 0),
            comment: p.comment || '',
            date: (e as any).created_at,
            targetName: p.targetName || '',
            targetType: p.targetType || 'guardian',
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
 * Returns aggregate stats for reputation overview
 */
export const getReviewSummary = asyncHandler(async (req: Request, res: Response) => {
    const rawSpaceId = req.params.spaceId;
    const spaceId = rawSpaceId === 'me' ? String(req.user?.userId || '') : rawSpaceId;

    if (isMockMode()) {
        return res.json({
            averageRating: 9.7,
            totalReviews: MOCK_REVIEWS.length,
            recommendRate: 98,
            guardianAverage: 9.4,
        });
    }

    const events = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT payload FROM public.events WHERE type = 'REVIEW_SUBMITTED' AND payload->>'spaceId' = $1`,
        spaceId
    );

    const ratings = events.map((e) => {
        const payload = (e as any).payload;
        const p = typeof payload === 'string' ? JSON.parse(payload) : payload;
        return Number(p.rating || 0);
    }).filter((r: number) => r > 0);

    const totalReviews = ratings.length;
    const averageRating = totalReviews > 0
        ? +(ratings.reduce((s, r) => s + r, 0) / totalReviews).toFixed(1)
        : 0;
    const recommendRate = totalReviews > 0
        ? Math.round((ratings.filter(r => r >= 7).length / totalReviews) * 100)
        : 0;

    // Guardian-specific average
    const guardianEvents = events.filter((e: any) => {
        const p = typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload;
        return p.targetType === 'guardian';
    });
    const guardianRatings = guardianEvents.map((e: any) => {
        const p = typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload;
        return Number(p.rating || 0);
    }).filter((r: number) => r > 0);
    const guardianAverage = guardianRatings.length > 0
        ? +(guardianRatings.reduce((s, r) => s + r, 0) / guardianRatings.length).toFixed(1)
        : 0;

    return res.json({ averageRating, totalReviews, recommendRate, guardianAverage });
});
