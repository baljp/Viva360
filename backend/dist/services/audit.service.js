"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_service_1 = require("../services/supabase.service");
class AuditService {
    /**
     * Log an access event or action.
     * @param userId The actor performing the action
     * @param resource The target resource (e.g., 'record:123')
     * @param action The action taken (e.g., 'READ', 'WRITE')
     * @param status 'SUCCESS' or 'FAILURE'
     */
    static async logAccess(userId, resource, action, status = 'SUCCESS', details) {
        // 1. Mock Mode: Log to console
        if ((0, supabase_service_1.isMockMode)()) {
            console.log(`[AUDIT] User: ${userId} | Action: ${action} | Resource: ${resource} | Status: ${status} | Details: ${details || ''}`);
            return;
        }
        // 2. Real Mode: Persist to DB
        try {
            console.log(`[DB-AUDIT] User: ${userId} | Action: ${action} | Resource: ${resource}`);
        }
        catch (e) {
            console.error('[AUDIT FAIL]', e);
        }
    }
    /**
     * Log an event to the audit_events table (Event Sourcing Light)
     */
    async log(actorId, action, entityType, entityId, payload) {
        if ((0, supabase_service_1.isMockMode)()) {
            console.log(`[AUDIT] Actor: ${actorId} | Action: ${action} | Entity: ${entityType}:${entityId}`);
            return;
        }
        try {
            await prisma_1.default.auditEvent.create({
                data: {
                    actor_id: actorId,
                    action,
                    entity_type: entityType,
                    entity_id: entityId,
                    payload: payload || {},
                },
            });
        }
        catch (e) {
            // Fallback to console if table doesn't exist yet
            console.log(`[AUDIT] Actor: ${actorId} | Action: ${action} | Entity: ${entityType}:${entityId}`, payload);
        }
    }
    /**
     * Get audit events for an entity
     */
    async getEventsForEntity(entityType, entityId, limit = 50) {
        try {
            return await prisma_1.default.auditEvent.findMany({
                where: { entity_type: entityType, entity_id: entityId },
                orderBy: { created_at: 'desc' },
                take: limit,
            });
        }
        catch {
            return [];
        }
    }
    /**
     * Get audit events by actor
     */
    async getEventsByActor(actorId, limit = 50) {
        try {
            return await prisma_1.default.auditEvent.findMany({
                where: { actor_id: actorId },
                orderBy: { created_at: 'desc' },
                take: limit,
            });
        }
        catch {
            return [];
        }
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
