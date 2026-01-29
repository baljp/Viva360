import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Sparkles, History, Share2 } from 'lucide-react';
import { PortalView, ZenToast } from '../../components/Common';
import { OracleCard } from '../../src/components/OracleCard';
import { api } from '../../services/api';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { useOracle, OracleMessage } from '../../frontend/src/hooks/useOracle';

// Stub until backend typing is synced
// OracleMessage now imported from hook

export const OracleView: React.FC<{ user: User, updateUser: (u: User) => void }> = ({ user, updateUser }) => {
    const { go } = useBuscadorFlow();
    const { state, actions } = useOracle(user.id);
    const { isLoading, dailyCard, showCard, toast } = state;
    const { handleDraw, setShowCard, closeCard, clearToast } = actions;

    return (
        <PortalView title="Oráculo Viva360" subtitle="GUIA SIMBÓLICO" onBack={() => go('DASHBOARD')}>
            {toast && <ZenToast toast={toast} onClose={clearToast} />}
            
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
                            className="w-full max-w-sm py-6 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all relative overflow-hidden group"
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
                                className="w-full py-6 bg-white border border-nature-200 text-nature-900 rounded-[2rem] font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 hover:bg-nature-50 transition-colors"
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

            {/* Render the Card Modal overlay */}
            {showCard && dailyCard && (
                <OracleCard card={dailyCard} onClose={closeCard} />
            )}

        </PortalView>
    );
};
