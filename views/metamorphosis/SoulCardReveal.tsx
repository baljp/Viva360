import React, { useState, useEffect, useRef } from 'react';
import { ViewState } from '../../types';
import { PortalView, DynamicAvatar } from '../../components/Common';
import { Sparkles, ShieldCheck, Share2, Download, CheckCircle, Heart } from 'lucide-react';
import { useSoulCards } from '../../src/hooks/useSoulCards';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { SoulCard } from '../../src/data/mockSoulCards';

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
                <div className="flex flex-col items-center animate-in zoom-in duration-700">
                    <div className="text-center mb-6">
                        <p className="text-amber-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">Carta da Alma Desbloqueada</p>
                        <h2 className="text-3xl font-serif italic text-white">{card.archetype}</h2>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-${card.visualTheme}-500 text-white`}>
                            {card.rarity} {card.element}
                        </span>
                    </div>

                    {/* THE CARD */}
                    <div className={`relative w-full max-w-sm aspect-[3/4] rounded-[2rem] border-4 border-${card.visualTheme}-400 overflow-hidden shadow-2xl mb-8 group`}>
                         <img src={userPhoto} className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />
                         <div className={`absolute inset-0 bg-gradient-to-t from-${card.visualTheme}-900 via-transparent to-${card.visualTheme}-900/50`}></div>
                         
                         <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                            <p className="text-white font-serif italic text-lg leading-relaxed drop-shadow-md">
                                "{card.message}"
                            </p>
                         </div>

                         {/* Holographic Effect */}
                         <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-4 bg-white text-indigo-900 rounded-full font-bold uppercase text-xs tracking-widest hover:scale-105 transition-transform">
                            Guardar no Grimório
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
