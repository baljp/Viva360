import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, Moon, Sun, Stars, Cloud, Share2 } from 'lucide-react';
import { OracleCard as OracleCardType } from '../../types';
import { generateShareCanvas, shareToSocial } from '../utils/sharing';

interface OracleCardPremiumProps {
    card: OracleCardType;
    onClose: () => void;
    onReveal?: () => void;
}

export const OracleCardPremium: React.FC<OracleCardPremiumProps> = ({ card, onClose, onReveal }) => {
    const [revealState, setRevealState] = useState<'PORTAL' | 'SHUFFLE' | 'REVEALED'>('PORTAL');
    const controls = useAnimation();

    // 3D Motion Values
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    useEffect(() => {
        // Auto-start sequence
        // In a real app, user might tap to start
    }, []);

    const handlePortalTap = async () => {
        if (navigator.vibrate) navigator.vibrate(50);
        setRevealState('SHUFFLE');
        
        // Shuffle Animation Sequence
        await controls.start({
            rotateY: [0, 180, 360, 540, 720],
            scale: [1, 0.8, 1.1, 1],
            transition: { duration: 2, ease: "easeInOut" }
        });

        if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
        setRevealState('REVEALED');
        if (onReveal) onReveal();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-nature-900/90 backdrop-blur-xl p-4">
            
            {/* Dynamic Background Aura */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-gradient-to-tr from-indigo-900/30 via-purple-900/30 to-amber-900/30 animate-spin-slow opacity-50 blur-[100px] transition-all duration-1000 ${revealState === 'REVEALED' ? 'scale-150 opacity-80' : ''}`} />
            </div>

            <AnimatePresence mode='wait'>
                {revealState === 'PORTAL' && (
                    <motion.div
                        key="portal"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
                        onClick={handlePortalTap}
                        className="relative cursor-pointer group"
                    >
                        <div className="w-64 h-96 bg-nature-800 rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden">
                            {/* Portal Glow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-purple-900/40 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                            
                            {/* Pulsing Seal */}
                            <div className="relative z-10 text-center space-y-4">
                                <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center animate-pulse-slow mx-auto">
                                    <Sparkles className="text-indigo-300" size={32} />
                                </div>
                                <p className="text-white/60 font-serif italic text-sm tracking-widest uppercase">Toque para Sintonizar</p>
                            </div>

                            {/* Particles */}
                            <div className="absolute inset-0">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="absolute w-1 h-1 bg-white/40 rounded-full animate-float-slow" style={{
                                        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`
                                    }} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {revealState === 'SHUFFLE' && (
                     <motion.div
                        key="shuffle"
                        animate={controls}
                        className="w-64 h-96 bg-gradient-to-br from-indigo-900 to-nature-900 rounded-3xl border border-white/20 shadow-2xl flex items-center justify-center"
                     >
                        <div className="w-full h-full backface-hidden flex items-center justify-center">
                            <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400" className="w-full h-full object-cover opacity-20 rounded-3xl" />
                        </div>
                     </motion.div>
                )}

                {revealState === 'REVEALED' && (
                    <motion.div
                        key="revealed"
                        initial={{ opacity: 0, rotateY: 180, scale: 0.5 }}
                        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                        style={{ x, y, rotateX, rotateY, perspective: 1000 }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="relative w-full max-w-sm aspect-[9/16] max-h-[80vh]"
                    >
                         {/* Card Container */}
                        <div className="w-full h-full bg-nature-50 rounded-[2rem] shadow-2xl overflow-hidden relative border-[8px] border-white/50">
                            
                            {/* Premium Image Layer */}
                            <div className="absolute inset-0 h-[75%]">
                                <img 
                                    src={card.imageUrl} 
                                    alt={card.name} 
                                    crossOrigin="anonymous" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800";
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-nature-50/80" />
                            </div>

                            {/* Content Layer */}
                            <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-b from-nature-50/0 via-nature-50/95 to-nature-50 p-6 flex flex-col justify-end text-center backdrop-blur-[2px]">
                                
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="space-y-3"
                                >
                                    <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-nature-900/5 rounded-full border border-nature-900/10 mx-auto">
                                        <Stars size={10} className="text-amber-600" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-nature-900/60">{card.archetype}</span>
                                    </div>

                                    <h2 className="text-3xl font-serif italic text-nature-900 leading-tight">
                                        {card.name}
                                    </h2>

                                    <p className="text-sm font-medium text-nature-600 leading-relaxed px-2">
                                        "{card.message}"
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="pt-4 flex flex-col gap-2">
                                         <button 
                                            onClick={async () => {
                                                const blob = await generateShareCanvas({
                                                    title: card.name,
                                                    subtitle: card.archetype,
                                                    message: card.message,
                                                    imageUrl: card.imageUrl,
                                                    accentColor: '#fbbf24', // Amber/Gold for Oracle
                                                    footer: 'VESTÍGIO VIVA360'
                                                });
                                                
                                                if (blob) {
                                                    await shareToSocial(blob, `🔮 Minha revelação do dia: ${card.name} - "${card.message}"`);
                                                    handleMouseLeave();
                                                }
                                            }}
                                            className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                         >
                                            <Share2 size={14} /> Compartilhar com Imagem
                                         </button>
                                         <button 
                                            onClick={onClose}
                                            className="w-full py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
                                         >
                                            Receber e Fechar
                                         </button>
                                    </div>
                                    
                                    <button 
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: 'Oráculo Viva360',
                                                    text: `Minha carta: ${card.name} - "${card.message}"`,
                                                    url: window.location.href
                                                }).catch(() => {});
                                            }
                                        }}
                                        className="w-full mt-2 py-2 text-nature-400 text-[9px] font-bold uppercase tracking-widest hover:text-nature-600 transition-colors"
                                    >
                                        Outras Opções
                                    </button>
                                </motion.div>
                            </div>

                             {/* Holographic Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none mix-blend-overlay" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
