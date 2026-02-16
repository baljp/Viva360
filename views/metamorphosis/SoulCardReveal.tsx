import React, { useState, useEffect, useRef } from 'react';
import { ViewState } from '../../types';
import { PortalView, DynamicAvatar } from '../../components/Common';
import { Sparkles, ShieldCheck, Share2, Download, CheckCircle, Heart, X } from 'lucide-react';
import { useSoulCards } from '../../src/hooks/useSoulCards';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { SoulCard } from '../../src/data/mockSoulCards';
import { motion, AnimatePresence } from 'framer-motion';

interface SoulCardRevealProps {
    card: SoulCard;
    userPhoto: string;
    onClose: () => void;
}

export const SoulCardReveal: React.FC<SoulCardRevealProps> = ({ card, userPhoto, onClose }) => {
    const [revealStage, setRevealStage] = useState(0); // 0: Shake, 1: Burst, 2: Show
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { go } = useBuscadorFlow();

    useEffect(() => {
        // Animation Sequence
        const t1 = setTimeout(() => setRevealStage(1), 1000); // Start burst
        const t2 = setTimeout(() => setRevealStage(2), 2500); // Show card
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Canvas drawing logic for download/share (Simplified from MetamorphosisWizard)
    // ... (We can reuse the logic or keep it simple for now)

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
            {/* Global Close Button for exit during animation */}
            <button 
                onClick={onClose}
                className="absolute top-12 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-all z-[60]"
            >
                <X size={24} />
            </button>
            
            {/* STAGE 0: MYSTERY */}
            {revealStage === 0 && (
                <div className="text-center animate-pulse">
                     <div className="w-48 h-72 bg-indigo-900 rounded-xl border-4 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.5)] flex items-center justify-center transform rotate-3 animate-bounce">
                        <Sparkles size={48} className="text-amber-200" />
                     </div>
                     <p className="text-white mt-8 font-serif italic text-xl">Invocando Arquétipo...</p>
                </div>
            )}

            {/* STAGE 1: BURST */}
            {revealStage === 1 && (
                <div className="relative">
                    <div className="absolute inset-0 bg-white animate-ping rounded-full opacity-50"></div>
                     <div className="w-48 h-72 bg-white rounded-xl shadow-[0_0_100px_white] flex items-center justify-center animate-spin-slow">
                     </div>
                </div>
            )}

            {/* STAGE 2: REVEAL */}
            {revealStage === 2 && (
                <div className="flex flex-col items-center animate-in zoom-in duration-1000 w-full max-w-lg">
                    {/* TOP HEADER - Contextual metadata */}
                    <div className="text-center mb-8">
                        <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-amber-400/80 text-[10px] font-bold uppercase tracking-[0.4em] mb-3"
                        >
                            Frequência Cristalizada
                        </motion.p>
                        <motion.h2 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl font-serif italic text-white mb-3"
                        >
                            {card.archetype}
                        </motion.h2>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center justify-center gap-3"
                        >
                            <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 text-white/60 bg-white/5`}>
                                {card.rarity}
                            </span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                Elemento {card.element}
                            </span>
                        </motion.div>
                    </div>

                    {/* THE PREMIUM CARD */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className={`relative w-full aspect-[9/16] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] group`}
                    >
                         {/* THE PROTO (User Image) */}
                         <div className="absolute inset-0 bg-[#0f172a]">
                            <img src={userPhoto} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" style={{ filter: 'contrast(1.1) brightness(0.9) saturate(1.1)' }} alt="Foto do ritual" />
                            {/* Inner Vignette / Shadow Overlay */}
                            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"></div>
                         </div>
                         
                         {/* Ethereal Glow based on theme */}
                         <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40`}></div>
                         
                         {/* Content Overlay */}
                         <div className="absolute inset-0 p-8 flex flex-col justify-end items-center text-center pb-16">
                            
                            {/* Sacred Symbol */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 0.6, scale: 1 }}
                                transition={{ delay: 1.5 }}
                                className="w-12 h-12 border-2 border-white/50 rounded-full flex items-center justify-center mb-6"
                            >
                                <Sparkles size={20} className="text-white" />
                            </motion.div>

                            {/* Glassmorphism Quote Box */}
                            <div className="relative w-full bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/20 shadow-2xl overflow-hidden">
                                {/* Subtle internal shine */}
                                <div className="absolute -top-full -left-full w-[300%] h-[300%] bg-gradient-to-br from-white/10 via-transparent to-transparent rotate-45 pointer-events-none"></div>
                                
                                <p className="text-white font-serif italic text-xl leading-relaxed drop-shadow-sm">
                                    "{card.message}"
                                </p>
                            </div>

                            {/* Seal (Initial/Stamp) */}
                            <div className="mt-8 opacity-40">
                                <p className="text-[10px] font-black text-white uppercase tracking-[0.5em]">Viva360 Ritual</p>
                            </div>
                         </div>

                         {/* Holographic Sweep Animation */}
                         <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2s] pointer-events-none"></div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="mt-10"
                    >
                        <button onClick={onClose} className="px-12 py-5 bg-white text-slate-900 rounded-[2rem] font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                            Guardar no Grimório
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
