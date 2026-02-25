import type { TimeLapseEntry } from './timeLapseTypes';

type EvolutionResponse = {
  entries?: Array<Partial<TimeLapseEntry> & { timestamp?: string; date?: string; photoThumb?: string; image?: string }>;
};

export const normalizeTimeLapseEntries = (data: EvolutionResponse): TimeLapseEntry[] => {
  const list = Array.isArray(data.entries) ? data.entries : [];
  return [...list]
    .map((entry) => ({
      ...entry,
      timestamp: String(entry.timestamp || entry.date || new Date().toISOString()),
      photoThumb: String(entry.photoThumb || entry.image || ''),
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) as TimeLapseEntry[];
};
