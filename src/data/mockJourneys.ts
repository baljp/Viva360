/**
 * @deprecated ARQUIVO LEGADO — Use src/data/journeys.ts
 *
 * Mantido apenas para não quebrar imports durante a migração.
 * Todos os novos usos devem importar de '../journeys' ou 'src/data/journeys'.
 *
 * TODO: Remover este arquivo após migrar todos os imports.
 */
export type { MicroJourney } from './journeys';
export { JOURNEYS as MOCK_JOURNEYS, JOURNEYS } from './journeys';
