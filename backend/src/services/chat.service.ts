import prisma from '../lib/prisma';
import { notificationEngine } from './notificationEngine.service';
import { auditService } from './audit.service';
import { profileLinkService } from './profileLink.service';

export class ChatService {
  /**
   * Get or create a chat room between two profiles
   * Requires an active link between them
   */
  async getOrCreateChat(
    profile1Id: string,
    profile2Id: string,
    type: 'private' | 'escambo' | 'agendamento' | 'bazar' = 'private',
    contextId?: string
  ): Promise<any> {
    // Verify link exists
    const hasLink = await profileLinkService.hasActiveLink(profile1Id, profile2Id);
    if (!hasLink && type === 'private') {
      throw new Error('No active link between profiles. Cannot start chat.');
    }

    // Check if chat already exists
    const existingChat = await this.findExistingChat(profile1Id, profile2Id, type, contextId);
    if (existingChat) {
      return existingChat;
    }

    // Create new chat room
    const chat = await prisma.chat.create({
      data: {
        type,
        context_id: contextId,
        participants: {
          create: [
            { profile_id: profile1Id },
            { profile_id: profile2Id },
          ],
        },
      },
      include: {
        participants: {
          include: {
            profile: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
        },
      },
    });

    return chat;
  }

  /**
   * Send a message in a chat
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    content: string
  ): Promise<any> {
    // Verify sender is participant
    const participant = await prisma.chatParticipant.findFirst({
      where: { chat_id: chatId, profile_id: senderId },
    });

    if (!participant) {
      throw new Error('You are not a participant of this chat');
    }

    // Get other participants
    const otherParticipants = await prisma.chatParticipant.findMany({
      where: { chat_id: chatId, NOT: { profile_id: senderId } },
    });

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        chat_id: chatId,
        sender_id: senderId,
        receiver_id: otherParticipants[0]?.profile_id || senderId,
        content,
        read: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Increment unread count for other participants
    await prisma.chatParticipant.updateMany({
      where: { chat_id: chatId, NOT: { profile_id: senderId } },
      data: { unread_count: { increment: 1 } },
    });

    // Send notification to other participants
    for (const p of otherParticipants) {
      await notificationEngine.emit({
        type: 'chat.message',
        actorId: senderId,
        targetUserId: p.profile_id,
        entityType: 'chat',
        entityId: chatId,
        data: { preview: content.slice(0, 50) },
      });
    }

    // Audit
    await auditService.log(senderId, 'chat.sent', 'chat', chatId, {
      content: content.slice(0, 100),
    });

    return message;
  }

  /**
   * Get chat history
   */
  async getChatHistory(chatId: string, limit: number = 50): Promise<any[]> {
    return prisma.chatMessage.findMany({
      where: { chat_id: chatId },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Get chats for a profile
   */
  async getChatsForProfile(profileId: string): Promise<any[]> {
    const participations = await prisma.chatParticipant.findMany({
      where: { profile_id: profileId },
      include: {
        chat: {
          include: {
            participants: {
              include: {
                profile: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
            messages: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { joined_at: 'desc' },
    });

    return participations.map((p) => ({
      ...p.chat,
      unreadCount: p.unread_count,
    }));
  }

  /**
   * Mark messages as read
   */
  async markAsRead(chatId: string, profileId: string): Promise<void> {
    // Mark all messages as read
    await prisma.chatMessage.updateMany({
      where: {
        chat_id: chatId,
        receiver_id: profileId,
        read: false,
      },
      data: { read: true },
    });

    // Reset unread count
    await prisma.chatParticipant.updateMany({
      where: { chat_id: chatId, profile_id: profileId },
      data: { unread_count: 0 },
    });
  }

  /**
   * Get total unread message count
   */
  async getTotalUnreadCount(profileId: string): Promise<number> {
    const result = await prisma.chatParticipant.aggregate({
      where: { profile_id: profileId },
      _sum: { unread_count: true },
    });
    return result._sum.unread_count || 0;
  }

  private async findExistingChat(
    profile1Id: string,
    profile2Id: string,
    type: string,
    contextId?: string
  ): Promise<any | null> {
    // For context-based chats, match on context_id
    if (contextId) {
      return prisma.chat.findFirst({
        where: { type, context_id: contextId },
        include: {
          participants: {
            include: {
              profile: {
                select: { id: true, name: true, avatar: true, role: true },
              },
            },
          },
        },
      });
    }

    // For private chats, match on participants
    const chats = await prisma.chat.findMany({
      where: {
        type: 'private',
        participants: {
          some: { profile_id: profile1Id },
        },
      },
      include: {
        participants: true,
      },
    });

    return chats.find((chat) => {
      const participantIds = chat.participants.map((p) => p.profile_id);
      return participantIds.includes(profile1Id) && participantIds.includes(profile2Id);
    });
  }
}

export const chatService = new ChatService();
