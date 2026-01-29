import React from 'react';
import { DailyRitualSnap } from '../../types';
import { Droplet, Wind, Flame, Mountain, Sparkles } from 'lucide-react';

interface SoulCardProps {
    snap: DailyRitualSnap;
    className?: string;
}

export const SoulCard: React.FC<SoulCardProps> = ({ snap, className = "" }) => {
    // Determine element based on mood or randomness if not specified
    const getElementIcon = () => {
        const mood = snap.mood || 'SERENO';
        switch (mood) {
            case 'VIBRANTE': return <Flame size={120} className="text-amber-500" />;
            case 'MELANCÓLICO': return <Droplet size={120} className="text-blue-500" />;
            case 'FOCADO': return <Mountain size={120} className="text-emerald-500" />;
            default: return <Wind size={120} className="text-slate-500" />;
        }
    };

    const getElementLabel = () => {
        const mood = snap.mood || 'SERENO';
        switch (mood) {
            case 'VIBRANTE': return 'FOGO';
            case 'MELANCÓLICO': return 'ÁGUA';
            case 'FOCADO': return 'TERRA';
            default: return 'AR';
        }
    };

    return (
        <div className={`relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl group border-[6px] border-nature-100 bg-nature-50 ${className}`}>
            
            {/* Header Element */}
            <div className="absolute top-4 left-0 right-0 flex justify-center z-20">
                 <div className="px-4 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-[10px] font-black tracking-[0.3em] text-white shadow-sm uppercase">
                    {getElementLabel()}
                 </div>
            </div>

            {/* Image Layer */}
            <div className="absolute inset-2 top-12 bottom-24 rounded-[1.5rem] overflow-hidden z-10 bg-nature-900 mx-2">
                {snap.image ? (
                    <img src={snap.image} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full bg-nature-800 flex items-center justify-center text-nature-600">
                        <Sparkles size={48} opacity={0.2} />
                    </div>
                )}
            </div>

            {/* Background Element Symbol (Translucent) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 z-0 pointer-events-none blur-sm">
                {getElementIcon()}
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-transparent to-nature-900/90 z-10" />

            {/* Watermark Side Date */}
            <div className="absolute top-16 -right-8 rotate-90 origin-top-right opacity-30 z-20">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-nature-900 font-mono">
                    {new Date(snap.date).toLocaleDateString()}
                </span>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 w-full p-6 space-y-2 z-20 text-center">
                
                <p className="text-white text-xs font-serif italic leading-relaxed drop-shadow-md px-4">
                    "Respire. Você está exatamente onde precisa."
                </p>

                {snap.mood && (
                    <div className="pt-2 flex justify-center">
                         <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                            {snap.mood}
                        </span>
                    </div>
                )}
            </div>
            
            {/* Holographic Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent skew-x-12 translate-x-[-200%] transition-transform duration-1000 group-hover:translate-x-[200%] z-30 pointer-events-none" />
        </div>
    );
};
