import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Sparkles, History, Share2 } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { OracleCardPremium } from '../../src/components/OracleCardPremium';
import { api } from '../../services/api';
import { useBuscadorFlow } from '../../src/flow/useBuscadorFlow';
import { useOracle, OracleMessage } from '../../src/hooks/useOracle';

export const OracleView: React.FC<{ user: User, updateUser: (u: User) => void }> = ({ user, updateUser }) => {
    const { go, back } = useBuscadorFlow();
    const { state, actions } = useOracle(user.id);
    const { isLoading, dailyCard, showCard } = state;
    const { handleDraw, setShowCard, closeCard } = actions;

    return (
        <PortalView title="Oráculo Viva360" subtitle="GUIA SIMBÓLICO" onBack={back}>
            <div className="flex flex-col h-full relative">
                
                {/* Mystic Atmosphere */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center space-y-12 relative z-10 px-8">
                    
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-indigo-100 animate-float">
                            <Sparkles size={32} className="text-indigo-600" />
                        </div>
                        <h2 className="text-4xl font-serif italic text-nature-900">Guia Diário</h2>
                        <p className="text-nature-500 text-sm leading-relaxed max-w-xs mx-auto">
                            O algoritmo do universo cruza seu momento com a sabedoria ancestral.
                        </p>
                    </div>

                    {!dailyCard ? (
                        <button 
                            onClick={handleDraw}
                            disabled={isLoading}
                            className="relative z-20 touch-manipulation w-full max-w-sm py-6 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden group"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Desembaralhando destino...</span>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        <Sparkles size={18} /> Revelar Carta do Dia
                                    </span>
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="space-y-4 w-full max-w-sm animate-in fade-in slide-in-from-bottom">
                            <button 
                                onClick={() => setShowCard(true)}
                                className="relative z-20 touch-manipulation w-full py-6 bg-white border border-nature-200 text-nature-900 rounded-[2rem] font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 hover:bg-nature-50 transition-colors"
                            >
                                <Sparkles size={18} className="text-indigo-500" /> Ver Carta Revelada
                            </button>
                            <p className="text-center text-[10px] text-nature-400 uppercase tracking-widest">Disponível até meia-noite</p>
                        </div>
                    )}
                </div>

                <div className="p-8">
                     <button 
                        onClick={() => go('ORACLE_HISTORY')}
                        className="w-full py-4 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 text-nature-600 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-colors"
                    >
                        <History size={16} /> Meu Histórico
                     </button>
                </div>
            </div>

            {/* Render the Premium Card Modal overlay */}
            {showCard && dailyCard && (
                <OracleCardPremium 
                    card={{
                        id: dailyCard.id,
                        name: dailyCard.name, 
                        message: dailyCard.text,
                        archetype: dailyCard.name,
                        element: dailyCard.element,
                        depth: dailyCard.depth || 1,
                        imageUrl: (() => {
                            const reliableImages = [
                                "https://images.unsplash.com/photo-1620668612187-578f7318182b?q=80&w=800&auto=format&fit=crop", // Mystic Pink
                                "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop", // Nebula
                                "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop", // Stars
                                "https://images.unsplash.com/photo-1506318137071-a8bcbf6755dd?q=80&w=800&auto=format&fit=crop", // Aurora
                                "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=800&auto=format&fit=crop", // Galaxy Night
                                "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", // Rain
                                "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop"  // Nature
                            ];
                            const seed = dailyCard.id + dailyCard.name;
                            const idx = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % reliableImages.length;
                            return reliableImages[idx];
                        })()
                    }} 
                    onClose={closeCard} 
                />
            )}

        </PortalView>
    );
};
