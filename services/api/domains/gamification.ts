import type { Achievement, DailyQuest } from '../../../types';
import type { DomainRequest } from './common';

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
        console.error('[gamification.getState]', err);
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
  },
});

