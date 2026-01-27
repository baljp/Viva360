import { User, PlantStage } from '../types';

export type GardenStatus = 'healthy' | 'thirsty' | 'withered' | 'glowing';

export const gardenService = {
    /**
     * Calculates the current status and health of the user's plant
     * based on time since last watering.
     */
    getPlantStatus: (user: User): { status: GardenStatus; health: number; recoveryNeeded: boolean } => {
        const lastWatered = user.lastWateredAt ? new Date(user.lastWateredAt).getTime() : 0;
        const now = Date.now();
        const hoursSinceWatered = (now - lastWatered) / (1000 * 60 * 60);

        let health = user.plantHealth ?? 100;
        let status: GardenStatus = 'healthy';

        // Degradation logic: -5 health per hour after 24 hours of no water
        if (hoursSinceWatered > 24) {
            const overtime = hoursSinceWatered - 24;
            health -= Math.floor(overtime * 2); // 2 points per hour
        }

        // Social bonus: +5 health for each friend who watered (max 20)
        const socialBonus = (user.wateredBy?.length || 0) * 5;
        health = Math.min(100, health + socialBonus);

        if (user.lastBlessingAt) {
            const lastBlessing = new Date(user.lastBlessingAt).getTime();
            if (now - lastBlessing < 12 * 60 * 60 * 1000) { // 12h glow
                status = 'glowing';
            }
        }

        if (status !== 'glowing') {
            if (health > 70) status = 'healthy';
            else if (health > 30) status = 'thirsty';
            else status = 'withered';
        }

        return {
            status,
            health: Math.max(0, health),
            recoveryNeeded: health <= 0
        };
    },

    /**
     * Calculates growth XP based on watering action
     */
    calculateWateringReward: (user: User) => {
        const streakMultiplier = Math.min(2, 1 + (user.streak / 10));
        return {
            xp: Math.floor(10 * streakMultiplier),
            karma: 5
        };
    },

    /**
     * Get visual properties for the current plant plant variety and stage
     */
    getPlantVisuals: (stage: PlantStage, status: GardenStatus, variety: string = 'oak') => {
        const visuals: Record<PlantStage, any> = {
            seed: { icon: '🌱', size: '2rem', label: 'Semente' },
            sprout: { icon: '🌿', size: '4rem', label: 'Broto' },
            bud: { icon: '🎋', size: '6rem', label: 'Botão' },
            flower: { icon: '🌸', size: '8rem', label: 'Flor' },
            tree: { icon: '🌳', size: '10rem', label: 'Árvore' },
            withered: { icon: '🍂', size: '5rem', label: 'Seca' }
        };

        const config = visuals[stage] || visuals.seed;
        
        const opacity = status === 'withered' ? '0.4' : status === 'thirsty' ? '0.7' : '1';
        const filter = status === 'glowing' ? 'drop-shadow(0 0 15px #10b981)' : 'none';

        return { ...config, opacity, filter, color: variety === 'lotus' ? 'text-rose-400' : 'text-emerald-500' };
    },

    getVarietyByJourney: (journey: string): string => {
        const mapping: Record<string, string> = {
            'emocional': 'lotus',
            'mental': 'sunflower',
            'forca': 'oak',
            'espiritual': 'lavender',
            'transforma': 'butterfly'
        };
        return mapping[journey] || 'oak';
    }
};
