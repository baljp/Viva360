import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import prisma from '../lib/prisma';
import register from '../lib/metrics';

export const getExecutiveMetrics = asyncHandler(async (req: Request, res: Response) => {
    const [totalUsers, dailyActive, totalEvents] = await Promise.all([
        prisma.profile.count(),
        prisma.profile.count({
            where: { created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
        prisma.calendarEvent.count().catch(() => 0),
    ]);

    let metrics: any = null;
    try { metrics = await register.getSingleMetric('http_request_duration_seconds'); } catch { /* metric may not exist */ }
    const capacityThreshold = 50000;
    const readinessScore = Math.min(100, Math.floor((totalUsers / capacityThreshold) * 100));

    const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);

    res.json({
        period: 'Last 24 Hours',
        business: {
            totalSeekers: totalUsers,
            dailyActiveUsers: dailyActive,
            growth: null,
            revenueSimulation: null,
        },
        technical: {
            uptime: dbOk ? 'healthy' : 'degraded',
            avgLatency: null,
            currentLoadRPS: null,
            errorRate: null,
        },
        readiness: {
            score: readinessScore,
            status: readinessScore > 80 ? 'Scaling Required' : readinessScore > 50 ? 'Scalable with Adjustments' : 'Healthy',
            nextCheckpoint: `${Math.ceil(totalUsers / 10000) * 10000 + 10000} Users`,
        },
    });
});
