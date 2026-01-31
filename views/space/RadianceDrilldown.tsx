import React from 'react';
import { ChevronLeft, Award, TrendingUp, Heart, Users, BarChart3, ArrowUpRight, Zap, Target } from 'lucide-react';
import { PortalView } from '../../components/Common';

export const RadianceDrilldown: React.FC<{ flow: any }> = ({ flow }) => {
    const metrics = [
        { label: 'Harmonia da Equipe', score: 95, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50', desc: 'Sincronia entre rituais e atendimentos.' },
        { label: 'Ocupação de Altares', score: 88, icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Uso eficiente dos espaços físicos.' },
        { label: 'Satisfação das Almas', score: 98, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', desc: 'NPS e feedback pós-atendimento.' },
        { label: 'Impacto Comunitário', score: 92, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Participação em círculos e trocas.' }
    ];

    return (
        <PortalView title="Mestria de Radiância" subtitle="INDICADORES DE SAÚDE DO ESPAÇO" onBack={() => flow.go('EXEC_DASHBOARD')}>
            <div className="space-y-8 pb-32">
                {/* Hero Score */}
                <div className="bg-nature-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-12 translate-x-12 animate-pulse"></div>
                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                             Nível de Vibração Global
                        </div>
                        <h3 className="text-7xl font-serif italic tracking-tighter">94 <span className="text-2xl not-italic opacity-40">/100</span></h3>
                        <div className="flex justify-center items-center gap-2 text-emerald-400">
                            <ArrowUpRight size={18} />
                            <span className="text-sm font-bold">+12.4% este mês</span>
                        </div>
                    </div>
                </div>

                {/* Detailed Sections */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Dimensões de Luz</h4>
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-white p-6 rounded-[3rem] border border-nature-100 shadow-sm flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className={`w-16 h-16 ${m.bg} ${m.color} rounded-[1.5rem] flex items-center justify-center shrink-0`}>
                                <m.icon size={28} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-bold text-nature-900 text-sm">{m.label}</h5>
                                    <span className={`font-black text-lg ${m.color}`}>{m.score}%</span>
                                </div>
                                <p className="text-[10px] text-nature-400 leading-tight mb-3">{m.desc}</p>
                                <div className="h-1.5 w-full bg-nature-50 rounded-full overflow-hidden">
                                     <div className={`h-full ${m.color.replace('text-', 'bg-')} rounded-full transition-all duration-[2000ms]`} style={{ width: `${m.score}%` }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Predictive Target */}
                <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[3.5rem] border border-indigo-100/50 flex flex-col items-center text-center gap-4 relative overflow-hidden">
                     <Target size={120} className="absolute -left-10 -bottom-10 opacity-5" />
                     <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                          <Award size={24} />
                     </div>
                     <div>
                         <h4 className="font-bold text-nature-900">Meta: Nível Phoenix (98)</h4>
                         <p className="text-[10px] text-nature-500 max-w-[220px] mx-auto mt-1 leading-relaxed">Mantenha a taxa de cupação acima de 85% por mais 12 dias para atingir a graduação máxima.</p>
                     </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button className="py-4 bg-white border border-nature-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-nature-400 hover:bg-nature-50 transition-colors">Ver Histórico</button>
                    <button className="py-4 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all">Relatório Completo</button>
                </div>
            </div>
        </PortalView>
    );
};
