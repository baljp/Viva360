import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockOracleMessages = [
  { id: 'om-1', theme: 'growth', element: 'earth', archetype: 'sage', message: 'Wisdom flows', ritual: 'Breathe', affirmation: 'I grow', active: true, created_at: new Date() },
  { id: 'om-2', theme: 'love', element: 'water', archetype: 'healer', message: 'Love heals', ritual: 'Meditate', affirmation: 'I love', active: true, created_at: new Date() },
];

const { prismaMock, prismaReadMock } = vi.hoisted(() => ({
  prismaMock: {
    oracleMessage: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    oracleHistory: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  },
  prismaReadMock: {
    oracleMessage: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    oracleHistory: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}));

vi.mock('../lib/prisma', () => ({ default: prismaMock, prismaRead: prismaReadMock }));
vi.mock('../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('../lib/appMode', () => ({ isMockMode: () => false }));

import { OracleService, oracleService } from '../services/oracle.service';

describe('OracleService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('drawCard', () => {
    it('returns a card from the database', async () => {
      prismaMock.oracleMessage.findMany.mockResolvedValue(mockOracleMessages);
      prismaMock.oracleMessage.count.mockResolvedValue(2);
      prismaMock.oracleHistory.findFirst.mockResolvedValue(null);
      prismaMock.oracleHistory.create.mockResolvedValue({ id: 'h-1' });
      const card = await oracleService.drawCard('user-1', { mood: 'SERENO' });
      expect(card).toBeDefined();
      expect(card).toHaveProperty('id');
    });

    it('returns fallback if DB has no messages', async () => {
      prismaMock.oracleMessage.findMany.mockResolvedValue([]);
      prismaMock.oracleMessage.count.mockResolvedValue(0);
      prismaMock.oracleHistory.findFirst.mockResolvedValue(null);
      prismaMock.oracleHistory.create.mockResolvedValue({ id: 'h-2' });
      const card = await oracleService.drawCard('user-1', { mood: 'VIBRANTE' });
      // Should return a fallback card from internal deck
      expect(card).toBeDefined();
    });
  });

  describe('getHistory', () => {
    it('returns user draw history', async () => {
      const history = [{ id: 'h-1', message: mockOracleMessages[0] }];
      prismaReadMock.oracleHistory.findMany.mockResolvedValue(history);
      const result = await oracleService.getHistory('user-1');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  it('exports singleton instance', () => {
    expect(oracleService).toBeInstanceOf(OracleService);
  });
});
