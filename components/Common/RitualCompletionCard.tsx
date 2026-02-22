import React, { useEffect } from 'react';
import { Sparkles, Droplets } from 'lucide-react';
import { MoodType } from '../../types';

export const RitualCompletionCard: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    title: string,
    message: string,
    mood?: MoodType
}> = ({ isOpen, onClose, title, message, mood = 'SERENO' }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(onClose, 2500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const moodGradients: Record<MoodType, string> = {
        'SERENO': 'from-emerald-400/80 to-teal-600/80',
        'VIBRANTE': 'from-amber-400/80 to-orange-600/80',
        'FOCADO': 'from-indigo-400/80 to-purple-600/80',
        'MELANCÓLICO': 'from-blue-400/80 to-cyan-600/80',
        'EXAUSTO': 'from-stone-400/80 to-neutral-600/80',
        'ANSIOSO': 'from-rose-400/80 to-red-600/80',
        'GRATO': 'from-amber-300/80 to-yellow-500/80',
    };

    return (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+2rem)] left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-[280px] animate-in slide-in-from-bottom-8 fade-in duration-500 pointer-events-none">
            <div className={`bg-gradient-to-br ${moodGradients[mood]} backdrop-blur-xl p-5 rounded-[1.5rem] shadow-2xl border border-white/20 flex flex-col items-center text-center gap-2 pointer-events-auto`}>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {title.toLowerCase().includes('nutri') || title.toLowerCase().includes('rega') ? <Droplets size={16} /> : <Sparkles size={16} />}
                </div>
                <div className="space-y-0.5">
                    <h4 className="text-white font-serif italic text-base leading-tight">{title}</h4>
                    <p className="text-white/80 text-[10px] font-medium tracking-wide">{message}</p>
                </div>
            </div>
        </div>
    );
};
