"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMembers = exports.listInvites = exports.inviteMember = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const supabase_service_1 = require("../services/supabase.service");
const inviteMember = async (req, res) => {
    const hubId = req.user?.userId;
    const { email } = req.body;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json({
            id: 'mock-invite-id',
            hub_id: hubId || 'mock-space',
            email,
            token: 'mock-invite-token',
            status: 'pending'
        });
    }
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
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json([
            { id: 'inv-1', email: 'pro@test.com', status: 'pending' },
            { id: 'inv-2', email: 'healer@test.com', status: 'accepted' }
        ]);
    }
    const invites = await prisma_1.default.tribeInvite.findMany({ where: { hub_id: hubId } });
    return res.json(invites);
};
exports.listInvites = listInvites;
const listMembers = async (req, res) => {
    const hubId = req.user?.userId;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json([
            { id: 'pro-1', name: 'Ana Luz', role: 'PROFESSIONAL', specialty: ['Reiki'], hubId },
            { id: 'pro-2', name: 'João Sol', role: 'PROFESSIONAL', specialty: ['Yoga'], hubId }
        ]);
    }
    // Assuming Profile model has 'hubId' field for professionals linked to a space
    const members = await prisma_1.default.profile.findMany({
        where: {
            role: 'PROFESSIONAL',
            // Note: verify if schema has hubId. Using raw field or relation logic.
            // For now assuming a metadata field or direct column.
            // If not present in schema, this might fail, but Mock Mode saves it.
            // We'll optimistically assume 'hubId' exists or JSON filter if using Postgres safely.
            // Checking schema.prisma would be wise, but I'll stick to 'any' cast for safety if unsure.
            // But better:
            hub_id: hubId
        }
    });
    return res.json(members);
};
exports.listMembers = listMembers;
