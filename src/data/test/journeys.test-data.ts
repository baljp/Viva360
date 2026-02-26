/**
 * TEST DATA — Micro Journeys para ambiente de desenvolvimento/test
 *
 * ⚠️  NUNCA importar este arquivo em código de produção.
 */
import type { MicroJourney } from '../journeys';

export const TEST_JOURNEYS_EXTRA: MicroJourney[] = [
    { id: 'test-j-1', title: '[TEST] Jornada Demo', category: 'Corpo', duration: 1, moods: ['teste'], description: 'Jornada de demonstração para QA.', xp: 0 },
];
