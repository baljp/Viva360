/**
 * @deprecated ARQUIVO LEGADO — Use src/data/soulCards.ts
 *
 * Mantido apenas para não quebrar imports durante a migração.
 * Todos os novos usos devem importar de '../soulCards' ou 'src/data/soulCards'.
 *
 * TODO: Remover este arquivo após migrar todos os imports.
 */
export type { SoulCard } from './soulCards';
export { SOUL_CARDS as MOCK_SOUL_CARDS, SOUL_CARDS } from './soulCards';
