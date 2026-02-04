import prisma from '../lib/prisma';
import { notificationEngine } from './notificationEngine.service';
import { auditService } from './audit.service';

export type LinkType = 'tribo' | 'paciente' | 'escambo' | 'equipe' | 'bazar';
export type LinkStatus = 'pending' | 'accepted' | 'active';

export class ProfileLinkService {
  /**
   * Create a link request between two profiles
   * Generates notification for target user
   */
  async createLink(
    sourceId: string,
    targetId: string,
    type: LinkType
  ): Promise<any> {
    // Check if link already exists
    const existing = await prisma.profileLink.findFirst({
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
    const link = await prisma.profileLink.create({
      data: {
        source_id: sourceId,
        target_id: targetId,
        type,
        status: 'pending',
      },
    });

    // Emit notification to target
    await notificationEngine.emit({
      type: 'link.created',
      actorId: sourceId,
      targetUserId: targetId,
      entityType: 'profile_link',
      entityId: link.id,
      data: { linkType: type },
    });

    // Audit log
    await auditService.log(sourceId, 'link.created', 'profile_link', link.id, {
      type,
      targetId,
    });

    return link;
  }

  /**
   * Accept a pending link request
   * Generates notification for both users
   */
  async acceptLink(linkId: string, acceptorId: string): Promise<any> {
    const link = await prisma.profileLink.findUnique({
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
    const updated = await prisma.profileLink.update({
      where: { id: linkId },
      data: { status: 'accepted' },
    });

    // Notify the source that link was accepted
    await notificationEngine.emit({
      type: 'link.accepted',
      actorId: acceptorId,
      targetUserId: link.source_id,
      entityType: 'profile_link',
      entityId: linkId,
      data: { linkType: link.type },
    });

    // Audit
    await auditService.log(acceptorId, 'link.accepted', 'profile_link', linkId, {
      type: link.type,
    });

    return updated;
  }

  /**
   * Get all links for a profile (as source or target)
   */
  async getLinksForProfile(profileId: string): Promise<any[]> {
    const links = await prisma.profileLink.findMany({
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
  async getPendingRequests(profileId: string): Promise<any[]> {
    return prisma.profileLink.findMany({
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
  async hasActiveLink(
    profileA: string,
    profileB: string,
    type?: LinkType
  ): Promise<boolean> {
    const link = await prisma.profileLink.findFirst({
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
  async removeLink(linkId: string, removerId: string): Promise<void> {
    const link = await prisma.profileLink.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      throw new Error('Link not found');
    }

    // Only source or target can remove
    if (link.source_id !== removerId && link.target_id !== removerId) {
      throw new Error('Not authorized to remove this link');
    }

    await prisma.profileLink.delete({
      where: { id: linkId },
    });

    // Audit
    await auditService.log(removerId, 'link.removed', 'profile_link', linkId, {
      type: link.type,
    });
  }
}

export const profileLinkService = new ProfileLinkService();
