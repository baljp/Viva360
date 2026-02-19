import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/async.middleware';
import { logger } from '../lib/logger';

// 1. Overview — real counts from DB
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const adminId = (req as any).user?.userId || req.body.adminId;
    await AuditService.logAccess(adminId, 'dashboard', 'VIEW_DASHBOARD', 'SUCCESS');

    const [totalUsers, newUsersToday, activeEvents] = await Promise.all([
        prisma.profile.count(),
        prisma.profile.count({
            where: { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        }),
        prisma.calendarEvent.count().catch(() => 0),
    ]);

    res.json({
        totalUsers,
        newUsersToday,
        activeEvents,
        revenueToday: null, // TODO: aggregate from Transaction table when finance is wired
        alerts: [],
    });
});

// 2. Users (Governance)
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.profile.findMany({
        select: { id: true, name: true, role: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 100,
    });
    res.json(users.map(u => ({
        id: u.id,
        name: u.name || 'Sem nome',
        role: u.role || 'CLIENT',
        status: 'active',
        registered: u.created_at?.toISOString() || null,
    })));
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const adminId = (req as any).user?.userId || req.body.adminId;
    // TODO: Add a "blocked" column to Profile when user management is fully implemented
    await AuditService.logAccess(adminId, `user:${userId}`, 'BLOCK_USER', 'SUCCESS');
    logger.warn('blockUser called but no blocked column exists yet', { adminId, targetUserId: userId });
    res.json({ success: true, message: `User ${userId} block logged (pending full implementation).` });
});

// 3-5. Metrics — real aggregates
export const getSeekerMetrics = asyncHandler(async (req: Request, res: Response) => {
    const total = await prisma.profile.count({ where: { role: 'CLIENT' } });
    res.json({ total, activeMonthly: null, avgSessions: null });
});

export const getGuardianMetrics = asyncHandler(async (req: Request, res: Response) => {
    const total = await prisma.profile.count({ where: { role: 'PROFESSIONAL' } });
    const avgRating = await prisma.profile.aggregate({
        where: { role: 'PROFESSIONAL' },
        _avg: { rating: true },
    });
    res.json({ total, avgOccupancy: null, avgRating: Number(avgRating._avg.rating || 0).toFixed(1) });
});

export const getSanctuaryMetrics = asyncHandler(async (req: Request, res: Response) => {
    const total = await prisma.profile.count({ where: { role: 'SPACE' } });
    const eventsActive = await prisma.calendarEvent.count().catch(() => 0);
    res.json({ total, eventsActive, avgRevenue: null });
});

export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const [clients, pros, spaces, events] = await Promise.all([
        prisma.profile.count({ where: { role: 'CLIENT' } }),
        prisma.profile.count({ where: { role: 'PROFESSIONAL' } }),
        prisma.profile.count({ where: { role: 'SPACE' } }),
        prisma.calendarEvent.count().catch(() => 0),
    ]);
    res.json({
        seekers: { total: clients, activeMonthly: null, avgSessions: null },
        guardians: { total: pros, avgOccupancy: null, avgRating: null },
        sanctuaries: { total: spaces, eventsActive: events, avgRevenue: null },
    });
});


// 6. Marketplace (Moderation) — real pending offers
export const getMarketplaceOffers = asyncHandler(async (req: Request, res: Response) => {
    const offers = await prisma.product.findMany({
        select: { id: true, name: true, owner_id: true },
        take: 50,
        orderBy: { created_at: 'desc' },
    }).catch(() => []);
    res.json(offers);
});

// 7. Finance (Global) — real aggregates
export const getGlobalFinance = asyncHandler(async (req: Request, res: Response) => {
    const totalRevenue = await prisma.transaction.aggregate({
        _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: null } }));
    res.json({
        totalRevenue: Number(totalRevenue._sum?.amount || 0),
        churnRate: null,
        inadimplencia: null,
    });
});

// 8. Governance (LGPD) — real audit trail
export const getLgpdAudit = asyncHandler(async (req: Request, res: Response) => {
    const events = await prisma.auditEvent.findMany({
        orderBy: { created_at: 'desc' },
        take: 50,
        select: { actor_id: true, action: true, entity_type: true, created_at: true },
    }).catch(() => []);
    res.json(events.map(e => ({
        actor: e.actor_id,
        action: e.action,
        target: e.entity_type,
        timestamp: e.created_at?.toISOString(),
    })));
});

// 9. System
export const getSystemHealth = asyncHandler(async (_req: Request, res: Response) => {
    const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    res.json({
        database: dbOk ? 'healthy' : 'degraded',
        apiStatus: 'healthy',
        uptime: process.uptime(),
    });
});
