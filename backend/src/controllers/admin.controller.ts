import { Request, Response } from 'express';
import { isMockMode } from '../services/supabase.service';
import { AuditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/async.middleware';

// 1. Overview
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
    await AuditService.logAccess(req.body.adminId, 'dashboard', 'VIEW_DASHBOARD', 'SUCCESS');
    res.json({
        totalUsers: 15420,
        newUsersToday: 45,
        activeEvents: 12,
        revenueToday: 12500.50,
        alerts: [{ level: 'warn', msg: 'API Latency > 200ms' }]
    });
});

// 2. Users (Governance)
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
    // Only basic data, NO sensitive info
    res.json([
        { id: 'u1', name: 'Alice', role: 'CLIENT', status: 'active', registered: '2025-01-01' },
        { id: 'u2', name: 'Bob', role: 'PROFESSIONAL', status: 'blocked', registered: '2025-02-15' }
    ]);
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    await AuditService.logAccess(req.body.adminId, `user:${userId}`, 'BLOCK_USER', 'SUCCESS');
    res.json({ success: true, message: `User ${userId} blocked successfully.` });
});

// 3. Seekers (Metrics)
export const getSeekerMetrics = asyncHandler(async (req: Request, res: Response) => {
    res.json({ total: 12000, activeMonthly: 8500, avgSessions: 2.4 });
});

// 4. Guardians (Metrics)
export const getGuardianMetrics = asyncHandler(async (req: Request, res: Response) => {
    res.json({ total: 500, avgOccupancy: '85%', avgRating: 4.8 });
});

// 5. Sanctuaries (Metrics)
export const getSanctuaryMetrics = asyncHandler(async (req: Request, res: Response) => {
    res.json({ total: 50, eventsActive: 120, avgRevenue: 15000 });
});

// 6. Marketplace (Moderation)
export const getMarketplaceOffers = asyncHandler(async (req: Request, res: Response) => {
    res.json([
        { id: 'off1', title: 'Retiro Espiritual', status: 'pending_approval', seller: 'Santuário Luz' }
    ]);
});

// 7. Finance (Global)
export const getGlobalFinance = asyncHandler(async (req: Request, res: Response) => {
    res.json({
        totalRevenue: 5400000,
        churnRate: '1.2%',
        inadimplencia: '2.5%'
    });
});

// 8. Governance (LGPD)
export const getLgpdAudit = asyncHandler(async (req: Request, res: Response) => {
    // Returns logs of who accessed what data (Meta-data only)
    res.json([
        { actor: 'Dr. Silva', action: 'READ_RECORD', target: 'Patient X', timestamp: new Date().toISOString() }
    ]);
});

// 9. System
export const getSystemHealth = asyncHandler(async (req: Request, res: Response) => {
    res.json({
        cpu: '45%',
        memory: '60%',
        uptime: '99.99%',
        apiStatus: 'healthy'
    });
});
