import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';

// Shared type definition for consistency
export interface OracleMessage {
    id: string;
    text: string;
    name: string;
    category: string;
    element: string;
    depth: number;
}

export const useOracle = (userId: string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [dailyCard, setDailyCard] = useState<OracleMessage | null>(null);
    const [showCard, setShowCard] = useState(false);
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);

    // Check for daily card on mount or user change
    useEffect(() => {
        if (!userId) return;
        
        // Potential optimization: check if already loaded in context or local cache
        const fetchDaily = async () => {
            try {
                const res = await api.oracle.getToday();
                if (res && res.card) {
                    const card: OracleMessage = {
                        id: 'today',
                        text: res.card.insight,
                        name: res.card.name || "Iniciação",
                        category: "inspiração",
                        element: res.card.element,
                        depth: 2
                    };
                    setDailyCard(card);
                }
            } catch (e) {
                console.error("Failed to load daily card", e);
            }
        };

        fetchDaily();
    }, [userId]);

    const handleDraw = useCallback(async () => {
        setIsLoading(true);
        setToast(null); 
        try {
            const res = await api.oracle.draw('sereno');
            
            if (!res || !res.card) throw new Error("Deck vazio");

            const newCard: OracleMessage = {
                id: Date.now().toString(),
                text: res.card.insight || "O silêncio também é uma resposta.",
                name: res.card.name || "Revelação",
                category: "inspiração",
                element: res.card.element || "ether",
                depth: Math.floor(Math.random() * 3) + 1
            };
            
            setDailyCard(newCard);
            setShowCard(true);
        } catch (e) {
            console.error("Oracle Draw Error:", e);
            setToast({ 
                title: "Interferência Mística", 
                message: "A conexão com o oráculo oscilou. Respire e tente novamente." 
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const closeCard = useCallback(() => setShowCard(false), []);
    const clearToast = useCallback(() => setToast(null), []);

    return {
        state: {
            isLoading,
            dailyCard,
            showCard,
            toast
        },
        actions: {
            handleDraw,
            setShowCard,
            closeCard,
            clearToast
        }
    };
};
