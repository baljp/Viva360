import { AuditEvent, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

const REDACTED = '[REDACTED]';
const sensitiveKeyPattern = /(password|secret|token|authorization|cookie|jwt|email|phone|cpf|ssn|content|note|anamnesis|record)/i;
type SanitizedJson = string | number | boolean | null | SanitizedJson[] | { [key: string]: SanitizedJson };

const sanitizeText = (input?: string) => {
  const text = String(input || '');
  if (!text) return '';
  return text
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, `Bearer ${REDACTED}`)
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+/g, REDACTED)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, REDACTED);
};

const sanitizePayload = (input: unknown, depth = 0): SanitizedJson => {
  if (depth > 4) return REDACTED;
  if (input == null) return null;
  if (typeof input === 'string') return sanitizeText(input);
  if (typeof input === 'number' || typeof input === 'boolean') return input;
  if (Array.isArray(input)) return input.map((item) => sanitizePayload(item, depth + 1));
  if (typeof input === 'object') {
    const value = input as Record<string, unknown>;
    const next: Record<string, SanitizedJson> = {};
    Object.keys(value).forEach((key) => {
      if (sensitiveKeyPattern.test(key)) { next[key] = REDACTED; return; }
      next[key] = sanitizePayload(value[key], depth + 1);
    });
    return next;
  }
  return String(input);
};

const extractErrorMessage = (error: unknown) => (error as { message?: string })?.message;
const toInputJsonValue = (input: SanitizedJson): Prisma.InputJsonValue => input as Prisma.InputJsonValue;

export class AuditService {
  static async logAccess(userId: string, resource: string, action: string, status: 'SUCCESS' | 'FAILURE' = 'SUCCESS', details?: string) {
    const sanitizedDetails = sanitizeText(details);
    try {
      await prisma.auditEvent.create({
        data: {
          actor_id: userId,
          action,
          entity_type: 'ACCESS',
          entity_id: resource,
          payload: { status, details: sanitizedDetails },
        },
      });
    } catch (e) {
      logger.warn('audit.logAccess_fallback', { userId, action, resource, status, error: extractErrorMessage(e) });
    }
  }

  async log(actorId: string, action: string, entityType: string, entityId: string, payload?: unknown): Promise<void> {
    const sanitizedPayload = sanitizePayload(payload || {});
    try {
      await prisma.auditEvent.create({
        data: {
          actor_id: actorId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          payload: toInputJsonValue(sanitizedPayload),
        },
      });
    } catch (e) {
      logger.warn('audit.event_fallback', { actorId, action, entityType, entityId, payload: sanitizedPayload });
    }
  }

  async getEventsForEntity(entityType: string, entityId: string, limit: number = 50): Promise<AuditEvent[]> {
    try {
      return await prisma.auditEvent.findMany({
        where: { entity_type: entityType, entity_id: entityId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    } catch (err) {
      logger.warn('audit.getEventsForEntity_failed', err);
      return [];
    }
  }

  async getEventsByActor(actorId: string, limit: number = 50): Promise<AuditEvent[]> {
    try {
      return await prisma.auditEvent.findMany({
        where: { actor_id: actorId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    } catch (err) {
      logger.warn('audit.getEventsByActor_failed', err);
      return [];
    }
  }
}

export const auditService = new AuditService();
