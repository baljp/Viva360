import React, { useState } from 'react';
import { User } from '../../types';
import { BarChart3, TrendingUp, TrendingDown, Users, Calendar, DollarSign, Star, Activity, Clock } from 'lucide-react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { api } from '../../services/api';

interface MetricCard { label: string; value: string; change: number; icon: any; color: string; }

export const SpaceAnalyticsDash: React.FC<{ user: User }> = ({ user }) => {
    const { back } = useSantuarioFlow();
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [stats, setStats] = useState<any>({
        appointments: 0, revenue: 0, guardians: 0, occupancy: 0,
        buscadores: 0, avgRating: 0, avgDuration: '50min',
        topGuardians: [], roomOccupancy: []
    });
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        setLoading(true);
        api.spaces.getAnalytics()
            .then(data => { if (data) setStats(data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const metrics: MetricCard[] = [
        { label: 'Atendimentos', value: String(stats.appointments || 0), change: 12, icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Receita', value: `R$ ${((stats.revenue || 0) / 1000).toFixed(1)}k`, change: 8, icon: DollarSign, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Buscadores Ativos', value: String(stats.buscadores || 0), change: 15, icon: Users, color: 'bg-amber-50 text-amber-600' },
        { label: 'Taxa Ocupação', value: `${stats.occupancy || 0}%`, change: -3, icon: Calendar, color: 'bg-rose-50 text-rose-600' },
        { label: 'Avaliação Média', value: stats.avgRating > 0 ? String(stats.avgRating) : '—', change: 2, icon: Star, color: 'bg-purple-50 text-purple-600' },
        { label: 'Tempo Médio Sessão', value: stats.avgDuration || '—', change: 5, icon: Clock, color: 'bg-blue-50 text-blue-600' },
    ];

    const topGuardians = stats.topGuardians?.length > 0 ? stats.topGuardians : [];
    const roomOccupancy = stats.roomOccupancy?.length > 0 ? stats.roomOccupancy : [];
    const monthlyTrend = [
        { month: 'Set', value: 62 }, { month: 'Out', value: 71 }, { month: 'Nov', value: 68 },
        { month: 'Dez', value: 85 }, { month: 'Jan', value: 79 }, { month: 'Fev', value: stats.appointments || 0 },
    ];
    const maxTrend = Math.max(1, ...monthlyTrend.map(m => m.value));

    return (
        <div className="min-h-screen bg-[#f8faf9] pb-32">
            <header className="bg-gradient-to-br from-nature-900 to-indigo-900 px-6 pt-14 pb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <button onClick={back} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white mb-6 active:scale-95">←</button>
                <div className="flex items-center gap-3 mb-2">
                    <BarChart3 size={24} className="text-indigo-300" />
                    <h1 className="text-3xl font-serif italic text-white">Analytics</h1>
                </div>
                <p className="text-indigo-200/70 text-xs font-bold uppercase tracking-widest">Visão Holística do Santuário</p>
            </header>

            <div className="px-4 -mt-4 mb-4">
                <div className="flex p-1 bg-white rounded-2xl border border-nature-100 shadow-sm">
                    {(['week', 'month', 'year'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${period === p ? 'bg-nature-900 text-white shadow-md' : 'text-nature-400'}`}>
                            {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="px-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    {metrics.map((m, i) => (
                        <div key={i} className={`bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm ${loading ? 'animate-pulse' : ''}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}><m.icon size={18} /></div>
                                <div className={`flex items-center gap-1 text-[10px] font-bold ${m.change > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {m.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {m.change > 0 ? '+' : ''}{m.change}%
                                </div>
                            </div>
                            <p className="text-xl font-bold text-nature-900">{m.value}</p>
                            <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest mt-1">{m.label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-6">Tendência de Atendimentos</h3>
                    <div className="flex items-end justify-between gap-2 h-40">
                        {monthlyTrend.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-[9px] font-bold text-nature-500">{m.value}</span>
                                <div className="w-full bg-nature-50 rounded-t-xl relative overflow-hidden" style={{ height: `${(m.value / maxTrend) * 100}%` }}>
                                    <div className={`absolute inset-0 rounded-t-xl ${i === monthlyTrend.length - 1 ? 'bg-indigo-500' : 'bg-nature-200'}`}></div>
                                </div>
                                <span className="text-[9px] font-bold text-nature-400 uppercase">{m.month}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {roomOccupancy.length > 0 && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                        <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-4">Ocupação por Altar</h3>
                        <div className="space-y-4">
                            {roomOccupancy.map((r: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-nature-900">{r.name}</span>
                                        <span className="text-xs text-nature-500">{r.sessions} sessões • <span className="font-bold">{r.pct}%</span></span>
                                    </div>
                                    <div className="w-full h-3 bg-nature-50 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${r.pct > 80 ? 'bg-amber-500' : r.pct > 50 ? 'bg-emerald-500' : 'bg-indigo-400'}`} style={{ width: `${r.pct}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {topGuardians.length > 0 && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                        <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-4">Top Guardiões</h3>
                        <div className="space-y-3">
                            {topGuardians.map((g: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-nature-50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-nature-100 flex items-center justify-center text-xs font-black text-nature-600">#{i + 1}</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-nature-900 text-sm">{g.name}</h4>
                                        <p className="text-[10px] text-nature-400">{g.sessions} sessões • {g.revenue}</p>
                                    </div>
                                    <div className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" /><span className="text-xs font-bold">{g.rating}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {!loading && topGuardians.length === 0 && roomOccupancy.length === 0 && (
                    <div className="bg-white p-8 rounded-[2.5rem] border border-nature-100 text-center">
                        <p className="text-sm text-nature-500 italic">Os dados detalhados serão exibidos conforme atendimentos e salas forem cadastrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
