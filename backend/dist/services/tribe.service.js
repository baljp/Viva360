"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tribeService = exports.TribeService = void 0;
const tribe_repository_1 = require("../repositories/tribe.repository");
const crypto_1 = __importDefault(require("crypto"));
class TribeService {
    async inviteMember(hubId, email) {
        // Domain Logic: Only SPACE can invite
        const hub = await tribe_repository_1.tribeRepository.findProfile(hubId);
        if (hub?.role !== 'SPACE') {
            throw new Error('Only Sanctuaries can invite team members'); // Should be 403, handled by consumer or error middleware
        }
        const token = crypto_1.default.randomBytes(16).toString('hex');
        const invite = await tribe_repository_1.tribeRepository.createInvite({
            hub_id: hubId,
            email,
            token,
            status: 'pending'
        });
        // Mock Email
        console.log(`[EMAIL] Invite sent to ${email} with token ${token}`);
        return invite;
    }
    async listInvites(hubId) {
        return await tribe_repository_1.tribeRepository.findInvitesByHub(hubId);
    }
    async listMembers(hubId) {
        return await tribe_repository_1.tribeRepository.findMembersByHub(hubId);
    }
    async joinTribe(proId, vacancyId) {
        // Improve: Connect to vacancy logic. For now, simple ack
        return { success: true, message: 'Application received' };
    }
}
exports.TribeService = TribeService;
exports.tribeService = new TribeService();
