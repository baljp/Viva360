"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInvites = exports.inviteMember = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const inviteMember = async (req, res) => {
    const hubId = req.user?.userId;
    const { email } = req.body;
    // Verify if requester is SPACE (Sanctuary)
    const hub = await prisma_1.default.profile.findUnique({ where: { id: hubId } });
    if (hub?.role !== 'SPACE') {
        return res.status(403).json({ error: 'Only Sanctuaries can invite team members' });
    }
    const token = crypto_1.default.randomBytes(16).toString('hex');
    const invite = await prisma_1.default.tribeInvite.create({
        data: {
            hub_id: hubId,
            email,
            token,
            status: 'pending'
        }
    });
    // Mock Email Send
    console.log(`[EMAIL] Invite sent to ${email} with token ${token}`);
    return res.json(invite);
};
exports.inviteMember = inviteMember;
const listInvites = async (req, res) => {
    const hubId = req.user?.userId;
    const invites = await prisma_1.default.tribeInvite.findMany({ where: { hub_id: hubId } });
    return res.json(invites);
};
exports.listInvites = listInvites;
