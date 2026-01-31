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
                 color: '#f43f5e', // Rose 500
                 aura: 'bg-rose-500/20'
             };
        }
        if (mood.includes('MELANCÓLICO') || mood.includes('ANSIOSO') || mood.includes('TRISTE') || mood.includes('EXAUSTO')) {
             return { 
                 element: 'ÁGUA', 
                 color: '#06b6d4', // Cyan 500
                 aura: 'bg-cyan-500/20'
             };
        }
        if (mood.includes('GRATO') || mood.includes('SERENO') || mood.includes('CALMO')) {
             return { 
                 element: 'TERRA', 
                 color: '#10b981', // Emerald 500
                 aura: 'bg-emerald-500/20'
             };
        }
        return { 
            element: 'AR', 
            color: '#6366f1', // Indigo 500
            aura: 'bg-indigo-500/20'
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
            className={`relative rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] ${isStoriesMode ? 'w-full h-full max-w-md aspect-[9/16]' : 'aspect-[3/4]'} bg-[#0f172a] border border-white/10 ${className}`}
        >
            
            {/* 1. ATMOSPHERIC BASE (Deep Gradients) */}
            <div className={`absolute inset-0 bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617]`} />
            
            {/* 2. DYNAMIC ELEMENTAL GLOW */}
            <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[120%] h-[80%] rounded-full blur-[100px] animate-pulse-slow ${visuals.aura} opacity-40`} />
            
            {/* 3. PHOTO (PROTAGONIST) */}
            <div className={`absolute inset-0 z-0 p-4`}>
                <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-white/5">
                    {snap.image ? (
                        <img src={snap.image} className="w-full h-full object-cover grayscale-[20%] contrast-[1.1] brightness-[0.8]" style={{ transform: "translateZ(10px)" }} />
                    ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <Sparkles size={48} className="text-white/5" />
                        </div>
                    )}
                    
                    {/* Inner Vignette */}
                    <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.7)]" />
                    
                    {/* Subtle Tint */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundColor: visuals.color }} />
                </div>
            </div>

            {/* 4. OVERLAYS & CONTENT (The "Floating" feeling) */}
            <div className="absolute inset-0 z-10 p-10 flex flex-col justify-between">
                
                {/* Header (Discrete) */}
                <div className="flex justify-between items-start" style={{ transform: "translateZ(50px)" }}>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Frequência</p>
                        <p className="text-xs font-serif italic text-white/80">{visuals.element}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-mono text-white/30 tracking-widest uppercase">
                            {snap.date ? new Date(snap.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'ESTE INSTANTE'}
                        </p>
                    </div>
                </div>

                {/* Central Quote (Premium Glassmorphism) */}
                <div className="space-y-6 text-center" style={{ transform: "translateZ(80px)" }}>
                    
                    {/* Glass Box */}
                    <div className="relative bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 shadow-2xl overflow-hidden group">
                        {/* Sacred Symbol (Subtle) */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-20">
                            <Sparkles size={40} className="text-white" />
                        </div>

                        <p className="text-white font-serif italic text-xl leading-relaxed drop-shadow-sm transition-transform duration-500 group-hover:scale-[1.02]">
                            "{snap.note || 'O silêncio é o portal para a transformação.'}"
                        </p>
                    </div>

                    {/* Mood Badge */}
                    <div className="flex justify-center">
                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.4em] bg-white/5 border border-white/10 text-white/60`}>
                            {snap.mood || 'SERENO'}
                        </span>
                    </div>
                </div>

                {/* Footer (Ritual Stamp) */}
                <div className="flex justify-center opacity-30" style={{ transform: "translateZ(30px)" }}>
                    <p className="text-[10px] font-bold text-white uppercase tracking-[0.6em]">VIVA360</p>
                </div>
            </div>

            {/* 5. INTERACTIVE EFFECTS */}
            {/* Holographic Sweep */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2s] pointer-events-none mix-blend-overlay z-30" />
            
            {onClose && (
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-white/10 transition-all shadow-xl">
                    <X size={20} />
                </button>
            )}
        </motion.div>
    );
};
