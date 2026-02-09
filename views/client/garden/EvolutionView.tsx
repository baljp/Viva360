import React from 'react';
import { User } from '../../../types';
import { PortalView } from '../../../components/Common';
import { ChevronRight, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import { useEvolution } from '../../../src/hooks/useEvolution';

export const EvolutionView: React.FC<{ user: User }> = ({ user }) => {
    const { actions, data } = useEvolution(user);
    const { go } = actions;
    const { layers } = data;

    const renderTrend = (trend: 'up' | 'down' | 'right') => {
        if (trend === 'up') return <TrendingUp size={14} className="text-emerald-500" />;
        if (trend === 'down') return <TrendingDown size={14} className="text-rose-500" />;
        return <Minus size={14} className="text-amber-500" />;
    };

    return (
        <PortalView title="Evolução" subtitle="SUA JORNADA VIVA" onBack={() => go('GARDEN_VIEW')} heroImage="https://images.unsplash.com/photo-1470252649378-b736a029c69d?q=80&w=800">
            <div className="flex flex-col h-full bg-nature-50/30">
                
                <div className="px-6 pt-8 flex justify-between items-center">
                    <div className="text-left">
                        <h3 className="text-4xl font-serif italic text-nature-900 mb-2">🌳 Sua Jornada</h3>
                        <p className="text-xs text-nature-500 uppercase tracking-[0.2em] font-bold">Estado Evolutivo</p>
                    </div>
                    <button 
                        onClick={() => go('METAMORPHOSIS_CHECKIN')}
                        className="bg-nature-900 text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-all flex flex-col items-center gap-1"
                    >
                        <Plus size={16} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Novo Registro</span>
                    </button>
                </div>

                {/* Cards Scroll Horizontal */}
                <div className="mt-8 overflow-x-auto pb-8 scrollbar-hide">
                    <div className="flex px-6 gap-4 min-w-max">
                        {layers.map((layer) => (
                            <button 
                                key={layer.id}
                                onClick={() => go('EVOLUTION_HISTORY')} 
                                className="w-64 bg-white p-6 rounded-[2.5rem] border border-white shadow-xl shadow-nature-900/5 flex flex-col items-center text-center group active:scale-95 transition-all"
                            >
                                <div className="w-full flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black text-nature-400 uppercase tracking-widest">{layer.label}</span>
                                    {renderTrend(layer.state.trend as any)}
                                </div>

                                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">
                                    {layer.state.symbol}
                                </div>

                                <h4 className="text-lg font-bold text-nature-900 mb-1">{layer.state.label}</h4>
                                <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mb-6">{layer.period}</p>

                                <div className="w-full h-1 bg-nature-50 rounded-full overflow-hidden mb-6">
                                    <div 
                                        className="h-full bg-nature-900 transition-all duration-1000" 
                                        style={{ width: `${layer.progress}%` }}
                                    />
                                </div>

                                <div className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-nature-400">
                                    <span>Progresso</span>
                                    <span className="text-nature-900 font-bold">{layer.progress}%</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation Menu */}
                <div className="mt-4 px-6 space-y-3 pb-32">
                    <button onClick={() => go('EVOLUTION_ANALYTICS')} className="w-full p-6 bg-white rounded-[2rem] border border-white shadow-sm flex items-center justify-between group active:bg-nature-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                                <TrendingUp size={24} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-sm text-nature-900">Métricas de Almas</h4>
                                <p className="text-[10px] text-nature-400 uppercase font-black tracking-widest">Análise Analítica Leve</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-nature-300 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => go('EVOLUTION_ACHIEVEMENTS')} className="w-full p-6 bg-white rounded-[2rem] border border-white shadow-sm flex items-center justify-between group active:bg-nature-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                                <Minus size={24} /> {/* Placeholder for Star/Medal */}
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-sm text-nature-900">Conquistas & Marcos</h4>
                                <p className="text-[10px] text-nature-400 uppercase font-black tracking-widest">Sementes e Cristais</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-nature-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="space-y-4">
                        <h4 className="font-serif italic text-nature-900 px-2">Linha do Tempo</h4>
                        {data.recentSnaps.map(snap => (
                            <button key={snap.id} onClick={() => go('TIME_LAPSE_EXPERIENCE')} className="w-full p-4 bg-white rounded-2xl border border-white shadow-sm flex items-center gap-4 group active:scale-95 transition-all">
                                <img src={snap.image} alt="Snap" className="w-16 h-16 rounded-xl object-cover" />
                                <div className="text-left flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">{new Date(snap.date).toLocaleDateString()}</p>
                                        <span className="text-xs">{snap.mood === 'VIBRANTE' ? '🔥' : '🌱'}</span>
                                    </div>
                                    <h5 className="font-bold text-sm text-nature-900 line-clamp-1">{snap.note || 'Momento de conexão'}</h5>
                                </div>
                                <ChevronRight size={16} className="text-nature-300" />
                            </button>
                        ))}
                    </div>

                    <button onClick={() => go('EVOLUTION_HISTORY')} className="w-full mt-4 p-6 bg-nature-900 rounded-[2rem] text-white flex items-center justify-between group active:scale-95 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                <TrendingUp size={24} className="rotate-90" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-sm">Histórico Completo</h4>
                                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Ver Todas as Memórias</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-white/30 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

            </div>
        </PortalView>
    );
};
