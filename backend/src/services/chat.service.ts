import prisma from '../lib/prisma';
import { notificationEngine } from './notificationEngine.service';
import { auditService } from './audit.service';
import { profileLinkService } from './profileLink.service';
import crypto from 'crypto';

function isDbUnavailableError(err: unknown): boolean {
  const e: any = err;
  const name = String(e?.name || '');
  const code = String(e?.code || '');
  const msg = String(e?.message || '');

  // Prisma can fail either at initialization (bad creds / unreachable DB)
  // or at request-time with P10xx codes. We only fallback for these cases.
  if (name.includes('PrismaClientInitializationError')) return true;
  if (code === 'P1000' || code === 'P1001' || code === 'P1002' || code === 'P1017') return true;

  // Best-effort string matching for environments where Prisma error shape differs.
  if (/provided database credentials.*not valid/i.test(msg)) return true;
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN/i.test(msg)) return true;
  if (/Can't reach database server|Connection terminated unexpectedly/i.test(msg)) return true;

  return false;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function keyToUuid(key: string): string {
  const hex = crypto.createHash('sha256').update(key).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const isProdRuntime = process.env.NODE_ENV === 'production';
const isMockRuntime =
  !isProdRuntime
  && (String(process.env.APP_MODE || '').toUpperCase() === 'MOCK' || process.env.NODE_ENV === 'test');

// In-memory fallback used only in mock/test runtime when Prisma DB is unavailable.
const memory = {
  roomsById: new Map<string, any>(),
  participantsByRoomId: new Map<string, Set<string>>(),
  messagesByRoomId: new Map<string, any[]>(),
};

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
    try {
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
    } catch (e) {
      if (!isMockRuntime || !isDbUnavailableError(e)) throw e;

      const participants = memory.participantsByRoomId.get(chatId) || new Set<string>();
      participants.add(senderId);
      memory.participantsByRoomId.set(chatId, participants);

      const now = new Date().toISOString();
      const msg = {
        id: keyToUuid(`msg:${chatId}:${now}:${senderId}`),
        chat_id: chatId,
        sender_id: senderId,
        receiver_id: senderId,
        content,
        read: false,
        created_at: now,
        sender: { id: senderId, name: 'Você', avatar: '' },
      };
      const list = memory.messagesByRoomId.get(chatId) || [];
      list.push(msg);
      memory.messagesByRoomId.set(chatId, list);
      return msg;
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(chatId: string, limit: number = 50): Promise<any[]> {
    try {
      const rows = await prisma.chatMessage.findMany({
        where: { chat_id: chatId },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
      return rows;
    } catch (e) {
      if (!isMockRuntime || !isDbUnavailableError(e)) throw e;
      const list = memory.messagesByRoomId.get(chatId) || [];
      return [...list].slice(-limit).reverse();
    }
  }

  /**
   * Get chats for a profile
   */
  async getChatsForProfile(
    profileId: string,
    options?: { contextType?: string; contextId?: string; limit?: number }
  ): Promise<any[]> {
    const contextType = String(options?.contextType || '').trim();
    const contextId = String(options?.contextId || '').trim();
    const limit = Number.isFinite(options?.limit) ? Math.max(1, Math.min(100, Number(options?.limit))) : 50;
    try {
      const participations = await prisma.chatParticipant.findMany({
        where: {
          profile_id: profileId,
          ...(contextType || contextId ? {
            chat: {
              ...(contextType ? { type: contextType } : {}),
              ...(contextId ? { context_id: contextId } : {}),
            },
          } : {}),
        },
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
        take: limit,
      });

      return participations.map((p) => ({
        ...p.chat,
        unreadCount: p.unread_count,
      }));
    } catch (e) {
      if (!isMockRuntime || !isDbUnavailableError(e)) throw e;
      const rooms = [...memory.roomsById.values()].filter((room) => {
        const participants = memory.participantsByRoomId.get(room.id);
        if (!participants?.has(profileId)) return false;
        if (contextType && String(room.type) !== contextType) return false;
        if (contextId && String(room.context_id) !== contextId) return false;
        return true;
      }).slice(0, limit);
      return rooms.map((room) => {
        const last = (memory.messagesByRoomId.get(room.id) || []).slice(-1)[0] || null;
        return {
          ...room,
          participants: [],
          messages: last ? [last] : [],
          unreadCount: 0,
        };
      });
    }
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

  /**
   * Get or create a context-based group room and ensure the profile is joined.
   * Used for Tribo "Sala de Apoio" and "Circulo de Cura" persistent chats.
   */
  async getOrCreateContextRoom(
    profileId: string,
    type: string,
    contextId?: string
  ): Promise<any> {
    const normalizedContextId = (() => {
      const raw = String(contextId || '').trim();
      if (raw && isUuid(raw)) return raw;
      if (raw) return keyToUuid(`viva360:${type}:${raw}`);
      return keyToUuid(`viva360:${type}`);
    })();

    try {
      const existing = await prisma.chat.findFirst({
        where: { type, context_id: normalizedContextId },
        include: {
          participants: {
            include: {
              profile: { select: { id: true, name: true, avatar: true, role: true } },
            },
          },
        },
      });

      const chat = existing
        ? existing
        : await prisma.chat.create({
            data: {
              type,
              context_id: normalizedContextId,
              participants: { create: [{ profile_id: profileId }] },
            },
            include: {
              participants: {
                include: {
                  profile: { select: { id: true, name: true, avatar: true, role: true } },
                },
              },
            },
          });

      const participant = await prisma.chatParticipant.findFirst({
        where: { chat_id: chat.id, profile_id: profileId },
      });
      if (!participant) {
        // Best-effort: unique constraint on (chat_id, profile_id) prevents dupes.
        await prisma.chatParticipant
          .create({ data: { chat_id: chat.id, profile_id: profileId } })
          .catch(() => undefined);
      }

      return prisma.chat.findUnique({
        where: { id: chat.id },
        include: {
          participants: {
            include: {
              profile: { select: { id: true, name: true, avatar: true, role: true } },
            },
          },
        },
      });
    } catch (e) {
      if (!isMockRuntime || !isDbUnavailableError(e)) throw e;

      const roomId = keyToUuid(`room:${type}:${normalizedContextId}`);
      const existing = memory.roomsById.get(roomId);
      const room = existing || { id: roomId, type, context_id: normalizedContextId, created_at: new Date().toISOString(), participants: [] };
      memory.roomsById.set(roomId, room);

      const participants = memory.participantsByRoomId.get(roomId) || new Set<string>();
      participants.add(profileId);
      memory.participantsByRoomId.set(roomId, participants);

      return room;
    }
  }
}

export const chatService = new ChatService();
