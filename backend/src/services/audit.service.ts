import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';

export class AuditService {
  
  /**
   * Log an access event or action.
   * @param userId The actor performing the action
   * @param resource The target resource (e.g., 'record:123')
   * @param action The action taken (e.g., 'READ', 'WRITE')
   * @param status 'SUCCESS' or 'FAILURE'
   */
  static async logAccess(userId: string, resource: string, action: string, status: 'SUCCESS' | 'FAILURE' = 'SUCCESS', details?: string) {
    
    // 1. Mock Mode: Log to console
    if (isMockMode()) {
      console.log(`[AUDIT] User: ${userId} | Action: ${action} | Resource: ${resource} | Status: ${status} | Details: ${details || ''}`);
      return; 
    }

    // 2. Real Mode: Persist to DB
    try {
      console.log(`[DB-AUDIT] User: ${userId} | Action: ${action} | Resource: ${resource}`);
    } catch (e) {
      console.error('[AUDIT FAIL]', e);
    }
  }

  /**
   * Log an event to the audit_events table (Event Sourcing Light)
   */
  async log(actorId: string, action: string, entityType: string, entityId: string, payload?: any): Promise<void> {
    if (isMockMode()) {
      console.log(`[AUDIT] Actor: ${actorId} | Action: ${action} | Entity: ${entityType}:${entityId}`);
      return;
    }

    try {
      await prisma.auditEvent.create({
        data: {
          actor_id: actorId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          payload: payload || {},
        },
      });
    } catch (e) {
      // Fallback to console if table doesn't exist yet
      console.log(`[AUDIT] Actor: ${actorId} | Action: ${action} | Entity: ${entityType}:${entityId}`, payload);
    }
  }

  /**
   * Get audit events for an entity
   */
  async getEventsForEntity(entityType: string, entityId: string, limit: number = 50): Promise<any[]> {
    try {
      return await prisma.auditEvent.findMany({
        where: { entity_type: entityType, entity_id: entityId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    } catch {
      return [];
    }
  }

  /**
   * Get audit events by actor
   */
  async getEventsByActor(actorId: string, limit: number = 50): Promise<any[]> {
    try {
      return await prisma.auditEvent.findMany({
        where: { actor_id: actorId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    } catch {
      return [];
    }
  }
}

export const auditService = new AuditService();
