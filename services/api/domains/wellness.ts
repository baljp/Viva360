import type { DailyJournalEntry } from '../../../types';
import type { DomainRequest } from './common';

export type OracleCachedEntry = {
  drawId: string;
  drawnAt: string;
  moodContext: string;
  card: {
    id: string;
    name: string;
    insight: string;
    element: string;
    category: string;
  };
};

type WellnessDomainDeps = {
  request: DomainRequest;
  getOracleCache: () => OracleCachedEntry[];
  saveOracleCache: (entries: OracleCachedEntry[]) => void;
  isSameDay: (isoA: string, isoB: string) => boolean;
  buildOracleFallbackCard: (mood: string) => OracleCachedEntry['card'];
};

export const createWellnessDomain = ({
  request,
  getOracleCache,
  saveOracleCache,
  isSameDay,
  buildOracleFallbackCard,
}: WellnessDomainDeps) => ({
  oracle: {
    draw: async (mood: string) => {
      try {
        const response = await request('/oracle/draw', {
          method: 'POST',
          body: JSON.stringify({ mood }),
        });
        if (response?.card) {
          const entry: OracleCachedEntry = {
            drawId: response.drawId || `${Date.now()}`,
            drawnAt: response.drawnAt || new Date().toISOString(),
            moodContext: response.moodContext || mood || 'sereno',
            card: {
              id: response.card.id || `oracle_${Date.now()}`,
              name: response.card.name || 'Oráculo Viva360',
              insight: response.card.insight || response.card.message || 'Respire e siga seu centro.',
              element: response.card.element || 'Ar',
              category: response.card.category || 'consciencia',
            },
          };
          const history = getOracleCache();
          saveOracleCache([entry, ...history.filter((h) => h.drawId !== entry.drawId)]);
        }
        return response;
      } catch {
        const fallbackCard = buildOracleFallbackCard(mood || 'sereno');
        const fallback: OracleCachedEntry = {
          drawId: `${Date.now()}`,
          drawnAt: new Date().toISOString(),
          moodContext: mood || 'sereno',
          card: fallbackCard,
        };
        const history = getOracleCache();
        saveOracleCache([fallback, ...history]);
        return {
          drawId: fallback.drawId,
          drawnAt: fallback.drawnAt,
          moodContext: fallback.moodContext,
          card: fallback.card,
          source: 'offline-fallback',
        };
      }
    },

    getToday: async () => {
      try {
        const response = await request('/oracle/today');
        if (response?.card) {
          const entry: OracleCachedEntry = {
            drawId: `today-${Date.now()}`,
            drawnAt: new Date().toISOString(),
            moodContext: 'today',
            card: {
              id: response.card.id || `oracle_${Date.now()}`,
              name: response.card.name || 'Guia Diário',
              insight: response.card.insight || response.card.message || 'Respire e siga seu centro.',
              element: response.card.element || 'Ar',
              category: response.card.category || 'consciencia',
            },
          };
          const history = getOracleCache();
          saveOracleCache([entry, ...history]);
        }
        return response;
      } catch {
        const today = getOracleCache().find((entry) => isSameDay(entry.drawnAt, new Date().toISOString()));
        return today ? { card: today.card } : null;
      }
    },

    history: async () => {
      try {
        const response = await request('/oracle/history');
        if (Array.isArray(response) && response.length > 0) {
          const normalized = response.map((entry: any) => ({
            drawId: entry.drawId || entry.id || `${Date.now()}-${Math.random()}`,
            drawnAt: entry.drawnAt || entry.drawn_at || new Date().toISOString(),
            moodContext: entry.moodContext || entry.context?.mood || 'sereno',
            card: {
              id: entry.card?.id || entry.message_id || `oracle_${Date.now()}`,
              name: entry.card?.name || 'Oráculo Viva360',
              insight: entry.card?.insight || entry.card?.message || 'Respire e siga seu centro.',
              element: entry.card?.element || 'Ar',
              category: entry.card?.category || 'consciencia',
            },
          })) as OracleCachedEntry[];
          saveOracleCache(normalized);
        }
        return response;
      } catch {
        return getOracleCache().map((entry) => ({
          drawId: entry.drawId,
          drawnAt: entry.drawnAt,
          moodContext: entry.moodContext,
          card: entry.card,
        }));
      }
    },
  },

  rituals: {
    save: async (period: string, data: any) => {
      try {
        return await request('/rituals', {
          method: 'POST',
          body: JSON.stringify({ period, data }),
        });
      } catch {
        return true;
      }
    },
    get: async (period: string) => {
      try {
        return await request(`/rituals/${period}`);
      } catch {
        return [];
      }
    },
    toggle: async (period: string, id: string) => {
      try {
        return await request(`/rituals/${period}/${id}/toggle`, { method: 'POST' });
      } catch {
        return [];
      }
    },
  },

  metamorphosis: {
    checkIn: async (mood: string, hash: string, thumb: string) => {
      const response = await request('/metamorphosis/checkin', {
        method: 'POST',
        purpose: 'metamorphosis-checkin',
        timeoutMs: 6000,
        retries: 0,
        body: JSON.stringify({
          mood,
          photoHash: hash,
          photoThumb: thumb,
          hash,
          thumb,
        }),
      });
      return response?.entry || response;
    },
    getEvolution: async () => {
      try {
        return await request('/metamorphosis/evolution', {
          purpose: 'metamorphosis-evolution',
          timeoutMs: 7000,
          retries: 1,
        });
      } catch {
        return { entries: [] };
      }
    },
  },

  journal: {
    create: async (entry: Omit<DailyJournalEntry, 'id' | 'createdAt' | 'userId'>) => {
      try {
        return await request('/journal', {
          method: 'POST',
          body: JSON.stringify(entry),
        });
      } catch {
        return { ...entry, id: `jnl_${Date.now()}`, createdAt: new Date().toISOString() };
      }
    },
    list: async () => {
      try {
        return await request('/journal');
      } catch {
        return [];
      }
    },
    getStats: async () => {
      try {
        return await request('/journal/stats');
      } catch {
        return { totalEntries: 0, streak: 0, commonWords: [] };
      }
    },
  },

  clinical: {
    saveIntervention: async (data: any) => {
      try {
        return await request('/clinical/interventions', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {
        return { ...data, id: Date.now() };
      }
    },
    listInterventions: async () => {
      try {
        return await request('/clinical/interventions');
      } catch {
        return [];
      }
    },
  },

  audit: {
    listLogs: async () => {
      try {
        return await request('/audit/logs');
      } catch {
        return [];
      }
    },
  },
});
