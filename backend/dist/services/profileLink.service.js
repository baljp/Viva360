"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileLinkService = exports.ProfileLinkService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const notificationEngine_service_1 = require("./notificationEngine.service");
const audit_service_1 = require("./audit.service");
class ProfileLinkService {
    /**
     * Create a link request between two profiles
     * Generates notification for target user
     */
    async createLink(sourceId, targetId, type) {
        // Check if link already exists
        const existing = await prisma_1.default.profileLink.findFirst({
            where: {
                source_id: sourceId,
                target_id: targetId,
                type: type,
            },
        });
        if (existing) {
            throw new Error('Link already exists');
        }
        // Create the link
        const link = await prisma_1.default.profileLink.create({
            data: {
                source_id: sourceId,
                target_id: targetId,
                type,
                status: 'pending',
            },
        });
        // Emit notification to target
        await notificationEngine_service_1.notificationEngine.emit({
            type: 'link.created',
            actorId: sourceId,
            targetUserId: targetId,
            entityType: 'profile_link',
            entityId: link.id,
            data: { linkType: type },
        });
        // Audit log
        await audit_service_1.auditService.log(sourceId, 'link.created', 'profile_link', link.id, {
            type,
            targetId,
        });
        return link;
    }
    /**
     * Accept a pending link request
     * Generates notification for both users
     */
    async acceptLink(linkId, acceptorId) {
        const link = await prisma_1.default.profileLink.findUnique({
            where: { id: linkId },
        });
        if (!link) {
            throw new Error('Link not found');
        }
        if (link.target_id !== acceptorId) {
            throw new Error('Not authorized to accept this link');
        }
        if (link.status !== 'pending') {
            throw new Error('Link is not pending');
        }
        // Update link status
        const updated = await prisma_1.default.profileLink.update({
            where: { id: linkId },
            data: { status: 'accepted' },
        });
        // Notify the source that link was accepted
        await notificationEngine_service_1.notificationEngine.emit({
            type: 'link.accepted',
            actorId: acceptorId,
            targetUserId: link.source_id,
            entityType: 'profile_link',
            entityId: linkId,
            data: { linkType: link.type },
        });
        // Audit
        await audit_service_1.auditService.log(acceptorId, 'link.accepted', 'profile_link', linkId, {
            type: link.type,
        });
        return updated;
    }
    /**
     * Get all links for a profile (as source or target)
     */
    async getLinksForProfile(profileId) {
        const links = await prisma_1.default.profileLink.findMany({
            where: {
                OR: [{ source_id: profileId }, { target_id: profileId }],
            },
            include: {
                source: {
                    select: { id: true, name: true, avatar: true, role: true },
                },
                target: {
                    select: { id: true, name: true, avatar: true, role: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
        return links;
    }
    /**
     * Get pending link requests for a profile
     */
    async getPendingRequests(profileId) {
        return prisma_1.default.profileLink.findMany({
            where: {
                target_id: profileId,
                status: 'pending',
            },
            include: {
                source: {
                    select: { id: true, name: true, avatar: true, role: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }
    /**
     * Check if two profiles have an active link
     */
    async hasActiveLink(profileA, profileB, type) {
        const link = await prisma_1.default.profileLink.findFirst({
            where: {
                OR: [
                    { source_id: profileA, target_id: profileB },
                    { source_id: profileB, target_id: profileA },
                ],
                status: { in: ['accepted', 'active'] },
                ...(type ? { type } : {}),
            },
        });
        return !!link;
    }
    /**
     * Remove a link
     */
    async removeLink(linkId, removerId) {
        const link = await prisma_1.default.profileLink.findUnique({
            where: { id: linkId },
        });
        if (!link) {
            throw new Error('Link not found');
        }
        // Only source or target can remove
        if (link.source_id !== removerId && link.target_id !== removerId) {
            throw new Error('Not authorized to remove this link');
        }
        await prisma_1.default.profileLink.delete({
            where: { id: linkId },
        });
        // Audit
        await audit_service_1.auditService.log(removerId, 'link.removed', 'profile_link', linkId, {
            type: link.type,
        });
    }
}
exports.ProfileLinkService = ProfileLinkService;
exports.profileLinkService = new ProfileLinkService();
