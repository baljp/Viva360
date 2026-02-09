"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncVibration = exports.joinTribe = exports.listMembers = exports.listInvites = exports.inviteMember = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const tribe_service_1 = require("../services/tribe.service");
exports.inviteMember = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const hubId = req.user?.userId;
    const { email } = req.body;
    try {
        const invite = await tribe_service_1.tribeService.inviteMember(hubId, email);
        return res.json(invite);
    }
    catch (error) {
        if (error.message === 'Only Sanctuaries can invite team members') {
            return res.status(403).json({ error: error.message });
        }
        throw error;
    }
});
exports.listInvites = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const hubId = req.user?.userId;
    const invites = await tribe_service_1.tribeService.listInvites(hubId);
    return res.json(invites);
});
exports.listMembers = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const hubId = req.user?.userId;
    const members = await tribe_service_1.tribeService.listMembers(hubId);
    return res.json(members);
});
exports.joinTribe = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const { vacancyId } = req.body;
    const proId = req.user?.userId;
    const result = await tribe_service_1.tribeService.joinTribe(proId, vacancyId);
    return res.json(result);
});
exports.syncVibration = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const reward = 10;
    return res.json({
        success: true,
        reward,
        syncedAt: new Date().toISOString(),
        userId,
    });
});
