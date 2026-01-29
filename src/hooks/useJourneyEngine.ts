import { useState, useMemo, useEffect } from 'react';
import { User } from '../../types';
import { MOCK_JOURNEYS, MicroJourney } from '../data/mockJourneys';

interface JourneySuggestion {
    hero: {
        title: string;
        description: string;
        mood: string;
        primaryAction: string;
    };
    morning: MicroJourney;
    day: MicroJourney;
    night: MicroJourney;
}

export const useJourneyEngine = (user: User) => {
    // 1. Determine "Mood of the Day"
    // In a real app, this would come from a Daily Check-in.
    // Here we simulate or use user.karma as a seed component.
    
    const context = useMemo(() => {
        const hour = new Date().getHours();
        const isMorning = hour >= 5 && hour < 12;
        const isNight = hour >= 18 || hour < 5;
        const seed = (user.id || 'guest').charCodeAt(0) + new Date().getDate(); // Simple daily hash
        
        return { isMorning, isNight, seed };
    }, [user.id]);

    const journey = useMemo<JourneySuggestion | null>(() => {
        // RNG based on seed
        const pseudoRandom = (offset: number) => {
             const x = Math.sin(context.seed + offset) * 10000;
             return x - Math.floor(x);
        };

        // Select Journeys
        const corpoDetails = MOCK_JOURNEYS.filter(j => j.category === 'Corpo');
        const menteDetails = MOCK_JOURNEYS.filter(j => j.category === 'Mente');
        const espiritoDetails = MOCK_JOURNEYS.filter(j => j.category === 'Espírito');

        const morningJ = corpoDetails[Math.floor(pseudoRandom(1) * corpoDetails.length)];
        const dayJ = menteDetails[Math.floor(pseudoRandom(2) * menteDetails.length)];
        const nightJ = espiritoDetails[Math.floor(pseudoRandom(3) * espiritoDetails.length)];

        // Hero Content
        const themes = [
            { title: 'Aterramento & Presença', desc: 'Hoje, o universo pede que você firme seus pés no chão.', action: 'Iniciar Aterramento' },
            { title: 'Fluidez & Água', desc: 'Deixe as emoções fluírem como um rio calmo.', action: 'Liberar Emoções' },
            { title: 'Fogo & Ação', desc: 'Use a energia vital para transformar sonhos em realidade.', action: 'Ativar Poder' },
            { title: 'Ar & Clareza', desc: 'Respire fundo. A clareza vem no silêncio.', action: 'Respirar Agora' }
        ];
        
        const theme = themes[Math.floor(pseudoRandom(4) * themes.length)];

        return {
            hero: {
                title: theme.title,
                description: theme.desc,
                mood: 'Sereno', // Dynamic placeholder
                primaryAction: theme.action
            },
            morning: morningJ,
            day: dayJ,
            night: nightJ
        };
    }, [context.seed]);

    return { journey, context };
};
