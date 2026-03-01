import React from 'react';
import { ChevronLeft, TrendingUp, Clock, Calendar, Zap, AlertCircle } from 'lucide-react';

export const PredictiveOccupancy: React.FC<{ flow: { go: (s: string) => void } }> = ({ flow }) => {
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    const demandData = import.meta.env.VITE_MOCK_ENABLED === 'true'
    ? [
        { day: 'Seg', value: 65 }, { day: 'Ter', value: 80 },
        { day: 'Qua', value: 75 }, { day: 'Qui', value: 90 },
        { day: 'Sex', value: 85 }, { day: 'Sáb', value: 70 },
        { day: 'Dom', value: 45 },
      ]
    : []; // Populated from api.spaces.getAnalytics() in production

    const getIntensityColor = (value: number) => {
        if (value >= 90) return 'bg-indigo-600';
        if (value >= 75) return 'bg-indigo-400';
        if (value >= 50) return 'bg-indigo-200';
        if (value >= 25) return 'bg-indigo-100';
        return 'bg-nature-50';
    };

    return (
        <div className="flex flex-col h-full bg-[#fcfdfc] animate-in fade-in">
            <header className="p-6 flex items-center justify-between border-b border-nature-100 bg-white sticky top-0 z-10">
                <button onClick={() => flow.go('EXEC_DASHBOARD')} className="p-2 hover:bg-nature-50 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-nature-900" />
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest leading-none mb-1">Inteligência Preditiva</p>
                    <h2 className="text-lg font-serif italic text-nature-900 leading-none">Ocupação do Espaço</h2>
                </div>
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <TrendingUp size={18} />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                {/* Insights Hero */}
                <div className="bg-indigo-900 rounded-[3rem] p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap size={14} className="text-amber-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Insight Phoenix</span>
                        </div>
                        <h3 className="text-2xl font-serif italic mb-2">Pico esperado em 48h</h3>
                        <p className="text-sm text-indigo-100 opacity-80">A demanda histórica sugere 95% de ocupação na Terça-feira às 14:00. Considere ativar promoções para os horários de vale (10:00 - 12:00).</p>
                    </div>
                </div>

                {/* Heatmap Section */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-nature-400">Mapa de Calor Semanal</h4>
                        <div className="flex gap-2">
                             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-600 rounded-full"></div><span className="text-[9px] font-bold text-nature-400 uppercase">Alta</span></div>
                             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-nature-100 rounded-full"></div><span className="text-[9px] font-bold text-nature-400 uppercase">Baixa</span></div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm overflow-x-auto">
                        <div className="min-w-[400px]">
                            <div className="grid grid-cols-8 gap-2 mb-2">
                                <div className="h-8"></div>
                                {days.map(d => (
                                    <div key={d} className="h-8 flex items-center justify-center text-[10px] font-black text-nature-900">{d}</div>
                                ))}
                            </div>
                            {hours.map((h, hIdx) => (
                                <div key={h} className="grid grid-cols-8 gap-2 mb-2">
                                    <div className="h-10 flex items-center text-[9px] font-bold text-nature-400">{h}</div>
                                    {days.map((d, dIdx) => (
                                        <div 
                                            key={`${d}-${h}`} 
                                            className={`h-10 rounded-xl transition-all hover:scale-105 cursor-help ${getIntensityColor(demandData[dIdx][hIdx])}`}
                                            title={`${d} ${h}: ${demandData[dIdx][hIdx]}% de demanda`}
                                        ></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Optimization Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 border-dashed flex flex-col gap-3">
                         <Clock size={24} className="text-emerald-600" />
                         <h5 className="font-bold text-emerald-900 text-xs">Otimizar Turnos</h5>
                         <p className="text-[10px] text-emerald-700 leading-relaxed">Sugestão: Adicionar um Guardião extra nas noites de Sábado.</p>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 border-dashed flex flex-col gap-3">
                         <Calendar size={24} className="text-amber-600" />
                         <h5 className="font-bold text-amber-900 text-xs">Vagas Sazonais</h5>
                         <p className="text-[10px] text-amber-700 leading-relaxed">Alta procura por Yoga nas manhãs de Quinta. Abrir novas vagas?</p>
                    </div>
                </div>

                <button onClick={() => flow.go('ROOM_AGENDA')} className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                    Sincronizar com Agenda
                </button>
            </div>
        </div>
    );
};
