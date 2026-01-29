import React, { useState } from 'react';
import { Sparkles, Share2, Instagram, Download, X } from 'lucide-react';

interface OracleMessage {
    id: string;
    text: string;
    category: string;
    element: string;
    depth: number;
}

interface OracleCardProps {
    card: OracleMessage;
    onClose: () => void;
}

export const OracleCard: React.FC<OracleCardProps> = ({ card, onClose }) => {
    const [flipped, setFlipped] = useState(false);

    const getElementColor = (el: string) => {
        switch (el) {
            case 'Fogo': return 'from-amber-600 to-red-600';
            case 'Agua': return 'from-blue-600 to-cyan-600';
            case 'Terra': return 'from-emerald-600 to-green-800';
            case 'Ar': return 'from-slate-400 to-sky-300';
            default: return 'from-purple-600 to-indigo-900';
        }
    };

    const getElementIcon = (el: string) => {
        switch (el) {
            case 'Fogo': return '🔥';
            case 'Agua': return '💧';
            case 'Terra': return '🌱';
            case 'Ar': return '🌬️';
            default: return '✨';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                <X size={24} />
            </button>

            <div className={`relative w-full max-w-sm aspect-[2/3] perspective-1000 cursor-pointer group`} onClick={() => !flipped && setFlipped(true)}>
                <div className={`w-full h-full relative preserve-3d transition-transform duration-1000 ${flipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* BACK OF CARD (Initial View) */}
                    <div className="absolute inset-0 backface-hidden rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                        <div className="absolute inset-0 bg-nature-950 flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                             <div className="w-full h-full absolute inset-0 opacity-20 bg-gradient-to-tr from-indigo-900 to-purple-900 animate-pulse" />
                             <div className="relative z-10 p-8 border border-white/10 rounded-full w-48 h-48 flex items-center justify-center animate-spin-slow">
                                 <Sparkles size={64} className="text-amber-200 opacity-80" />
                             </div>
                             <p className="absolute bottom-12 text-center text-amber-100/50 text-xs font-bold uppercase tracking-[0.4em] animate-pulse">Toque para revelar</p>
                        </div>
                    </div>

                    {/* FRONT OF CARD (Revealed) */}
                    <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-[0_0_100px_rgba(255,215,0,0.2)] bg-nature-900`}>
                        {/* Dynamic Background */}
                        <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${getElementColor(card.element)}`} />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col p-8">
                            
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest text-white">
                                    {card.element} {getElementIcon(card.element)}
                                </div>
                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>

                            {/* Main Insight */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-16 h-1 bg-white/20 rounded-full" />
                                <p className="text-2xl md:text-3xl font-serif italic text-white leading-relaxed drop-shadow-lg">
                                    "{card.text}"
                                </p>
                                <div className="w-16 h-1 bg-white/20 rounded-full" />
                            </div>

                            {/* Footer / Actions */}
                                <button 
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'Oráculo Viva360',
                                                text: `Minha carta do dia: ${card.element} - "${card.text}"`,
                                                url: window.location.href
                                            }).catch(console.error);
                                        } else {
                                            // Fallback
                                            navigator.clipboard.writeText(`Oráculo Viva360: "${card.text}"`);
                                            alert('Mensagem copiada para a área de transferência!');
                                        }
                                    }}
                                    className="w-full py-4 bg-white text-nature-950 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all outline-none"
                                >
                                    <Share2 size={18} /> Compartilhar Insight
                                </button>
                                
                                <p className="text-center text-[8px] text-white/30 uppercase tracking-[0.3em]">Oráculo Viva360</p>
                            </div>
                        </div>


                </div>
            </div>
        </div>
    );
};
