import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';
import { logger } from '../lib/logger';

const REDACTED = '[REDACTED]';
const sensitiveKeyPattern = /(password|secret|token|authorization|cookie|jwt|email|phone|cpf|ssn|content|note|anamnesis|record)/i;

const sanitizeText = (input?: string) => {
  const text = String(input || '');
  if (!text) return '';
  return text
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, `Bearer ${REDACTED}`)
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+/g, REDACTED)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, REDACTED);
};

const sanitizePayload = (input: unknown, depth = 0): unknown => {
  if (depth > 4) return REDACTED;
  if (input == null) return input;

  if (typeof input === 'string') {
    return sanitizeText(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizePayload(item, depth + 1));
  }

  if (typeof input === 'object') {
    const value = input as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    Object.keys(value).forEach((key) => {
      if (sensitiveKeyPattern.test(key)) {
        next[key] = REDACTED;
        return;
      }
      next[key] = sanitizePayload(value[key], depth + 1);
    });
    return next;
  }

  return input;
};

export class AuditService {
  
  /**
   * Log an access event or action.
   * @param userId The actor performing the action
   * @param resource The target resource (e.g., 'record:123')
   * @param action The action taken (e.g., 'READ', 'WRITE')
   * @param status 'SUCCESS' or 'FAILURE'
   */
  static async logAccess(userId: string, resource: string, action: string, status: 'SUCCESS' | 'FAILURE' = 'SUCCESS', details?: string) {
    const sanitizedDetails = sanitizeText(details);
    
    // 1. Mock Mode: Log to console
    if (isMockMode()) {
      logger.info('audit.access', {
        userId,
        action,
        resource,
        status,
        details: sanitizedDetails,
        mode: 'mock',
      });
      return; 
    }

    // 2. Real Mode: Persist to DB
    try {
      logger.info('audit.db_access', { userId, action, resource });
    } catch (e) {
      logger.error('audit.db_access_failed', e);
    }
  }

  /**
   * Log an event to the audit_events table (Event Sourcing Light)
   */
  async log(actorId: string, action: string, entityType: string, entityId: string, payload?: unknown): Promise<void> {
    const sanitizedPayload = sanitizePayload(payload || {});
    if (isMockMode()) {
      logger.info('audit.event', {
        actorId,
        action,
        entityType,
        entityId,
        mode: 'mock',
      });
      return;
    }

    try {
      await prisma.auditEvent.create({
        data: {
          actor_id: actorId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          payload: sanitizedPayload as any,
        },
      });
    } catch (e) {
      // Fallback to console if table doesn't exist yet
      logger.warn('audit.event_fallback', {
        actorId,
        action,
        entityType,
        entityId,
        payload: sanitizedPayload,
      });
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
