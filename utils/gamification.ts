import { Achievement, User } from '../types';

// ═══════════════════════════════════════════════
// ACHIEVEMENT DEFINITIONS - Buscador
// ═══════════════════════════════════════════════
export const CLIENT_ACHIEVEMENTS: Achievement[] = [
  { id: 'streak_3', label: 'Despertar', description: '3 dias consecutivos', icon: '🌅', category: 'streak', threshold: 3 },
  { id: 'streak_7', label: 'Constância', description: '7 dias consecutivos', icon: '🔥', category: 'streak', threshold: 7 },
  { id: 'streak_21', label: 'Hábito Sagrado', description: '21 dias consecutivos', icon: '⚡', category: 'streak', threshold: 21 },
  { id: 'streak_60', label: 'Iluminação', description: '60 dias consecutivos', icon: '✨', category: 'streak', threshold: 60 },
  { id: 'karma_100', label: 'Primeira Centelha', description: 'Acumule 100 Karma', icon: '💫', category: 'karma', threshold: 100 },
  { id: 'karma_500', label: 'Guardião Interior', description: 'Acumule 500 Karma', icon: '🌟', category: 'karma', threshold: 500 },
  { id: 'karma_1000', label: 'Alma Radiante', description: 'Acumule 1000 Karma', icon: '👑', category: 'karma', threshold: 1000 },
  { id: 'rituals_10', label: 'Jardineiro', description: '10 rituais completos', icon: '🌱', category: 'ritual', threshold: 10 },
  { id: 'rituals_50', label: 'Mestre do Jardim', description: '50 rituais completos', icon: '🌳', category: 'ritual', threshold: 50 },
  { id: 'tribe_5', label: 'Conectado', description: '5 interações na tribo', icon: '🤝', category: 'social', threshold: 5 },
  { id: 'tribe_25', label: 'Pilar da Tribo', description: '25 interações na tribo', icon: '🏛️', category: 'social', threshold: 25 },
];

// ═══════════════════════════════════════════════
// ACHIEVEMENT DEFINITIONS - Guardião (Pro)
// ═══════════════════════════════════════════════
export const PRO_ACHIEVEMENTS: Achievement[] = [
  { id: 'sessions_10', label: 'Primeiro Ciclo', description: '10 sessões realizadas', icon: '🎯', category: 'mastery', threshold: 10 },
  { id: 'sessions_50', label: 'Curador Dedicado', description: '50 sessões realizadas', icon: '💎', category: 'mastery', threshold: 50 },
  { id: 'sessions_100', label: 'Mestre Curador', description: '100 sessões realizadas', icon: '🏆', category: 'mastery', threshold: 100 },
  { id: 'karma_200', label: 'Energia Fluindo', description: '200 Karma acumulados', icon: '⚡', category: 'karma', threshold: 200 },
  { id: 'karma_1000', label: 'Farol da Egrégora', description: '1000 Karma acumulados', icon: '🌟', category: 'karma', threshold: 1000 },
  { id: 'escambo_3', label: 'Trocador', description: '3 escambos realizados', icon: '🔄', category: 'social', threshold: 3 },
  { id: 'escambo_10', label: 'Alquimista', description: '10 escambos realizados', icon: '⚗️', category: 'social', threshold: 10 },
  { id: 'streak_14', label: 'Presença Constante', description: '14 dias seguidos ativo', icon: '🔥', category: 'streak', threshold: 14 },
  { id: 'streak_30', label: 'Guardião Inabalável', description: '30 dias seguidos ativo', icon: '🛡️', category: 'streak', threshold: 30 },
];

// ═══════════════════════════════════════════════
// ACHIEVEMENT DEFINITIONS - Santuário (Space)
// ═══════════════════════════════════════════════
export const SPACE_ACHIEVEMENTS: Achievement[] = [
  { id: 'nps_80', label: 'Bem Avaliado', description: 'NPS acima de 80', icon: '⭐', category: 'mastery', threshold: 80 },
  { id: 'nps_95', label: 'Excelência', description: 'NPS acima de 95', icon: '🌟', category: 'mastery', threshold: 95 },
  { id: 'pros_5', label: 'Equipe Formada', description: '5 guardiões ativos', icon: '👥', category: 'social', threshold: 5 },
  { id: 'pros_15', label: 'Templo Pleno', description: '15 guardiões ativos', icon: '🏛️', category: 'social', threshold: 15 },
  { id: 'sessions_100', label: 'Centena Sagrada', description: '100 sessões no espaço', icon: '💯', category: 'mastery', threshold: 100 },
  { id: 'sessions_500', label: 'Templo de Cura', description: '500 sessões no espaço', icon: '🏆', category: 'mastery', threshold: 500 },
  { id: 'karma_5000', label: 'Santuário Radiante', description: '5000 Karma coletivo', icon: '✨', category: 'karma', threshold: 5000 },
];

// ═══════════════════════════════════════════════
// RANK / TITLE SYSTEM
// ═══════════════════════════════════════════════
export const CLIENT_RANKS = [
  { level: 1, name: 'Semente', min: 0, max: 100, color: 'text-nature-500', bg: 'bg-nature-50' },
  { level: 2, name: 'Raíz', min: 101, max: 500, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { level: 3, name: 'Broto', min: 501, max: 1000, color: 'text-teal-600', bg: 'bg-teal-50' },
  { level: 4, name: 'Flor', min: 1001, max: 2500, color: 'text-amber-600', bg: 'bg-amber-50' },
  { level: 5, name: 'Fruto', min: 2501, max: 5000, color: 'text-purple-600', bg: 'bg-purple-50' },
  { level: 6, name: 'Árvore Mestre', min: 5001, max: Infinity, color: 'text-amber-700', bg: 'bg-amber-100' },
];

export const PRO_RANKS = [
  { level: 1, name: 'Aprendiz', min: 0, max: 100, color: 'text-nature-500', bg: 'bg-nature-50' },
  { level: 2, name: 'Terapeuta', min: 101, max: 500, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { level: 3, name: 'Curador', min: 501, max: 1500, color: 'text-purple-600', bg: 'bg-purple-50' },
  { level: 4, name: 'Guardião', min: 1501, max: 3000, color: 'text-amber-600', bg: 'bg-amber-50' },
  { level: 5, name: 'Mestre Guardião', min: 3001, max: Infinity, color: 'text-amber-700', bg: 'bg-amber-100' },
];

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
export function getUserRank(karma: number, ranks: typeof CLIENT_RANKS) {
  return ranks.find(r => karma >= r.min && karma <= r.max) || ranks[ranks.length - 1];
}

export function getNextRank(karma: number, ranks: typeof CLIENT_RANKS) {
  const current = getUserRank(karma, ranks);
  return ranks.find(r => r.level === current.level + 1) || null;
}

export function getRankProgress(karma: number, ranks: typeof CLIENT_RANKS): number {
  const current = getUserRank(karma, ranks);
  const next = getNextRank(karma, ranks);
  if (!next) return 100;
  return Math.round(((karma - current.min) / (next.min - current.min)) * 100);
}

export function checkAchievements(user: User, definitions: Achievement[]): Achievement[] {
  const metrics: Record<string, number> = {
    streak: user.streak || 0,
    karma: user.karma || 0,
    ritual: user.ritualsCompleted || 0,
    social: user.tribeInteractions || 0,
    mastery: user.curationSessions || 0,
  };

  return definitions.map(a => {
    const metricVal = metrics[a.category] || 0;
    const unlocked = metricVal >= a.threshold;
    return {
      ...a,
      unlockedAt: unlocked ? (user.achievements?.find(ua => ua.id === a.id)?.unlockedAt || new Date().toISOString()) : undefined,
    };
  });
}

export function getUnlockedCount(achievements: Achievement[]): number {
  return achievements.filter(a => a.unlockedAt).length;
}
