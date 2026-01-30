import React, { useRef } from 'react';
import { DailyRitualSnap } from '../../types';
import { Droplet, Wind, Flame, Mountain, Sparkles, X, Share2, ChevronUp } from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface SoulCardProps {
    snap: DailyRitualSnap;
    className?: string;
    isStoriesMode?: boolean;
    onClose?: () => void;
}

export const SoulCard: React.FC<SoulCardProps> = ({ snap, className = "", isStoriesMode = false, onClose }) => {
    // 3D Tilt Logic
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Determine element based on mood
    const getElementVisuals = () => {
        const mood = (snap.mood || 'SERENO').toUpperCase();
        
        if (mood.includes('VIBRANTE') || mood.includes('FOCADO') || mood.includes('FELIZ')) {
             return { 
                 element: 'FOGO', 
                 icon: <Flame size={120} className="text-amber-500" />,
                 bg: 'from-amber-50 to-orange-100',
                 accent: 'text-amber-600',
                 aura: 'bg-amber-500'
             };
        }
        if (mood.includes('MELANCÓLICO') || mood.includes('ANSIOSO') || mood.includes('TRISTE') || mood.includes('EXAUSTO')) {
             return { 
                 element: 'ÁGUA', 
                 icon: <Droplet size={120} className="text-blue-500" />,
                 bg: 'from-blue-50 to-cyan-100',
                 accent: 'text-blue-600',
                 aura: 'bg-blue-500'
             };
        }
        if (mood.includes('GRATO') || mood.includes('SERENO') || mood.includes('CALMO')) {
             return { 
                 element: 'TERRA', 
                 icon: <Mountain size={120} className="text-emerald-500" />,
                 bg: 'from-emerald-50 to-green-100',
                 accent: 'text-emerald-600',
                 aura: 'bg-emerald-500'
             };
        }
        return { 
            element: 'AR', 
            icon: <Wind size={120} className="text-slate-500" />,
            bg: 'from-slate-50 to-gray-100',
            accent: 'text-slate-600',
            aura: 'bg-slate-400'
        };
    };

    const visuals = getElementVisuals();

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative rounded-[2rem] overflow-hidden shadow-2xl ${isStoriesMode ? 'w-full h-full max-w-md aspect-[9/16]' : 'aspect-[3/4]'} bg-gradient-to-br ${visuals.bg} border-[8px] border-white/40 ${className}`}
        >
            
            {/* Dynamic Aura Background */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] rounded-full opacity-20 blur-[80px] animate-pulse-slow ${visuals.aura}`} />
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            {/* Header Element */}
            <div className="absolute top-6 left-0 right-0 flex justify-center z-20">
                 <div className="px-4 py-1 bg-white/30 backdrop-blur-md rounded-full border border-white/40 text-[10px] font-black tracking-[0.3em] text-nature-900 shadow-sm uppercase flex items-center gap-2">
                    <Sparkles size={10} className={visuals.accent} />
                    {visuals.element}
                 </div>
            </div>

            {isStoriesMode && onClose && (
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-black/10 rounded-full hover:bg-black/20 transition-colors text-nature-900">
                    <X size={20} />
                </button>
            )}

            {/* Image Layer */}
            <div className={`absolute left-4 right-4 rounded-3xl overflow-hidden z-10 shadow-inner border-4 border-white/20 ${isStoriesMode ? 'top-20 bottom-32' : 'top-16 bottom-24'}`}>
                {snap.image ? (
                    <img src={snap.image} className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-110" style={{ transform: "translateZ(20px)" }} />
                ) : (
                    <div className="w-full h-full bg-nature-900 flex items-center justify-center text-white/20">
                        <Sparkles size={48} />
                    </div>
                )}
                
                {/* Photo Filter Overlay */}
                <div className={`absolute inset-0 mix-blend-overlay opacity-30 bg-${visuals.aura.replace('bg-', '')}`} />
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 w-full p-8 z-20 text-center space-y-3" style={{ transform: "translateZ(40px)" }}>
                
                <p className="text-nature-900 text-sm font-serif italic leading-relaxed px-4 drop-shadow-sm">
                    "{snap.note || 'O silêncio é a resposta.'}"
                </p>

                <div className="flex justify-center items-center gap-3">
                     <span className={`text-[9px] font-bold ${visuals.accent} uppercase tracking-widest border border-current px-3 py-1 rounded-full`}>
                        {snap.mood || 'Sereno'}
                    </span>
                    <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">
                         {snap.date && !isNaN(new Date(snap.date).getTime()) 
                        ? new Date(snap.date).toLocaleDateString() 
                        : 'HOJE'}
                    </span>
                </div>

                {/* Interaction Hint for Stories Mode */}
                {isStoriesMode && (
                    <div className="pt-4 opacity-50 animate-bounce">
                        <ChevronUp size={20} className="mx-auto text-nature-900" />
                    </div>
                )}
            </div>
            
            {/* Holographic Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent skew-x-12 translate-x-[-200%] transition-transform duration-[1.5s] hover:translate-x-[200%] z-30 pointer-events-none mix-blend-soft-light" />
        </motion.div>
    );
};
