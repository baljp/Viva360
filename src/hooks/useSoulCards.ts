import { useState, useEffect } from 'react';
import { SoulCard } from '../data/mockSoulCards';
import { SoulCardEngine } from '../engines/SoulCardEngine';

export const useSoulCards = (userId: string) => {
    const [collection, setCollection] = useState<SoulCard[]>([]);
    const [lastDraw, setLastDraw] = useState<string | null>(null);

    // Mock persistence
    useEffect(() => {
        const saved = localStorage.getItem(`viva360_cards_${userId}`);
        const savedDate = localStorage.getItem(`viva360_last_draw_${userId}`);
        if (saved) setCollection(JSON.parse(saved));
        if (savedDate) setLastDraw(savedDate);
    }, [userId]);

    const performDraw = (streak: number, mood: string): SoulCard => {
        const card = SoulCardEngine.drawCard(streak, mood);
        
        const newCollection = [...collection, card];
        setCollection(newCollection);
        setLastDraw(new Date().toISOString());

        // Persist
        localStorage.setItem(`viva360_cards_${userId}`, JSON.stringify(newCollection));
        localStorage.setItem(`viva360_last_draw_${userId}`, new Date().toISOString());

        return card;
    };

    return { collection, lastDraw, performDraw };
};
