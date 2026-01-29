export interface SoulCard {
    id: string;
    archetype: string;
    element: 'Fogo' | 'Água' | 'Terra' | 'Ar' | 'Éter' | 'Luz' | 'Sombra';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    message: string;
    visualTheme: string; // CSS class or color code
    xpReward: number;
}

export const MOCK_SOUL_CARDS: SoulCard[] = [
    // --- COMUM (80%) ---
    { id: 'c1', archetype: 'O Aprendiz', element: 'Terra', rarity: 'common', message: 'Todo mestre já foi um iniciante que não desistiu.', visualTheme: 'emerald', xpReward: 10 },
    { id: 'c2', archetype: 'O Viajante', element: 'Ar', rarity: 'common', message: 'O caminho se faz ao caminhar.', visualTheme: 'indigo', xpReward: 10 },
    { id: 'c3', archetype: 'O Artesão', element: 'Fogo', rarity: 'common', message: 'Sua vida é sua obra de arte.', visualTheme: 'rose', xpReward: 10 },
    { id: 'c4', archetype: 'O Cuidador', element: 'Água', rarity: 'common', message: 'Cuidar de si é o primeiro passo para curar o mundo.', visualTheme: 'cyan', xpReward: 10 },

    // --- RARA (15%) ---
    { id: 'r1', archetype: 'O Guerreiro da Luz', element: 'Fogo', rarity: 'rare', message: 'Sua coragem ilumina as sombras.', visualTheme: 'amber', xpReward: 50 },
    { id: 'r2', archetype: 'A Tecelã do Destino', element: 'Éter', rarity: 'rare', message: 'Você entrelaça o tempo com suas escolhas.', visualTheme: 'violet', xpReward: 50 },
    { id: 'r3', archetype: 'O Guardião do Silêncio', element: 'Ar', rarity: 'rare', message: 'No silêncio, a verdade fala.', visualTheme: 'slate', xpReward: 50 },

    // --- ÉPICA (4%) ---
    { id: 'e1', archetype: 'A Fênix Renascida', element: 'Fogo', rarity: 'epic', message: 'Do que queimou, nasceu o ouro.', visualTheme: 'orange', xpReward: 200 },
    { id: 'e2', archetype: 'O Oráculo Interior', element: 'Luz', rarity: 'epic', message: 'Você já sabe a resposta. Escute.', visualTheme: 'yellow', xpReward: 200 },

    // --- LENDÁRIA (1%) ---
    { id: 'l1', archetype: 'Avatar da Consciência', element: 'Luz', rarity: 'legendary', message: 'Você é o universo observando a si mesmo.', visualTheme: 'white', xpReward: 1000 },
    { id: 'l2', archetype: 'Mestre do Tempo', element: 'Éter', rarity: 'legendary', message: 'O agora é o único tempo que existe.', visualTheme: 'fuchsia', xpReward: 1000 },
];
