"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemHealth = exports.getLgpdAudit = exports.getGlobalFinance = exports.getMarketplaceOffers = exports.getSanctuaryMetrics = exports.getGuardianMetrics = exports.getSeekerMetrics = exports.blockUser = exports.listUsers = exports.getDashboard = void 0;
const audit_service_1 = require("../services/audit.service");
// 1. Overview
const getDashboard = async (req, res) => {
    await audit_service_1.AuditService.logAccess(req.body.adminId, 'dashboard', 'VIEW_DASHBOARD', 'SUCCESS');
    res.json({
        totalUsers: 15420,
        newUsersToday: 45,
        activeEvents: 12,
        revenueToday: 12500.50,
        alerts: [{ level: 'warn', msg: 'API Latency > 200ms' }]
    });
};
exports.getDashboard = getDashboard;
// 2. Users (Governance)
const listUsers = async (req, res) => {
    // Only basic data, NO sensitive info
    res.json([
        { id: 'u1', name: 'Alice', role: 'CLIENT', status: 'active', registered: '2025-01-01' },
        { id: 'u2', name: 'Bob', role: 'PROFESSIONAL', status: 'blocked', registered: '2025-02-15' }
    ]);
};
exports.listUsers = listUsers;
const blockUser = async (req, res) => {
    const { userId } = req.params;
    await audit_service_1.AuditService.logAccess(req.body.adminId, `user:${userId}`, 'BLOCK_USER', 'SUCCESS');
    res.json({ success: true, message: `User ${userId} blocked successfully.` });
};
exports.blockUser = blockUser;
// 3. Seekers (Metrics)
const getSeekerMetrics = async (req, res) => {
    res.json({ total: 12000, activeMonthly: 8500, avgSessions: 2.4 });
};
exports.getSeekerMetrics = getSeekerMetrics;
// 4. Guardians (Metrics)
const getGuardianMetrics = async (req, res) => {
    res.json({ total: 500, avgOccupancy: '85%', avgRating: 4.8 });
};
exports.getGuardianMetrics = getGuardianMetrics;
// 5. Sanctuaries (Metrics)
const getSanctuaryMetrics = async (req, res) => {
    res.json({ total: 50, eventsActive: 120, avgRevenue: 15000 });
};
exports.getSanctuaryMetrics = getSanctuaryMetrics;
// 6. Marketplace (Moderation)
const getMarketplaceOffers = async (req, res) => {
    res.json([
        { id: 'off1', title: 'Retiro Espiritual', status: 'pending_approval', seller: 'Santuário Luz' }
    ]);
};
exports.getMarketplaceOffers = getMarketplaceOffers;
// 7. Finance (Global)
const getGlobalFinance = async (req, res) => {
    res.json({
        totalRevenue: 5400000,
        churnRate: '1.2%',
        inadimplencia: '2.5%'
    });
};
exports.getGlobalFinance = getGlobalFinance;
// 8. Governance (LGPD)
const getLgpdAudit = async (req, res) => {
    // Returns logs of who accessed what data (Meta-data only)
    res.json([
        { actor: 'Dr. Silva', action: 'READ_RECORD', target: 'Patient X', timestamp: new Date().toISOString() }
    ]);
};
exports.getLgpdAudit = getLgpdAudit;
// 9. System
const getSystemHealth = async (req, res) => {
    res.json({
        cpu: '45%',
        memory: '60%',
        uptime: '99.99%',
        apiStatus: 'healthy'
    });
};
exports.getSystemHealth = getSystemHealth;
