import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, RefreshCw, Sun, Moon, Star, Wind, Anchor } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';

const CARD_BACK = "https://images.unsplash.com/photo-1506318137071-a8bcbf675bfa?q=80&w=600";
const CARD_FRONT_BG = "https://images.unsplash.com/photo-1533158388470-9a56699990c6?q=80&w=600";

export const OracleView: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const [card, setCard] = useState<any>(null);

    const handleDraw = async () => {
        if (isShuffling) return;
        setIsShuffling(true);
        setIsFlipped(false);
        setCard(null);

        try {
             // Sound effect (simulated delay)
            const drawData = await api.oracle.draw('calm');
            
            setTimeout(() => {
                setCard(drawData?.card || { 
                    name: 'O Silêncio', 
                    element: 'Éter', 
                    intensity: 'Suave', 
                    insight: 'No silêncio, todas as respostas surgem.' 
                });
                setIsShuffling(false);
                setIsFlipped(true);
            }, 2000);
        } catch (e) {
            console.error("Oracle Error", e);
             setTimeout(() => {
                setCard({ 
                    name: 'O Caos', 
                    element: 'Fogo', 
                    intensity: 'Imprevisível', 
                    insight: 'Mesmo na desordem, há um padrão divino.' 
                });
                setIsShuffling(false);
                setIsFlipped(true);
            }, 2000);
        }
    };

    return (
        <PortalView title="O Oráculo" subtitle="MENSAGEM DO DIA" onBack={() => setView(ViewState.CLIENT_HOME)}>
            <div className="flex flex-col items-center justify-center min-h-[60vh] perspective-1000">
                <style>{`
                    .perspective-1000 { perspective: 1000px; }
                    .preserve-3d { transform-style: preserve-3d; }
                    .backface-hidden { backface-visibility: hidden; }
                    .rotate-y-180 { transform: rotateY(180deg); }
                `}</style>
                
                <div 
                    onClick={handleDraw}
                    className={`relative w-64 h-96 transition-transform duration-1000 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''} ${isShuffling ? 'animate-bounce' : ''}`}
                >
                    {/* CARD BACK */}
                    <div className="absolute inset-0 backface-hidden rounded-3xl shadow-2xl overflow-hidden border-4 border-white/20">
                        <img src={CARD_BACK} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center flex-col">
                           <Sparkles size={48} className="text-amber-400 animate-pulse" />
                           <p className="text-white text-xs font-bold uppercase tracking-widest mt-4">Toque para Revelar</p>
                        </div>
                    </div>

                    {/* CARD FRONT */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl shadow-2xl overflow-hidden bg-white border-4 border-amber-200">
                        {card ? (
                            <div className="h-full flex flex-col relative p-6 text-center bg-gradient-to-b from-white to-amber-50">
                                <div className="absolute top-0 left-0 w-full h-32 bg-indigo-900/5 -z-0"></div>
                                <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                                        {card.element === 'Fogo' && <Sun size={32}/>}
                                        {card.element === 'Água' && <Anchor size={32}/>}
                                        {card.element === 'Ar' && <Wind size={32}/>}
                                        {card.element === 'Terra' && <Moon size={32}/>}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-serif italic text-nature-900">{card.name}</h3>
                                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">{card.element} • {card.intensity}</p>
                                    </div>
                                    <div className="w-12 h-0.5 bg-amber-200"></div>
                                    <p className="text-sm text-nature-600 italic leading-relaxed">"{card.insight}"</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-nature-300"/></div>
                        )}
                    </div>
                </div>

                {!isShuffling && !isFlipped && (
                     <p className="mt-8 text-nature-400 text-sm italic animate-pulse">O universo está ouvindo...</p>
                )}
            </div>
        </PortalView>
    );
};
