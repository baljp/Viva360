import React, { useEffect } from 'react';
import { RitualCompletionCard as SharedRitualCompletionCard } from '../../components/Common/RitualCompletionCard';
import { MoodType } from '../../types';

interface RitualCompletionCardProps {
    title: string;
    message: string;
    onClose: () => void;
    mood?: string;
}

export const RitualCompletionCard: React.FC<RitualCompletionCardProps> = ({ title, message, onClose, mood }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const normalizeMood = (value?: string): MoodType => {
        const upper = String(value || '').toUpperCase();
        if (upper === 'SERENO' || upper === 'VIBRANTE' || upper === 'FOCADO' || upper === 'MELANCÓLICO' || upper === 'EXAUSTO' || upper === 'ANSIOSO' || upper === 'GRATO') {
            return upper as MoodType;
        }
        return 'SERENO';
    };

    return (
        <SharedRitualCompletionCard
            isOpen={true}
            onClose={onClose}
            title={title}
            message={message}
            mood={normalizeMood(mood)}
        />
    );
};
