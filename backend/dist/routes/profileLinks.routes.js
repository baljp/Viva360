"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileLink_service_1 = require("../services/profileLink.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Create a link request
router.post('/', auth_middleware_1.authenticateUser, async (req, res) => {
    try {
        const { targetId, type } = req.body;
        const sourceId = req.user.id;
        if (!targetId || !type) {
            return res.status(400).json({ error: 'targetId and type are required' });
        }
        const link = await profileLink_service_1.profileLinkService.createLink(sourceId, targetId, type);
        res.status(201).json(link);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Accept a link request
router.post('/:id/accept', auth_middleware_1.authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const acceptorId = req.user.id;
        const link = await profileLink_service_1.profileLinkService.acceptLink(id, acceptorId);
        res.json(link);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Get links for current user
router.get('/me', auth_middleware_1.authenticateUser, async (req, res) => {
    try {
        const links = await profileLink_service_1.profileLinkService.getLinksForProfile(req.user.id);
        res.json(links);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Get pending requests
router.get('/pending', auth_middleware_1.authenticateUser, async (req, res) => {
    try {
        const requests = await profileLink_service_1.profileLinkService.getPendingRequests(req.user.id);
        res.json(requests);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Check if link exists between two profiles
router.get('/check/:targetId', auth_middleware_1.authenticateUser, async (req, res) => {
    try {
        const { targetId } = req.params;
        const { type } = req.query;
        const hasLink = await profileLink_service_1.profileLinkService.hasActiveLink(req.user.id, targetId, type);
        res.json({ hasLink });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Delete a link
router.delete('/:id', auth_middleware_1.authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        await profileLink_service_1.profileLinkService.removeLink(id, req.user.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
