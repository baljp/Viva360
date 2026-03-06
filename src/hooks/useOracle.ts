import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAppToast } from '../contexts/AppToastContext';
import { captureFrontendError } from '../../lib/frontendLogger';

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
    const { showToast, clearToast } = useAppToast();
    const [isLoading, setIsLoading] = useState(false);
    const [dailyCard, setDailyCard] = useState<OracleMessage | null>(null);
    const [showCard, setShowCard] = useState(false);

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
                captureFrontendError(e, { domain: 'oracle', op: 'loadDailyCard' });
            }
        };

        fetchDaily();
    }, [userId]);

    const handleDraw = useCallback(async () => {
        setIsLoading(true);
        clearToast();
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
            captureFrontendError(e, { domain: 'oracle', op: 'draw' });
            showToast({
                title: "Interferência Mística", 
                message: "A conexão com o oráculo oscilou. Respire e tente novamente." 
            });
        } finally {
            setIsLoading(false);
        }
    }, [clearToast, showToast]);

    const closeCard = useCallback(() => setShowCard(false), []);

    return {
        state: {
            isLoading,
            dailyCard,
            showCard,
        },
        actions: {
            handleDraw,
            setShowCard,
            closeCard,
        }
    };
};
