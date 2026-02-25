import { useState, useEffect } from 'react';
import { SoulCard } from '../data/mockSoulCards';
import { SoulCardEngine } from '../engines/SoulCardEngine';
import { api } from '../../services/api';

const LS_COLLECTION = (uid: string) => `viva360_cards_${uid}`;
const LS_LAST_DRAW  = (uid: string) => `viva360_last_draw_${uid}`;

export const useSoulCards = (userId: string) => {
    const [collection, setCollection] = useState<SoulCard[]>([]);
    const [lastDraw, setLastDraw] = useState<string | null>(null);
    const [collectionLoading, setCollectionLoading] = useState(true);

    // ✅ Carrega coleção: backend primeiro, localStorage como fallback offline
    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        (async () => {
            try {
                const backendCards = await api.soulCards.getCollection();
                if (!cancelled && backendCards.length > 0) {
                    const mapped: SoulCard[] = backendCards.map((c) => ({
                        id:          c.id,
                        archetype:   c.archetype,
                        element:     c.element as SoulCard['element'],
                        rarity:      c.rarity as SoulCard['rarity'],
                        message:     c.message,
                        visualTheme: c.visualTheme,
                        xpReward:    c.xpReward,
                        createdAt:   c.createdAt,
                    }));
                    setCollection(mapped);
                    // Sincroniza localStorage com o estado do backend
                    localStorage.setItem(LS_COLLECTION(userId), JSON.stringify(mapped));
                } else {
                    // Backend retornou vazio: tenta localStorage (modo offline)
                    const saved = localStorage.getItem(LS_COLLECTION(userId));
                    if (!cancelled && saved) setCollection(JSON.parse(saved));
                }
            } catch {
                // Rede indisponível — usa localStorage como fallback
                const saved = localStorage.getItem(LS_COLLECTION(userId));
                if (!cancelled && saved) setCollection(JSON.parse(saved));
            } finally {
                if (!cancelled) setCollectionLoading(false);
            }
        })();

        // Carrega lastDraw do localStorage (não crítico para backend)
        const savedDate = localStorage.getItem(LS_LAST_DRAW(userId));
        if (savedDate) setLastDraw(savedDate);

        return () => { cancelled = true; };
    }, [userId]);

    const performDraw = async (streak: number, mood: string): Promise<SoulCard> => {
        const card = SoulCardEngine.drawCard(streak, mood);

        const newCollection = [...collection, card];
        setCollection(newCollection);

        const now = new Date().toISOString();
        setLastDraw(now);

        // 1. Persiste no localStorage (imediato, funciona offline)
        localStorage.setItem(LS_COLLECTION(userId), JSON.stringify(newCollection));
        localStorage.setItem(LS_LAST_DRAW(userId), now);

        // 2. ✅ Persiste no backend (async, falha silenciosa)
        api.soulCards.draw(card).catch(() => {
            // Backend indisponível: localStorage já garantiu a persistência
        });

        return card;
    };

    return { collection, lastDraw, performDraw, collectionLoading };
};
