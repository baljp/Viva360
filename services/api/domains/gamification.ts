import type { Achievement, DailyQuest } from '../../../types';
import type { DomainRequest } from './common';
import { captureFrontendError } from '../../../lib/frontendLogger';

export type GamificationStateResponse = {
  dateKey: string;
  dailyQuests: DailyQuest[];
  achievements: Achievement[];
  grimoireMeta: {
    totalCards: number;
    source: 'oracle_history';
    lastSyncedAt: string | null;
  };
  source: 'interaction_receipts';
};

export type GamificationLeaderboardEntry = {
  userId: string;
  name: string;
  avatar?: string | null;
  karma: number;
  rankLevel: number;
  rankName: string;
};

export type GamificationLeaderboardResponse = {
  me: {
    userId: string;
    karma: number;
    rankLevel: number;
    rankName: string;
    rankPosition: number | null;
    challenges: {
      total: number;
      completed: number;
      items: Array<{ id: string; label: string; completed: boolean; reward: number }>;
    };
  };
  leaderboard: GamificationLeaderboardEntry[];
};


export type KarmaHistoryItem = {
  id: string;
  action: string;
  amount: number;
  date: string;
  type: 'earn' | 'spend';
};

export type KarmaHistoryResponse = {
  transactions: KarmaHistoryItem[];
};

type GamificationDomainDeps = {
  request: DomainRequest;
};

export const createGamificationDomain = ({ request }: GamificationDomainDeps) => ({
  gamification: {
    getState: async (dateKey?: string): Promise<GamificationStateResponse | null> => {
      try {
        const query = dateKey ? `?dateKey=${encodeURIComponent(dateKey)}` : '';
        return await request(`/gamification/state${query}`, {
          purpose: 'gamification-state',
          timeoutMs: 7000,
          retries: 1,
        });
      } catch (err) {
        captureFrontendError(err, { domain: 'gamification', op: 'getState' });
        return null;
      }
    },
    getLeaderboard: async (): Promise<GamificationLeaderboardResponse | null> => {
      try {
        return await request('/gamification/leaderboard', {
          purpose: 'gamification-leaderboard',
          timeoutMs: 7000,
          retries: 1,
        });
      } catch (err) {
        captureFrontendError(err, { domain: 'gamification', op: 'getLeaderboard' });
        return null;
      }
    },
    completeQuest: async (quest: DailyQuest, dateKey?: string) => {
      return await request<{ ok: boolean; receiptId: string; state: GamificationStateResponse }>(
        `/gamification/quests/${encodeURIComponent(quest.id)}/complete`,
        {
          method: 'POST',
          purpose: 'gamification-quest-complete',
          timeoutMs: 7000,
          retries: 0,
          body: JSON.stringify({
            id: quest.id,
            label: quest.label,
            description: quest.description,
            reward: quest.reward,
            type: quest.type,
            dateKey,
          }),
        },
      );
    },
    syncAchievements: async (achievements: Achievement[]) => {
      return await request<{ ok: boolean; state: GamificationStateResponse }>(
        '/gamification/achievements/sync',
        {
          method: 'POST',
          purpose: 'gamification-achievements-sync',
          timeoutMs: 7000,
          retries: 0,
          body: JSON.stringify({ achievements }),
        },
      );
    },
    getKarmaHistory: async (limit = 30): Promise<KarmaHistoryResponse> => {
      try {
        const data = await request<KarmaHistoryResponse>(
          `/gamification/history?limit=${limit}`,
          {
            purpose: 'gamification-karma-history',
            timeoutMs: 7000,
            retries: 1,
          },
        );
        return data ?? { transactions: [] };
      } catch (err) {
        captureFrontendError(err, { domain: 'gamification', op: 'getKarmaHistory' });
        return { transactions: [] };
      }
    },
  },
});
