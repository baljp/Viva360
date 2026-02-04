import prisma from '../lib/prisma';

export type PresenceStatus = 'ONLINE' | 'OFFLINE' | 'BUSY';

export class PresenceService {
  // Default presence duration in minutes
  private static PRESENCE_DURATION_MINUTES = 15;

  /**
   * Set guardian presence status
   * Only applicable to PROFESSIONAL role
   */
  async setStatus(guardianId: string, status: PresenceStatus): Promise<any> {
    const expiresAt = new Date(
      Date.now() + PresenceService.PRESENCE_DURATION_MINUTES * 60 * 1000
    );

    // Upsert presence
    const presence = await prisma.guardianPresence.upsert({
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
  async goOnline(guardianId: string): Promise<any> {
    return this.setStatus(guardianId, 'ONLINE');
  }

  /**
   * Set guardian to OFFLINE
   */
  async goOffline(guardianId: string): Promise<any> {
    return this.setStatus(guardianId, 'OFFLINE');
  }

  /**
   * Ping to extend presence session
   */
  async ping(guardianId: string): Promise<any> {
    const existing = await prisma.guardianPresence.findUnique({
      where: { guardian_id: guardianId },
    });

    if (!existing) {
      return this.goOnline(guardianId);
    }

    // Extend expiration
    const expiresAt = new Date(
      Date.now() + PresenceService.PRESENCE_DURATION_MINUTES * 60 * 1000
    );

    return prisma.guardianPresence.update({
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
  async getStatus(guardianId: string): Promise<PresenceStatus> {
    const presence = await prisma.guardianPresence.findUnique({
      where: { guardian_id: guardianId },
    });

    if (!presence) {
      return 'OFFLINE';
    }

    // Check if expired
    if (new Date() > presence.expires_at) {
      return 'OFFLINE';
    }

    return presence.status as PresenceStatus;
  }

  /**
   * Get all online guardians
   */
  async getOnlineGuardians(): Promise<string[]> {
    const now = new Date();

    const presences = await prisma.guardianPresence.findMany({
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
  async getStatusBatch(guardianIds: string[]): Promise<Record<string, PresenceStatus>> {
    const now = new Date();

    const presences = await prisma.guardianPresence.findMany({
      where: {
        guardian_id: { in: guardianIds },
      },
    });

    const result: Record<string, PresenceStatus> = {};

    for (const id of guardianIds) {
      const presence = presences.find((p) => p.guardian_id === id);
      if (!presence || new Date() > presence.expires_at) {
        result[id] = 'OFFLINE';
      } else {
        result[id] = presence.status as PresenceStatus;
      }
    }

    return result;
  }

  /**
   * Clean up expired presence entries
   * Should be run periodically
   */
  async cleanupExpired(): Promise<number> {
    const result = await prisma.guardianPresence.updateMany({
      where: {
        expires_at: { lt: new Date() },
        status: 'ONLINE',
      },
      data: { status: 'OFFLINE' },
    });

    return result.count;
  }
}

export const presenceService = new PresenceService();
