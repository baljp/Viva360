/**
 * TEST DATA — Soul Cards para ambiente de desenvolvimento/test
 *
 * ⚠️  NUNCA importar este arquivo em código de produção.
 * Uso permitido: testes, mocks, fixtures de QA.
 *
 * Para verificar o ambiente antes de importar:
 *   import.meta.env.VITE_MOCK_ENABLED === 'true'
 */
import type { SoulCard } from '../soulCards';

export const TEST_SOUL_CARDS_EXTRA: SoulCard[] = [
    { id: 'test-c1', archetype: '[TEST] Carta Demo', element: 'Éter', rarity: 'common', message: 'Mensagem de teste.', visualTheme: 'gray', xpReward: 0 },
    { id: 'test-l1', archetype: '[TEST] Lendária Demo', element: 'Luz', rarity: 'legendary', message: 'Carta lendária para teste de UI.', visualTheme: 'yellow', xpReward: 0 },
];
