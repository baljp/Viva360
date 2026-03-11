import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, profileLinkServiceMock, notificationEngineMock, auditServiceMock } = vi.hoisted(() => ({
  prismaMock: {
    chat: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    chatParticipant: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn(), updateMany: vi.fn(), aggregate: vi.fn() },
    chatMessage: { create: vi.fn(), findMany: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
  },
  profileLinkServiceMock: { hasActiveLink: vi.fn() },
  notificationEngineMock: { emit: vi.fn() },
  auditServiceMock: { log: vi.fn() },
}));

vi.mock('../lib/prisma', () => ({ default: prismaMock }));
vi.mock('../lib/appMode', () => ({ isMockMode: () => false }));
vi.mock('../services/profileLink.service', () => ({ profileLinkService: profileLinkServiceMock }));
vi.mock('../services/notificationEngine.service', () => ({ notificationEngine: notificationEngineMock }));
vi.mock('../services/audit.service', () => ({ auditService: auditServiceMock }));

import { ChatService } from '../services/chat.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    vi.clearAllMocks();
    profileLinkServiceMock.hasActiveLink.mockResolvedValue(true);
    notificationEngineMock.emit.mockResolvedValue(undefined);
    auditServiceMock.log.mockResolvedValue(undefined);
    prismaMock.chatParticipant.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.chatParticipant.aggregate.mockResolvedValue({ _sum: { unread_count: 0 } });
    service = new ChatService();
  });

  describe('getOrCreateChat', () => {
    it('returns existing chat if found', async () => {
      const mockChat = {
        id: 'chat-1',
        type: 'private',
        participants: [{ profile_id: 'user-a' }, { profile_id: 'user-b' }],
      };
      prismaMock.chat.findMany.mockResolvedValue([mockChat]);
      const result = await service.getOrCreateChat('user-a', 'user-b');
      expect(result).toEqual(mockChat);
      expect(prismaMock.chat.create).not.toHaveBeenCalled();
    });

    it('creates new chat if none exists', async () => {
      prismaMock.chat.findMany.mockResolvedValue([]);
      const mockNew = { id: 'chat-new', type: 'private', participants: [] };
      prismaMock.chat.create.mockResolvedValue(mockNew);
      const result = await service.getOrCreateChat('user-a', 'user-b');
      expect(result.id).toBe('chat-new');
      expect(prismaMock.chat.create).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('creates a message and returns it', async () => {
      prismaMock.chatParticipant.findFirst.mockResolvedValue({ id: 'p1', chat_id: 'chat-1', profile_id: 'user-a' });
      prismaMock.chatParticipant.findMany.mockResolvedValue([{ profile_id: 'user-b' }]);
      const msg = { id: 'msg-1', chat_id: 'chat-1', sender_id: 'user-a', content: 'Olá', created_at: new Date() };
      prismaMock.chatMessage.create.mockResolvedValue(msg);
      const result = await service.sendMessage('chat-1', 'user-a', 'Olá');
      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Olá');
    });
  });

  describe('getChatHistory', () => {
    it('returns messages in chronological order', async () => {
      prismaMock.chatParticipant.findFirst.mockResolvedValue({ id: 'p1' });
      const msgs = [
        { id: 'm1', content: 'First', created_at: new Date('2026-01-01'), sender_id: 'a' },
        { id: 'm2', content: 'Second', created_at: new Date('2026-01-02'), sender_id: 'b' },
      ];
      prismaMock.chatMessage.findMany.mockResolvedValue(msgs);
      const result = await service.getChatHistory('chat-1', 'user-a');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('m1');
    });
  });

  describe('markAsRead', () => {
    it('updates unread messages', async () => {
      prismaMock.chatMessage.updateMany.mockResolvedValue({ count: 3 });
      await service.markAsRead('chat-1', 'user-a');
      expect(prismaMock.chatMessage.updateMany).toHaveBeenCalled();
      expect(prismaMock.chatParticipant.updateMany).toHaveBeenCalled();
    });
  });

  describe('getTotalUnreadCount', () => {
    it('returns unread count across rooms', async () => {
      prismaMock.chatParticipant.aggregate.mockResolvedValue({ _sum: { unread_count: 5 } });
      const count = await service.getTotalUnreadCount('user-a');
      expect(count).toBe(5);
    });
  });
});
