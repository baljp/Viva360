"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const presence_service_1 = require("../services/presence.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Set status to ONLINE
router.post('/online', auth_middleware_1.authenticateUser, async (req, res) => {
    try {
        const presence = await presence_service_1.presenceService.goOnline(req.user.id);
        res.json(presence);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Set status to OFFLINE
router.post('/offline', auth_middleware_1.authenticateUser, async (req, res) => {
    try {
        const presence = await presence_service_1.presenceService.goOffline(req.user.id);
        res.json(presence);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Ping to extend session
router.post('/ping', auth_middleware_1.authenticateUser, async (req, res) => {
    try {
        const presence = await presence_service_1.presenceService.ping(req.user.id);
        res.json(presence);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Get current user's presence
router.get('/me', auth_middleware_1.authenticateUser, async (req, res) => {
    try {
        const status = await presence_service_1.presenceService.getStatus(req.user.id);
        res.json({ status });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Get presence for specific guardian
router.get('/:guardianId', async (req, res) => {
    try {
        const { guardianId } = req.params;
        const status = await presence_service_1.presenceService.getStatus(guardianId);
        res.json({ guardianId, status });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Get online guardians
router.get('/', async (req, res) => {
    try {
        const onlineIds = await presence_service_1.presenceService.getOnlineGuardians();
        res.json({ online: onlineIds });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Batch get presence
router.post('/batch', async (req, res) => {
    try {
        const { guardianIds } = req.body;
        if (!guardianIds || !Array.isArray(guardianIds)) {
            return res.status(400).json({ error: 'guardianIds array required' });
        }
        const statuses = await presence_service_1.presenceService.getStatusBatch(guardianIds);
        res.json(statuses);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
