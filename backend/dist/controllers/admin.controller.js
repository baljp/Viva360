"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemHealth = exports.getLgpdAudit = exports.getGlobalFinance = exports.getMarketplaceOffers = exports.getMetrics = exports.getSanctuaryMetrics = exports.getGuardianMetrics = exports.getSeekerMetrics = exports.blockUser = exports.listUsers = exports.getDashboard = void 0;
const audit_service_1 = require("../services/audit.service");
const async_middleware_1 = require("../middleware/async.middleware");
// 1. Overview
exports.getDashboard = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    await audit_service_1.AuditService.logAccess(req.body.adminId, 'dashboard', 'VIEW_DASHBOARD', 'SUCCESS');
    res.json({
        totalUsers: 15420,
        newUsersToday: 45,
        activeEvents: 12,
        revenueToday: 12500.50,
        scaling: {
            readiness: "78%",
            status: "Scalable with Adjustments",
            target: "50,000 Users"
        },
        alerts: [{ level: 'warn', msg: 'API Latency > 200ms' }]
    });
});
// 2. Users (Governance)
exports.listUsers = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    // Only basic data, NO sensitive info
    res.json([
        { id: 'u1', name: 'Alice', role: 'CLIENT', status: 'active', registered: '2025-01-01' },
        { id: 'u2', name: 'Bob', role: 'PROFESSIONAL', status: 'blocked', registered: '2025-02-15' }
    ]);
});
exports.blockUser = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.params.id;
    await audit_service_1.AuditService.logAccess(req.body.adminId, `user:${userId}`, 'BLOCK_USER', 'SUCCESS');
    res.json({ success: true, message: `User ${userId} blocked successfully.` });
});
// 3. Seekers (Metrics)
exports.getSeekerMetrics = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    res.json({ total: 12000, activeMonthly: 8500, avgSessions: 2.4 });
});
// 4. Guardians (Metrics)
exports.getGuardianMetrics = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    res.json({ total: 500, avgOccupancy: '85%', avgRating: 4.8 });
});
// 5. Sanctuaries (Metrics)
exports.getSanctuaryMetrics = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    res.json({ total: 50, eventsActive: 120, avgRevenue: 15000 });
});
exports.getMetrics = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    res.json({
        seekers: { total: 12000, activeMonthly: 8500, avgSessions: 2.4 },
        guardians: { total: 500, avgOccupancy: '85%', avgRating: 4.8 },
        sanctuaries: { total: 50, eventsActive: 120, avgRevenue: 15000 },
    });
});
// 6. Marketplace (Moderation)
exports.getMarketplaceOffers = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    res.json([
        { id: 'off1', title: 'Retiro Espiritual', status: 'pending_approval', seller: 'Santuário Luz' }
    ]);
});
// 7. Finance (Global)
exports.getGlobalFinance = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    res.json({
        totalRevenue: 5400000,
        churnRate: '1.2%',
        inadimplencia: '2.5%'
    });
});
// 8. Governance (LGPD)
exports.getLgpdAudit = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    // Returns logs of who accessed what data (Meta-data only)
    res.json([
        { actor: 'Dr. Silva', action: 'READ_RECORD', target: 'Patient X', timestamp: new Date().toISOString() }
    ]);
});
// 9. System
exports.getSystemHealth = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    res.json({
        cpu: '45%',
        memory: '60%',
        uptime: '99.99%',
        apiStatus: 'healthy'
    });
});
