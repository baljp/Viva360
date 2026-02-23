import { useMemo } from 'react';
import { User } from '../../types';
import { gardenService, TimeLayer } from '../../services/gardenService';
import { useBuscadorFlow } from '../flow/useBuscadorFlow';

export const useEvolution = (user: User) => {
    const { go, back } = useBuscadorFlow();

    const layers: { id: TimeLayer; label: string; period: string }[] = useMemo(() => [
        { id: 'daily', label: 'Hoje', period: '24h' },
        { id: 'weekly', label: 'Semana', period: '7 dias' },
        { id: 'fortnightly', label: 'Quinzena', period: '15 dias' },
        { id: 'monthly', label: 'Mes', period: '30 dias' },
        { id: 'quarterly', label: 'Trimestre', period: '90 dias' },
        { id: 'semiannual', label: 'Semestre', period: '180 dias' },
        { id: 'annual', label: 'Ano', period: '365 dias' }
    ], []);

    const evolution = useMemo(() => gardenService.calculateEvolution(user), [user]);

    const processedLayers = useMemo(() => {
        return layers.map((layer) => {
            const now = new Date();
            const periodDays = layer.period.includes('24h') ? 1 : parseInt(layer.period, 10) || 1;

            let progress = 0;

            if (layer.id === 'daily') {
                progress = evolution.rituals;
            } else {
                const pastDate = new Date();
                pastDate.setDate(now.getDate() - periodDays);

                const periodSnaps = (user.snaps || []).filter((snapshot) => new Date(snapshot.date) >= pastDate);
                const expected = periodDays;
                progress = Math.min(100, Math.floor((periodSnaps.length / expected) * 100));
            }

            const state = gardenService.getEvolutionState(progress);
            return { ...layer, progress, state };
        });
    }, [user.snaps, evolution, layers]);

    const recentSnaps = useMemo(() => (user.snaps || []).slice(0, 5), [user.snaps]);

    return {
        actions: { go, back },
        data: {
            layers: processedLayers,
            recentSnaps
        }
    };
};

