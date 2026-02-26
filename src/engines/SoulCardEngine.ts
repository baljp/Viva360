import { SOUL_CARDS, SoulCard } from '../data/soulCards';

export class SoulCardEngine {
    
    static drawCard(streak: number, mood: string): SoulCard {
        // Base Probabilities
        let pCommon = 80;
        let pRare = 15;
        let pEpic = 4;
        let pLegendary = 1;

        // Modifiers based on Streak
        if (streak > 7) { pCommon -= 5; pRare += 5; }
        if (streak > 30) { pCommon -= 5; pEpic += 4; pLegendary += 1; }
        if (streak > 100) { pCommon -= 10; pRare -= 5; pEpic += 10; pLegendary += 5; }

        // Determine Rarity
        const roll = Math.random() * 100;
        let selectedRarity: SoulCard['rarity'] = 'common';

        if (roll < pLegendary) selectedRarity = 'legendary';
        else if (roll < pLegendary + pEpic) selectedRarity = 'epic';
        else if (roll < pLegendary + pEpic + pRare) selectedRarity = 'rare';
        else selectedRarity = 'common';

        // Filter and Pick
        const pool = SOUL_CARDS.filter(c => c.rarity === selectedRarity);
        const card = pool[Math.floor(Math.random() * pool.length)];

        // Fallback
        return card || SOUL_CARDS[0];
    }
}
