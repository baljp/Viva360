import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/async.middleware';
import { logger } from '../lib/logger';
import { handleDbReadFallback } from '../lib/dbReadFallback';
import { mockAdapter } from '../services/mockAdapter';
import type { AuthenticatedRequest } from '../types/request';

const getAdminId = (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return String(authReq.user?.userId || authReq.user?.id || req.body.adminId || '').trim();
};

const getMockUsers = () => {
    const baseUsers = Array.from(mockAdapter.profiles.values()).map((profile) => ({
        id: profile.id,
        name: profile.name || 'Sem nome',
        role: profile.role || 'CLIENT',
        status: 'active',
        registered: new Date().toISOString(),
    }));

    return [
        ...baseUsers,
        {
            id: 'admin-mock',
            name: 'Admin Viva360',
            role: 'ADMIN',
            status: 'active',
            registered: new Date().toISOString(),
        },
    ];
};

const getMockDashboardPayload = () => {
    const users = getMockUsers();
    const financeValues = Array.from(mockAdapter.finance.transactions.values());

    return {
        totalUsers: users.length,
        newUsersToday: users.length,
        activeEvents: 0,
        revenueToday: financeValues.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
        alerts: [],
    };
};

const getMockMetricsPayload = () => {
    const users = getMockUsers();
    const clients = users.filter((user) => user.role === 'CLIENT').length;
    const pros = users.filter((user) => user.role === 'PROFESSIONAL').length;
    const spaces = users.filter((user) => user.role === 'SPACE').length;

    return {
        seekers: { total: clients, activeMonthly: null, avgSessions: null },
        guardians: { total: pros, avgOccupancy: null, avgRating: null },
        sanctuaries: { total: spaces, eventsActive: 0, avgRevenue: null },
    };
};

// 1. Overview — real counts from DB
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    await AuditService.logAccess(adminId, 'dashboard', 'VIEW_DASHBOARD', 'SUCCESS');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    try {
        const [totalUsers, newUsersToday, activeEvents, revenueTodayAgg] = await Promise.all([
            prisma.profile.count(),
            prisma.profile.count({
                where: { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
            }),
            prisma.calendarEvent.count().catch(() => 0),
            prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { date: { gte: startOfDay } },
            }).catch(() => ({ _sum: { amount: null } })),
        ]);

        return res.json({
            totalUsers,
            newUsersToday,
            activeEvents,
            revenueToday: Number(revenueTodayAgg._sum?.amount || 0),
            alerts: [],
        });
    } catch (err) {
        if (handleDbReadFallback(res, err, {
            route: 'admin.dashboard',
            userId: adminId,
            fallbackPayload: getMockDashboardPayload(),
        })) return;
        throw err;
    }
});

// 2. Users (Governance)
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
    try {
        const users = await prisma.profile.findMany({
            select: { id: true, name: true, role: true, created_at: true },
            orderBy: { created_at: 'desc' },
            take: 100,
        });
        return res.json(users.map(u => ({
            id: u.id,
            name: u.name || 'Sem nome',
            role: u.role || 'CLIENT',
            status: 'active',
            registered: u.created_at?.toISOString() || null,
        })));
    } catch (err) {
        if (handleDbReadFallback(res, err, {
            route: 'admin.users.list',
            userId: getAdminId(req),
            fallbackPayload: getMockUsers(),
        })) return;
        throw err;
    }
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const adminId = getAdminId(req);
    // TODO: Add a "blocked" column to Profile when user management is fully implemented
    await AuditService.logAccess(adminId, `user:${userId}`, 'BLOCK_USER', 'SUCCESS');
    logger.warn('blockUser called but no blocked column exists yet', { adminId, targetUserId: userId });
    res.json({ success: true, message: `User ${userId} block logged (pending full implementation).` });
});

// 3-5. Metrics — real aggregates
export const getSeekerMetrics = asyncHandler(async (req: Request, res: Response) => {
    try {
        const total = await prisma.profile.count({ where: { role: 'CLIENT' } });
        return res.json({ total, activeMonthly: null, avgSessions: null });
    } catch (err) {
        if (handleDbReadFallback(res, err, {
            route: 'admin.metrics.seekers',
            userId: getAdminId(req),
            fallbackPayload: getMockMetricsPayload().seekers,
        })) return;
        throw err;
    }
});

export const getGuardianMetrics = asyncHandler(async (req: Request, res: Response) => {
    try {
        const total = await prisma.profile.count({ where: { role: 'PROFESSIONAL' } });
        const avgRating = await prisma.profile.aggregate({
            where: { role: 'PROFESSIONAL' },
            _avg: { rating: true },
        });
        return res.json({ total, avgOccupancy: null, avgRating: Number(avgRating._avg.rating || 0).toFixed(1) });
    } catch (err) {
        if (handleDbReadFallback(res, err, {
            route: 'admin.metrics.guardians',
            userId: getAdminId(req),
            fallbackPayload: getMockMetricsPayload().guardians,
        })) return;
        throw err;
    }
});

export const getSanctuaryMetrics = asyncHandler(async (req: Request, res: Response) => {
    try {
        const total = await prisma.profile.count({ where: { role: 'SPACE' } });
        const eventsActive = await prisma.calendarEvent.count().catch(() => 0);
        return res.json({ total, eventsActive, avgRevenue: null });
    } catch (err) {
        if (handleDbReadFallback(res, err, {
            route: 'admin.metrics.sanctuaries',
            userId: getAdminId(req),
            fallbackPayload: getMockMetricsPayload().sanctuaries,
        })) return;
        throw err;
    }
});

export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
    try {
        const [clients, pros, spaces, events] = await Promise.all([
            prisma.profile.count({ where: { role: 'CLIENT' } }),
            prisma.profile.count({ where: { role: 'PROFESSIONAL' } }),
            prisma.profile.count({ where: { role: 'SPACE' } }),
            prisma.calendarEvent.count().catch(() => 0),
        ]);
        return res.json({
            seekers: { total: clients, activeMonthly: null, avgSessions: null },
            guardians: { total: pros, avgOccupancy: null, avgRating: null },
            sanctuaries: { total: spaces, eventsActive: events, avgRevenue: null },
        });
    } catch (err) {
        if (handleDbReadFallback(res, err, {
            route: 'admin.metrics',
            userId: getAdminId(req),
            fallbackPayload: getMockMetricsPayload(),
        })) return;
        throw err;
    }
});


// 6. Marketplace (Moderation) — real pending offers
export const getMarketplaceOffers = asyncHandler(async (req: Request, res: Response) => {
    try {
        const offers = await prisma.product.findMany({
            select: { id: true, name: true, owner_id: true },
            take: 50,
            orderBy: { created_at: 'desc' },
        }).catch(() => []);
        return res.json(offers);
    } catch (err) {
        if (handleDbReadFallback(res, err, {
            route: 'admin.marketplace.offers',
            userId: getAdminId(req),
            fallbackPayload: Array.from(mockAdapter.marketplace.products.values()).slice(0, 50),
        })) return;
        throw err;
    }
});

// 7. Finance (Global) — real aggregates
export const getGlobalFinance = asyncHandler(async (req: Request, res: Response) => {
    try {
        const totalRevenue = await prisma.transaction.aggregate({
            _sum: { amount: true },
        }).catch(() => ({ _sum: { amount: null } }));
        return res.json({
            totalRevenue: Number(totalRevenue._sum?.amount || 0),
            churnRate: null,
            inadimplencia: null,
        });
    } catch (err) {
        if (handleDbReadFallback(res, err, {
            route: 'admin.finance.global',
            userId: getAdminId(req),
            fallbackPayload: {
                totalRevenue: Array.from(mockAdapter.finance.transactions.values()).reduce((sum, transaction) => {
                    return sum + Number(transaction.amount || 0);
                }, 0),
                churnRate: null,
                inadimplencia: null,
            },
        })) return;
        throw err;
    }
});

// 8. Governance (LGPD) — real audit trail
export const getLgpdAudit = asyncHandler(async (req: Request, res: Response) => {
    try {
        const events = await prisma.auditEvent.findMany({
            orderBy: { created_at: 'desc' },
            take: 50,
            select: { actor_id: true, action: true, entity_type: true, created_at: true },
        }).catch(() => []);
        return res.json(events.map(e => ({
            actor: e.actor_id,
            action: e.action,
            target: e.entity_type,
            timestamp: e.created_at?.toISOString(),
        })));
    } catch (err) {
        if (handleDbReadFallback(res, err, {
            route: 'admin.lgpd.audit',
            userId: getAdminId(req),
            fallbackPayload: [],
        })) return;
        throw err;
    }
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
