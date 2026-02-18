import { parseSafe, hashString } from './session';

export const ORACLE_HISTORY_KEY = 'viva360.oracle.history';
const ORACLE_MAX_CACHE = 40;

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

export const getOracleCache = (): OracleCachedEntry[] =>
  parseSafe<OracleCachedEntry[]>(localStorage.getItem(ORACLE_HISTORY_KEY)) || [];

export const saveOracleCache = (entries: OracleCachedEntry[]) => {
  localStorage.setItem(ORACLE_HISTORY_KEY, JSON.stringify(entries.slice(0, ORACLE_MAX_CACHE)));
};

export const isSameDay = (isoA: string, isoB: string) => {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

export const buildOracleFallbackCard = (mood: string) => {
  const deck = [
    { name: 'Respiração da Aurora', insight: 'Hoje, menos pressa revela mais direção.', element: 'Ar', category: 'consciencia' },
    { name: 'Raiz Serena', insight: 'Sua estabilidade cresce quando você honra o presente.', element: 'Terra', category: 'cura_emocional' },
    { name: 'Chama Gentil', insight: 'Ação pequena e consistente vence o excesso de força.', element: 'Fogo', category: 'acao_foco' },
    { name: 'Mar Interno', insight: 'Sentir também é avançar. Escute o que acalma.', element: 'Agua', category: 'cura_emocional' },
  ];
  const seed = hashString(`${mood}:${new Date().toISOString().slice(0, 10)}`);
  const idx = parseInt(seed.slice(0, 2), 16) % deck.length;
  return { id: `oracle_${seed.slice(0, 10)}`, ...deck[idx] };
};

