/**
 * SOUL CARDS — Dados reais de cartas
 *
 * Este arquivo é a fonte de verdade em produção.
 * Em ambiente de test/mock, o conteúdo pode ser sobrescrito por
 * src/data/test/soulCards.test-data.ts via flag VITE_MOCK_ENABLED.
 *
 * Para adicionar novas cartas permanentes, edite aqui.
 * Para dados de demonstração, use src/data/test/soulCards.test-data.ts
 */

export interface SoulCard {
    id: string;
    archetype: string;
    element: 'Fogo' | 'Água' | 'Terra' | 'Ar' | 'Éter' | 'Luz' | 'Sombra';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    message: string;
    visualTheme: string;
    xpReward: number;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Cartas base da plataforma — disponíveis para todos os buscadores.
 * Substituído futuramente por API call GET /soul-cards
 */
export const SOUL_CARDS: SoulCard[] = [
    // --- COMUM (80%) ---
    { id: 'c1', archetype: 'O Aprendiz', element: 'Terra', rarity: 'common', message: 'Todo mestre já foi um iniciante que não desistiu.', visualTheme: 'emerald', xpReward: 10 },
    { id: 'c2', archetype: 'O Viajante', element: 'Ar', rarity: 'common', message: 'O caminho se faz ao caminhar.', visualTheme: 'indigo', xpReward: 10 },
    { id: 'c3', archetype: 'O Artesão', element: 'Fogo', rarity: 'common', message: 'Sua vida é sua obra de arte.', visualTheme: 'rose', xpReward: 10 },
    { id: 'c4', archetype: 'O Cuidador', element: 'Água', rarity: 'common', message: 'Cuidar de si é o primeiro passo para curar o mundo.', visualTheme: 'cyan', xpReward: 10 },
    // --- RARA (15%) ---
    { id: 'r1', archetype: 'O Guardião', element: 'Terra', rarity: 'rare', message: 'Sua força protege sem oprimir.', visualTheme: 'amber', xpReward: 30 },
    { id: 'r2', archetype: 'O Visionário', element: 'Éter', rarity: 'rare', message: 'Enxergue além do que os olhos alcançam.', visualTheme: 'purple', xpReward: 30 },
    // --- ÉPICA (4%) ---
    { id: 'e1', archetype: 'O Alquimista', element: 'Fogo', rarity: 'epic', message: 'Transforme o chumbo da dor em ouro da sabedoria.', visualTheme: 'orange', xpReward: 75 },
    // --- LENDÁRIA (1%) ---
    { id: 'l1', archetype: 'O Mestre dos Mestres', element: 'Luz', rarity: 'legendary', message: 'A iluminação não é um destino, mas uma forma de caminhar.', visualTheme: 'yellow', xpReward: 200 },
];

/** @deprecated Use SOUL_CARDS. Este alias garante compatibilidade com código legado durante a migração. */
export const MOCK_SOUL_CARDS = SOUL_CARDS;
