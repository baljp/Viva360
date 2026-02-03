import React from 'react';
import { Wind, Sun, Zap, CloudRain, Frown, Activity } from 'lucide-react';
import { MoodType } from '../../types';
import { FunctionalCard } from './Cards';
import { ICON_SIZE } from './constants';

export const MoodTracker: React.FC<{ currentMood?: MoodType, onSelect: (m: MoodType) => void }> = ({ currentMood, onSelect }) => {
    const moods: { type: MoodType, icon: any, color: string }[] = [
        { type: 'SERENO', icon: Wind, color: 'bg-emerald-50 text-emerald-600' },
        { type: 'VIBRANTE', icon: Sun, color: 'bg-amber-50 text-amber-600' },
        { type: 'FOCADO', icon: Zap, color: 'bg-indigo-50 text-indigo-600' },
        { type: 'MELANCÓLICO', icon: CloudRain, color: 'bg-blue-50 text-blue-600' },
        { type: 'EXAUSTO', icon: Frown, color: 'bg-stone-50 text-stone-600' },
        { type: 'ANSIOSO', icon: Activity, color: 'bg-rose-50 text-rose-600' },
    ];

    return (
        <FunctionalCard className="p-5">
            <h4 className="font-bold text-nature-900 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={ICON_SIZE.MD} className="text-primary-500" /> Como está sua energia?
            </h4>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {moods.map(m => (
                    <button 
                        key={m.type}
                        onClick={() => onSelect(m.type)}
                        className={`flex flex-col items-center gap-2 p-1 transition-all min-w-[64px] ${currentMood === m.type ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.color} ${currentMood === m.type ? 'ring-2 ring-offset-2 ring-primary-100' : ''}`}>
                            <m.icon size={ICON_SIZE.MD} />
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-nature-400">{m.type}</span>
                    </button>
                ))}
            </div>
        </FunctionalCard>
    );
};
