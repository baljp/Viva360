import React, { useState } from 'react';
import { User } from '../../types';
import { BarChart3, TrendingUp, TrendingDown, Users, Calendar, DollarSign, Star, Activity, Clock } from 'lucide-react';
import { useSantuarioFlow } from '../../src/flow/useSantuarioFlow';
import { api } from '../../services/api';
import { SpaceAnalyticsDTO } from '../../types';

interface MetricCard { label: string; value: string; change: number | null; icon: React.ElementType; color: string; }

type AnalyticsData = SpaceAnalyticsDTO & {
    // period comparisons (optional, returned by API)
    prevAppointments?: number;
    prevRevenue?: number;
    prevOccupancy?: number;
    monthlyTrend?: Array<{ month: string; value: number }>;
};

const pctChange = (cur: number, prev: number): number | null => {
    if (!prev || !cur) return null;
    return Math.round(((cur - prev) / prev) * 100);
};

// Last 6 months labels dynamically
const last6Months = (): string[] => {
    const months: string[] = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
        const t = new Date(d.getFullYear(), d.getMonth() - i, 1);
        months.push(t.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toLowerCase());
    }
    return months;
};

export const SpaceAnalyticsDash: React.FC<{ user: User }> = ({ user }) => {
    const { back } = useSantuarioFlow();
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [stats, setStats] = useState<AnalyticsData>({
        appointments: 0, revenue: 0, buscadores: 0, occupancy: 0,
        avgRating: 0, avgDuration: '—',
        topGuardians: [], roomOccupancy: [], monthlyTrend: []
    });
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        setLoading(true);
        api.spaces.getAnalytics()
            .then((data: SpaceAnalyticsDTO) => { if (data) setStats(data as AnalyticsData); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [period]);

    const metrics: MetricCard[] = [
        {
            label: 'Atendimentos',
            value: String(stats.appointments || 0),
            change: pctChange(stats.appointments || 0, stats.prevAppointments || 0),
            icon: Activity, color: 'bg-emerald-50 text-emerald-600'
        },
        {
            label: 'Receita',
            value: (stats.revenue || 0) > 0 ? `R$ ${((stats.revenue || 0) / 1000).toFixed(1)}k` : '—',
            change: pctChange(stats.revenue || 0, stats.prevRevenue || 0),
            icon: DollarSign, color: 'bg-indigo-50 text-indigo-600'
        },
        {
            label: 'Buscadores Ativos',
            value: String(stats.buscadores || 0),
            change: null,
            icon: Users, color: 'bg-amber-50 text-amber-600'
        },
        {
            label: 'Taxa Ocupação',
            value: `${stats.occupancy || 0}%`,
            change: pctChange(stats.occupancy || 0, stats.prevOccupancy || 0),
            icon: Calendar, color: 'bg-rose-50 text-rose-600'
        },
        {
            label: 'Avaliação Média',
            value: (stats.avgRating || 0) > 0 ? String((stats.avgRating || 0).toFixed ? (stats.avgRating as number).toFixed(1) : stats.avgRating) : '—',
            change: null,
            icon: Star, color: 'bg-purple-50 text-purple-600'
        },
        {
            label: 'Duração Média',
            value: stats.avgDuration || '—',
            change: null,
            icon: Clock, color: 'bg-blue-50 text-blue-600'
        },
    ];

    const topGuardians = stats.topGuardians?.length ? stats.topGuardians : [];
    const roomOccupancy = stats.roomOccupancy?.length ? stats.roomOccupancy : [];

    // Monthly trend: prefer API data, else derive from last 6 months labels with zeros
    const monthLabels = last6Months();
    const apiTrend = Array.isArray(stats.monthlyTrend) && stats.monthlyTrend.length > 0;
    const monthlyTrend = apiTrend
        ? stats.monthlyTrend!
        : monthLabels.map((month, i) => ({
            month,
            value: i === monthLabels.length - 1 ? (stats.appointments || 0) : 0
        }));
    const maxTrend = Math.max(1, ...monthlyTrend.map((m: { month: string; value: number }) => m.value));

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
                                {m.change !== null ? (
                                    <div className={`flex items-center gap-1 text-[10px] font-bold ${m.change >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {m.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {m.change >= 0 ? '+' : ''}{m.change}%
                                    </div>
                                ) : (
                                    <div className="text-[9px] text-nature-200 font-bold uppercase">—</div>
                                )}
                            </div>
                            <p className="text-xl font-bold text-nature-900">{loading ? '…' : m.value}</p>
                            <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest mt-1">{m.label}</p>
                        </div>
                    ))}
                </div>

                {/* Monthly Trend */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest">Tendência de Atendimentos</h3>
                        {!apiTrend && !loading && (
                            <span className="text-[9px] text-nature-200 italic">Histórico disponível após 6 meses</span>
                        )}
                    </div>
                    <div className="flex items-end justify-between gap-2 h-40">
                        {monthlyTrend.map((m: { month: string; value: number }, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-[9px] font-bold text-nature-500">{m.value > 0 ? m.value : ''}</span>
                                <div className="w-full bg-nature-50 rounded-t-xl relative overflow-hidden" style={{ height: `${Math.max(4, (m.value / maxTrend) * 100)}%` }}>
                                    <div className={`absolute inset-0 rounded-t-xl ${i === monthlyTrend.length - 1 ? 'bg-indigo-500' : m.value > 0 ? 'bg-nature-200' : 'bg-nature-50'}`}></div>
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
                            {roomOccupancy.map((r: { name: string; sessions: number; pct: number }, i: number) => (
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
                            {topGuardians.map((g, i) => (
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
                        <BarChart3 size={28} className="mx-auto text-nature-200 mb-3" />
                        <p className="text-sm text-nature-500 italic">Os dados detalhados serão exibidos conforme atendimentos e salas forem cadastrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
