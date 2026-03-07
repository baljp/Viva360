import type { DailyRitualSnap, User } from '../../../types';
import { gardenService } from '../../../services/gardenService';

const moodLabelMap: Record<string, string> = {
  SERENO: 'Serenidade',
  VIBRANTE: 'Expansão',
  'MELANCÓLICO': 'Introspecção',
  ANSIOSO: 'Atenção',
  FOCADO: 'Foco',
  EXAUSTO: 'Recuperação',
  GRATO: 'Gratidão',
};

export type SoulJourneyModel = {
  stageLabel: string;
  stageGlyph: string;
  vitalityLabel: string;
  vitalityClassName: string;
  totalScore: number;
  dominantMood: string;
  entriesCount: number;
  streak: number;
  latestSnap: DailyRitualSnap | null;
  latestReflection: string;
  totalCards: number;
  journeyLabel: string;
  metrics: Array<{ label: string; value: string; helper: string }>;
};

const vitalityPresentation = (health: number) => {
  if (health >= 85) return { label: 'Radiante', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  if (health >= 60) return { label: 'Estável', className: 'bg-sky-50 text-sky-700 border-sky-100' };
  if (health >= 35) return { label: 'Pedindo cuidado', className: 'bg-amber-50 text-amber-700 border-amber-100' };
  return { label: 'Em recuperação', className: 'bg-rose-50 text-rose-700 border-rose-100' };
};

const dominantMoodLabel = (user: User) => {
  const top = gardenService.calculateEvolution(user).breakdown?.[0]?.label || '';
  if (!top) return 'Presença';
  return moodLabelMap[top.toUpperCase()] || top;
};

export const buildSoulJourneyModel = (user: User): SoulJourneyModel => {
  const latestSnap = (user.snaps || [])[0] || null;
  const evolution = gardenService.calculateEvolution(user);
  const plant = gardenService.getPlantVisuals(user.plantStage || 'seed', gardenService.getPlantStatus(user).status, user.plantType || 'oak');
  const vitality = vitalityPresentation(gardenService.getPlantStatus(user).health);
  const totalCards = Number(user.grimoireMeta?.totalCards || 0);
  const journeyLabel = user.journeyType
    ? user.journeyType.charAt(0).toUpperCase() + user.journeyType.slice(1)
    : gardenService.getPlantLabel(user.plantType || 'oak');

  return {
    stageLabel: `${plant.label} de ${gardenService.getPlantLabel(user.plantType || 'oak')}`,
    stageGlyph: plant.icon,
    vitalityLabel: vitality.label,
    vitalityClassName: vitality.className,
    totalScore: evolution.total,
    dominantMood: dominantMoodLabel(user),
    entriesCount: (user.snaps || []).length,
    streak: Number(user.streak || 0),
    latestSnap,
    latestReflection: latestSnap?.note || 'Cada registro revela um estado da sua alma e prepara o próximo ciclo.',
    totalCards,
    journeyLabel,
    metrics: [
      { label: 'Constância', value: `${Math.round(evolution.constancy)}%`, helper: `${user.streak || 0} dias em sequência` },
      { label: 'Ritual', value: `${Math.round(evolution.rituals)}%`, helper: `${(user.snaps || []).length} memórias registradas` },
      { label: 'Humor dominante', value: dominantMoodLabel(user), helper: 'estado mais recorrente' },
      { label: 'Grimório', value: `${totalCards}`, helper: 'cartas preservadas' },
    ],
  };
};
