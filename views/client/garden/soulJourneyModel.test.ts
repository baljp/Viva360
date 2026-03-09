import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/gardenService', () => ({
  gardenService: {
    calculateEvolution: vi.fn().mockReturnValue({
      total: 75,
      constancy: 80,
      rituals: 60,
      breakdown: [{ label: 'SERENO', count: 5 }],
    }),
    getPlantVisuals: vi.fn().mockReturnValue({ label: 'Broto', icon: '🌱' }),
    getPlantStatus: vi.fn().mockReturnValue({ status: 'healthy', health: 90, recoveryNeeded: false }),
    getPlantLabel: vi.fn().mockReturnValue('Carvalho'),
  },
}));

import { buildSoulJourneyModel } from './soulJourneyModel';
import type { User } from '../../../types';

const mockUser: User = {
  id: 'user-1',
  name: 'João',
  email: 'joao@test.com',
  role: 'CLIENT',
  activeRole: 'CLIENT',
  karma: 100,
  streak: 5,
  plantStage: 'sprout',
  plantType: 'oak',
  snaps: [
    { id: 'snap-1', date: '2026-03-01', image: 'thumb.jpg', mood: 'SERENO', note: 'Paz interior' },
  ],
  grimoireMeta: { totalCards: 3 },
} as User;

describe('buildSoulJourneyModel', () => {
  it('returns correct stage and vitality for healthy plant', () => {
    const model = buildSoulJourneyModel(mockUser);
    expect(model.stageLabel).toContain('Broto');
    expect(model.vitalityLabel).toBe('Radiante');
    expect(model.vitalityClassName).toContain('emerald');
  });

  it('extracts latest snap and reflection', () => {
    const model = buildSoulJourneyModel(mockUser);
    expect(model.latestSnap?.id).toBe('snap-1');
    expect(model.latestReflection).toBe('Paz interior');
  });

  it('calculates metrics correctly', () => {
    const model = buildSoulJourneyModel(mockUser);
    expect(model.totalScore).toBe(75);
    expect(model.streak).toBe(5);
    expect(model.entriesCount).toBe(1);
    expect(model.totalCards).toBe(3);
    expect(model.dominantMood).toBe('Serenidade');
  });

  it('returns 4 metrics with correct structure', () => {
    const model = buildSoulJourneyModel(mockUser);
    expect(model.metrics).toHaveLength(4);
    model.metrics.forEach(m => {
      expect(m).toHaveProperty('label');
      expect(m).toHaveProperty('value');
      expect(m).toHaveProperty('helper');
    });
  });

  it('handles user without snaps gracefully', () => {
    const noSnapsUser = { ...mockUser, snaps: [], streak: 0 };
    const model = buildSoulJourneyModel(noSnapsUser);
    expect(model.latestSnap).toBeNull();
    expect(model.entriesCount).toBe(0);
    expect(model.latestReflection).toContain('Cada registro');
  });

  it('handles user without grimoireMeta', () => {
    const noGrimoire = { ...mockUser, grimoireMeta: undefined };
    const model = buildSoulJourneyModel(noGrimoire as User);
    expect(model.totalCards).toBe(0);
  });

  it('uses journeyType if available', () => {
    const withJourney = { ...mockUser, journeyType: 'warrior' };
    const model = buildSoulJourneyModel(withJourney as User);
    expect(model.journeyLabel).toBe('Warrior');
  });
});
