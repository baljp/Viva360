import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    auditEvent: { create: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock('../lib/prisma', () => ({ default: prismaMock }));
vi.mock('../lib/appMode', () => ({ isMockMode: () => false }));

import { AuditService, auditService } from '../services/audit.service';

describe('AuditService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('log', () => {
    it('creates an audit event with correct fields', async () => {
      prismaMock.auditEvent.create.mockResolvedValue({ id: 'ae-1' });
      await auditService.log('actor-1', 'CHECKIN', 'PROFILE', 'entity-1', { reward: 50 });
      expect(prismaMock.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actor_id: 'actor-1',
          action: 'CHECKIN',
          entity_type: 'PROFILE',
          entity_id: 'entity-1',
        }),
      });
    });

    it('handles missing payload gracefully', async () => {
      prismaMock.auditEvent.create.mockResolvedValue({ id: 'ae-2' });
      await auditService.log('actor-1', 'VIEW', 'APPOINTMENT', 'appt-1');
      expect(prismaMock.auditEvent.create).toHaveBeenCalled();
    });
  });

  describe('getEventsForEntity', () => {
    it('fetches events by entity type and id', async () => {
      const events = [{ id: 'ae-1', action: 'CHECKIN' }, { id: 'ae-2', action: 'VIEW' }];
      prismaMock.auditEvent.findMany.mockResolvedValue(events);
      const result = await auditService.getEventsForEntity('PROFILE', 'user-1');
      expect(result).toHaveLength(2);
      expect(prismaMock.auditEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { entity_type: 'PROFILE', entity_id: 'user-1' },
      }));
    });

    it('respects limit parameter', async () => {
      prismaMock.auditEvent.findMany.mockResolvedValue([]);
      await auditService.getEventsForEntity('CHAT', 'room-1', 10);
      expect(prismaMock.auditEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 10,
      }));
    });
  });

  describe('getEventsByActor', () => {
    it('fetches events by actor id', async () => {
      prismaMock.auditEvent.findMany.mockResolvedValue([{ id: 'ae-1' }]);
      const result = await auditService.getEventsByActor('user-1');
      expect(result).toHaveLength(1);
    });
  });

  it('exports singleton instance', () => {
    expect(auditService).toBeInstanceOf(AuditService);
  });
});
