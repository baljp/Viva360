"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.presenceService = exports.PresenceService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class PresenceService {
    /**
     * Set guardian presence status
     * Only applicable to PROFESSIONAL role
     */
    async setStatus(guardianId, status) {
        const expiresAt = new Date(Date.now() + PresenceService.PRESENCE_DURATION_MINUTES * 60 * 1000);
        // Upsert presence
        const presence = await prisma_1.default.guardianPresence.upsert({
            where: { guardian_id: guardianId },
            update: {
                status,
                last_activity_at: new Date(),
                expires_at: expiresAt,
            },
            create: {
                guardian_id: guardianId,
                status,
                last_activity_at: new Date(),
                expires_at: expiresAt,
            },
        });
        return presence;
    }
    /**
     * Set guardian to ONLINE
     */
    async goOnline(guardianId) {
        return this.setStatus(guardianId, 'ONLINE');
    }
    /**
     * Set guardian to OFFLINE
     */
    async goOffline(guardianId) {
        return this.setStatus(guardianId, 'OFFLINE');
    }
    /**
     * Ping to extend presence session
     */
    async ping(guardianId) {
        const existing = await prisma_1.default.guardianPresence.findUnique({
            where: { guardian_id: guardianId },
        });
        if (!existing) {
            return this.goOnline(guardianId);
        }
        // Extend expiration
        const expiresAt = new Date(Date.now() + PresenceService.PRESENCE_DURATION_MINUTES * 60 * 1000);
        return prisma_1.default.guardianPresence.update({
            where: { guardian_id: guardianId },
            data: {
                last_activity_at: new Date(),
                expires_at: expiresAt,
            },
        });
    }
    /**
     * Get presence status for a guardian
     */
    async getStatus(guardianId) {
        const presence = await prisma_1.default.guardianPresence.findUnique({
            where: { guardian_id: guardianId },
        });
        if (!presence) {
            return 'OFFLINE';
        }
        // Check if expired
        if (new Date() > presence.expires_at) {
            return 'OFFLINE';
        }
        return presence.status;
    }
    /**
     * Get all online guardians
     */
    async getOnlineGuardians() {
        const now = new Date();
        const presences = await prisma_1.default.guardianPresence.findMany({
            where: {
                status: 'ONLINE',
                expires_at: { gt: now },
            },
            select: { guardian_id: true },
        });
        return presences.map((p) => p.guardian_id);
    }
    /**
     * Get presence status for multiple guardians
     */
    async getStatusBatch(guardianIds) {
        const now = new Date();
        const presences = await prisma_1.default.guardianPresence.findMany({
            where: {
                guardian_id: { in: guardianIds },
            },
        });
        const result = {};
        for (const id of guardianIds) {
            const presence = presences.find((p) => p.guardian_id === id);
            if (!presence || new Date() > presence.expires_at) {
                result[id] = 'OFFLINE';
            }
            else {
                result[id] = presence.status;
            }
        }
        return result;
    }
    /**
     * Clean up expired presence entries
     * Should be run periodically
     */
    async cleanupExpired() {
        const result = await prisma_1.default.guardianPresence.updateMany({
            where: {
                expires_at: { lt: new Date() },
                status: 'ONLINE',
            },
            data: { status: 'OFFLINE' },
        });
        return result.count;
    }
}
exports.PresenceService = PresenceService;
// Default presence duration in minutes
PresenceService.PRESENCE_DURATION_MINUTES = 15;
exports.presenceService = new PresenceService();
