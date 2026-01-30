import { User, PlantStage } from '../types';

export type GardenStatus = 'healthy' | 'thirsty' | 'withered' | 'glowing';

export interface EvolutionMetrics {
    constancy: number;      // 0-100
    positivity: number;     // 0-100
    rituals: number;        // 0-100
    tribe: number;          // 0-100
    curation: number;       // 0-100
    total: number;          // 0-100
}

export type TimeLayer = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

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
     * Calculates evolution metrics based on the formula:
     * Evolução = Constância (40%) + Emoção Positiva (20%) + Ritual Diário (20%) + Interações Tribais (10%) + Sessões de Cura (10%)
     */
    calculateEvolution: (user: User): EvolutionMetrics => {
        const constancy = Math.min(100, (user.streak || 0) * 5); // 20 days for 100%
        const rituals = Math.min(100, (user.ritualsCompleted || 0) * 2); // 50 rituals for 100%
        const tribe = Math.min(100, (user.tribeInteractions || 0) * 10);
        const curation = Math.min(100, (user.curationSessions || 0) * 15);
        
        // Positivity based on recent snaps mood
        const recentSnaps = user.snaps?.slice(-10) || [];
        const positiveMoods = ['happy', 'grateful', 'peaceful', 'excited', '😄', '😊', '😌', 'feliz', 'calmo', 'grato', 'motivado', 'vibrante', 'sereno', 'serena', 'focado', 'focada', 'grata'];
        const positivity = recentSnaps.length > 0
            ? (recentSnaps.filter(s => {
                const mood = String(s.mood || '').toLowerCase();
                return positiveMoods.some(pm => mood.includes(pm));
            }).length / recentSnaps.length) * 100
            : 50;

        const total = (constancy * 0.4) + (positivity * 0.2) + (rituals * 0.2) + (tribe * 0.1) + (curation * 0.1);

        return {
            constancy,
            positivity,
            rituals,
            tribe,
            curation,
            total: Math.floor(total)
        };
    },

    /**
     * Get state label based on evolution percentage
     */
    getEvolutionState: (progress: number) => {
        if (progress > 80) return { label: 'Florescendo', symbol: '🌳', trend: 'up' };
        if (progress > 50) return { label: 'Em Crescimento', symbol: '🌿', trend: 'up' };
        if (progress > 20) return { label: 'Semente Ativa', symbol: '🌱', trend: 'right' };
        return { label: 'Iniciando', symbol: '✨', trend: 'right' };
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
     * Calculates reward for completing a Micro-Journey
     */
    calculateMicroJourneyReward: (user: User) => {
        return {
            xp: 25,
            karma: 10,
            health: 10
        };
    },

    /**
     * Get visual properties for the current plant variety and stage
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

        // Color Logic
        let color = 'text-emerald-500';
        if (variety === 'lotus') color = 'text-rose-400';
        if (variety === 'orchid') color = 'text-fuchsia-500';
        if (variety === 'lavender') color = 'text-violet-400';
        if (variety === 'sunflower') color = 'text-amber-400';

        return { ...config, opacity, filter, color };
    },

    getPlantLabel: (variety: string): string => {
        const labels: Record<string, string> = {
            'oak': 'Carvalho',
            'lotus': 'Lótus',
            'sunflower': 'Girassol',
            'lavender': 'Lavanda',
            'orchid': 'Orquídea',
            'butterfly': 'Orquídea' // Legacy handling
        };
        return labels[variety] || variety;
    },

    getVarietyByJourney: (journey: string): string => {
        const mapping: Record<string, string> = {
            'emocional': 'lotus',
            'mental': 'sunflower',
            'forca': 'oak',
            'espiritual': 'lavender',
            'transforma': 'orchid'
        };
        return mapping[journey] || 'oak';
    }
};

