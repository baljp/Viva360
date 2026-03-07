import React from 'react';
import { User } from '../../../types';
import { PortalView } from '../../../components/Common';
import { ChevronRight, TrendingUp, TrendingDown, Minus, Plus, Medal, BookOpen, Clapperboard, Sparkles } from 'lucide-react';
import { useEvolution } from '../../../src/hooks/useEvolution';
import { useIdbImageUrl } from '../../../src/hooks/useIdbImageUrl';
import { buildLocalImageKey } from '../../../src/utils/idbImageStore';
import { buildSoulJourneyModel } from './soulJourneyModel';

const SnapThumb: React.FC<{ snap: { id?: string | number; url?: string; image?: string; photoThumb?: string; date?: string } }> = ({ snap }) => {
    const key = snap?.id ? buildLocalImageKey(String(snap.id)) : null;
    const src = useIdbImageUrl(key, snap?.image || '');
    return <img src={src || snap?.image} alt="Snap" className="w-16 h-16 rounded-xl object-cover" />;
};

export const EvolutionView: React.FC<{ user: User }> = ({ user }) => {
    const { actions, data } = useEvolution(user);
    const { go } = actions;
    const { layers } = data;
    const model = buildSoulJourneyModel(user);

    const renderTrend = (trend: 'up' | 'down' | 'right') => {
        if (trend === 'up') return <TrendingUp size={14} className="text-emerald-500" />;
        if (trend === 'down') return <TrendingDown size={14} className="text-rose-500" />;
        return <Minus size={14} className="text-amber-500" />;
    };

    return (
        <PortalView title="Evolução" subtitle="SUA JORNADA VIVA" onBack={() => go('GARDEN_VIEW')} heroImage="https://images.unsplash.com/photo-1470252649378-b736a029c69d?q=80&w=800">
            <div className="flex flex-col h-full bg-nature-50/30">
                <section className="px-6 pt-8">
                    <div className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-[linear-gradient(135deg,#f5f8ff_0%,#ffffff_40%,#f6fbf8_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-nature-400">Evolução da Alma</p>
                                <h3 className="mt-2 text-4xl font-serif italic text-nature-900">{model.stageGlyph} Score {model.totalScore}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-nature-500">
                                    Uma leitura contínua da sua constância, do humor dominante e das memórias que merecem virar história.
                                </p>
                            </div>
                            <button
                                onClick={() => go('METAMORPHOSIS_CHECKIN')}
                                className="inline-flex items-center justify-center gap-2 rounded-[1.8rem] bg-nature-900 px-5 py-4 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-xl transition-all active:scale-95"
                            >
                                <Plus size={16} />
                                Novo Registro
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {model.metrics.map((metric) => (
                                <div key={metric.label} className="rounded-[1.6rem] border border-nature-100 bg-white/80 p-4 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-nature-400">{metric.label}</p>
                                    <p className="mt-2 text-lg font-bold text-nature-900">{metric.value}</p>
                                    <p className="mt-1 text-[11px] text-nature-400">{metric.helper}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

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
                                    {renderTrend((layer.state.trend as 'up' | 'down' | 'right') ?? 'right')}
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

                <div className="mt-2 px-6 grid gap-3 pb-6 lg:grid-cols-2">
                    <button onClick={() => go('CLIENT_JOURNAL')} className="w-full p-6 bg-white rounded-[2rem] border border-white shadow-sm flex items-center justify-between group active:bg-nature-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                                <BookOpen size={24} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-sm text-nature-900">Diário da Alma</h4>
                                <p className="text-[10px] text-nature-400 uppercase font-black tracking-widest">memórias e frases do ciclo</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-nature-300 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => go('TIME_LAPSE_EXPERIENCE')} className="w-full p-6 bg-white rounded-[2rem] border border-white shadow-sm flex items-center justify-between group active:bg-nature-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                                <Clapperboard size={24} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-sm text-nature-900">Time Lapse</h4>
                                <p className="text-[10px] text-nature-400 uppercase font-black tracking-widest">vídeo da sua evolução</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-nature-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="px-6 space-y-4 pb-32">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h4 className="font-serif italic text-nature-900">Linha do tempo recente</h4>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-nature-400">memórias prontas para replay e compartilhamento</p>
                        </div>
                        <button
                            onClick={() => go('EVOLUTION_ACHIEVEMENTS')}
                            className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700"
                        >
                            <Medal size={14} />
                            Marcos
                        </button>
                    </div>
                    <div className="space-y-4">
                        {data.recentSnaps.map(snap => (
                            <button key={snap.id} onClick={() => go('TIME_LAPSE_EXPERIENCE')} className="w-full p-4 bg-white rounded-2xl border border-white shadow-sm flex items-center gap-4 group active:scale-95 transition-all">
                                <SnapThumb snap={snap} />
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

                    <div className="grid gap-3 lg:grid-cols-2">
                        <button onClick={() => go('EVOLUTION_ANALYTICS')} className="w-full p-6 bg-white rounded-[2rem] border border-white shadow-sm flex items-center justify-between group active:bg-nature-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-sm text-nature-900">Métricas de Alma</h4>
                                    <p className="text-[10px] text-nature-400 uppercase font-black tracking-widest">visão leve do seu padrão</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-nature-300 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button onClick={() => go('EVOLUTION_HISTORY')} className="w-full p-6 bg-nature-900 rounded-[2rem] text-white flex items-center justify-between group active:scale-95 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Sparkles size={24} />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-sm">Histórico Completo</h4>
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">ver todas as metamorfoses</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-white/30 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

            </div>
        </PortalView>
    );
};
