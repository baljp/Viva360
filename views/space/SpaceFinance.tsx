import React, { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3, Users, Wallet, AlertTriangle, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { ViewState, Transaction } from '../../types';
import { PortalView } from '../../components/Common';

interface SpaceFinanceProps {
    view: ViewState;
    setView: (v: ViewState) => void;
    transactions: Transaction[];
    flow: any;
}

export const SpaceFinance: React.FC<SpaceFinanceProps> = ({ view, setView, transactions, flow }) => {
    const navigateTo = (screen: string) => flow.go(screen);
    const notify = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') =>
        flow?.notify?.(title, message, type);

    const showImplementing = (feature: string) => {
        notify('Em Implementação', `${feature} estará disponível em breve.`, 'info');
    };

    // ── Derive all metrics from real transactions ──
    const metrics = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income');
        const expenses = transactions.filter(t => t.type !== 'income');
        const totalIncome = income.reduce((s, t) => s + Number(t.amount || 0), 0);
        const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount || 0), 0);
        const pending = transactions
            .filter(t => String((t as any).status || '').toLowerCase() === 'pending')
            .reduce((s, t) => s + Number(t.amount || 0), 0);

        // Guardian repasses (60% share, platform keeps 40%)
        const repasses = totalIncome * 0.66;
        const commission = totalIncome * 0.34;

        // Avg ticket
        const avgTicket = income.length > 0 ? Math.round(totalIncome / income.length) : 0;

        // Growth: this month vs last month income
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        const monthIncome = (m: number, y: number) => income
            .filter(t => { const d = new Date((t as any).date || (t as any).created_at || ''); return d.getMonth() === m && d.getFullYear() === y; })
            .reduce((s, t) => s + Number(t.amount || 0), 0);
        const cur = monthIncome(thisMonth, thisYear);
        const prev = monthIncome(lastMonth, lastMonthYear);
        const growthPct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;

        // Rooms from state (occupancy per room)
        return { totalIncome, totalExpenses, repasses, commission, pending, avgTicket, growthPct };
    }, [transactions]);

    // Team occupancy from real team data (passed via flow state)
    const teamOccupancy = useMemo(() => {
        const team = flow?.state?.data?.team || [];
        return team.slice(0, 3).map((p: any) => ({
            name: p.name || 'Guardião',
            role: Array.isArray(p.specialty) ? (p.specialty[0] || 'Terapia') : (p.specialty || 'Terapia'),
            occ: Math.min(100, Math.max(0, Number(p.occupancyPct || p.occupancy || (p.karma > 800 ? 92 : 75)))),
        }));
    }, [flow?.state?.data?.team]);

    // Room occupancy from state
    const rooms = useMemo(() => {
        const rs = flow?.state?.data?.rooms || [];
        if (rs.length === 0) return [];
        return rs.slice(0, 4).map((r: any) => ({
            name: r.name || 'Altar',
            level: Number(r.occupancyPct || r.occupancy_pct || (r.status === 'occupied' ? 78 : 40)),
            color: r.status === 'occupied' ? 'bg-emerald-500' : r.status === 'maintenance' ? 'bg-stone-400' : 'bg-indigo-400',
        }));
    }, [flow?.state?.data?.rooms]);

    const fmt = (n: number) => n.toLocaleString('pt-BR');

    return (
        <PortalView title="Painel de Prosperidade" subtitle="GESTÃO FINANCEIRA & OPERACIONAL" onBack={() => flow.go('EXEC_DASHBOARD')}>
            <div className="space-y-6">

                {/* 1. HEADER */}
                <div className="bg-nature-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-12 translate-x-12"></div>
                    <Wallet size={120} className="absolute -right-6 -bottom-6 opacity-5 rotate-12" />
                    <div className="relative z-10 space-y-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-400 mb-2">Faturamento Total</p>
                            <h3 className="text-4xl font-serif italic text-white">
                                {metrics.totalIncome > 0 ? `R$ ${fmt(Math.round(metrics.totalIncome))}` : '—'}
                                <span className="text-xl text-primary-400 opacity-60">,00</span>
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Ticket Médio', value: metrics.avgTicket > 0 ? `R$ ${fmt(metrics.avgTicket)}` : '—', icon: Wallet },
                                {
                                    label: 'Crescimento',
                                    value: metrics.growthPct !== null ? `${metrics.growthPct >= 0 ? '+' : ''}${metrics.growthPct}%` : '—',
                                    icon: TrendingUp,
                                    highlight: metrics.growthPct !== null && metrics.growthPct >= 0
                                },
                                { label: 'A Receber', value: metrics.pending > 0 ? `R$ ${fmt(Math.round(metrics.pending))}` : 'R$ 0', icon: Clock },
                                { label: 'Guardiões', value: String(flow?.state?.data?.team?.length || '—'), icon: Users },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-bold uppercase text-primary-200/70 mb-1">{stat.label}</p>
                                    <div className={`text-sm font-bold flex items-center gap-1 ${stat.highlight ? 'text-emerald-400' : 'text-white'}`}>
                                        {stat.value}
                                        {stat.highlight && <ArrowUpRight size={10} />}
                                        {metrics.growthPct !== null && metrics.growthPct < 0 && stat.label === 'Crescimento' && <ArrowDownRight size={10} className="text-rose-400" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. ROOM OCCUPANCY */}
                {rooms.length > 0 && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={14} /> Ocupação dos Altares</h4>
                            <button onClick={() => navigateTo('AGENDA_OVERVIEW')} className="text-[10px] font-bold text-indigo-600 hover:underline">Ver detalhada</button>
                        </div>
                        <div className="space-y-4">
                            {rooms.map(room => (
                                <div key={room.name} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-nature-600">
                                        <span>{room.name}</span><span>{room.level}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-nature-50 rounded-full overflow-hidden">
                                        <div className={`h-full ${room.color} rounded-full transition-all duration-1000`} style={{ width: `${room.level}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. CAPACIDADE OPERACIONAL */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={14} /> Operações Rápidas</h4>
                    <div className="flex gap-2">
                        {[
                            { label: 'Abrir Horários', icon: Calendar, action: () => navigateTo('AGENDA_OVERVIEW') },
                            { label: 'Criar Evento', icon: Users, action: () => navigateTo('EVENT_CREATE') },
                            { label: 'Bloquear', icon: AlertTriangle, action: () => showImplementing('Bloqueio de horários') }
                        ].map(act => (
                            <button key={act.label} onClick={act.action} className="flex-1 py-3 border border-nature-100 rounded-xl flex flex-col items-center gap-1 hover:bg-nature-50 transition-colors active:scale-95">
                                <act.icon size={14} className="text-nature-400" />
                                <span className="text-[9px] font-bold text-nature-600 uppercase tracking-tight">{act.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. TEAM PERFORMANCE */}
                {teamOccupancy.length > 0 && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                        <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={14} /> Performance da Equipe</h4>
                        <div className="space-y-3">
                            {teamOccupancy.map((g, i) => (
                                <button key={i} onClick={() => flow.go('PROS_LIST')} className="w-full flex justify-between items-center p-3 hover:bg-nature-50 rounded-2xl transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-nature-100 flex items-center justify-center text-[10px] font-bold text-nature-600">{g.name[0]}</div>
                                        <div className="text-left">
                                            <h5 className="text-xs font-bold text-nature-900 group-hover:text-indigo-600 transition-colors">{g.name}</h5>
                                            <p className="text-[9px] text-nature-400 uppercase">{g.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${g.occ > 90 ? 'text-emerald-600' : 'text-nature-600'}`}>{g.occ}%</span>
                                        <div className="w-16 h-1.5 bg-nature-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-nature-900 rounded-full" style={{ width: `${g.occ}%` }}></div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. FINANCIAL FLOW */}
                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-[2.5rem] border border-indigo-100/50 space-y-4">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} /> Fluxo do Período</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                            <span className="text-xs text-nature-600">Entradas Totais</span>
                            <span className="text-sm font-bold text-nature-900">{metrics.totalIncome > 0 ? `R$ ${fmt(Math.round(metrics.totalIncome))}` : '—'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                            <span className="text-xs text-nature-600">Repasse Guardiões (66%)</span>
                            <span className="text-sm font-bold text-nature-900">- {metrics.repasses > 0 ? `R$ ${fmt(Math.round(metrics.repasses))}` : '—'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                            <span className="text-xs text-nature-600">Comissão Santuário (34%)</span>
                            <span className="text-sm font-bold text-emerald-600">+ {metrics.commission > 0 ? `R$ ${fmt(Math.round(metrics.commission))}` : '—'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-xs text-nature-600 font-medium">Recebimentos Pendentes</span>
                            <span className="text-sm font-bold text-amber-500">{metrics.pending > 0 ? `R$ ${fmt(Math.round(metrics.pending))}` : 'R$ 0'}</span>
                        </div>
                    </div>
                    {metrics.totalIncome === 0 && (
                        <p className="text-center text-[10px] text-nature-300 italic">Dados financeiros reais disponíveis após as primeiras transações</p>
                    )}
                    <div className="flex flex-col gap-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => navigateTo('FINANCE_OVERVIEW')} className="py-3 bg-white border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-600 uppercase hover:bg-indigo-50 transition-colors">Ver Extrato</button>
                            <button onClick={() => showImplementing('Solicitação de saque')} className="py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors active:scale-95">Solicitar Saque</button>
                        </div>
                        <button onClick={() => showImplementing('Exportação contábil')} className="w-full py-3 bg-nature-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors">
                            Exportar p/ Contabilidade
                        </button>
                    </div>
                </div>

                {/* 6. OPERATIONAL ALERTS */}
                <div className="bg-amber-50/50 p-6 rounded-[2.5rem] border border-amber-100">
                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-3"><AlertTriangle size={14} /> Alertas</h4>
                    <div className="space-y-2">
                        {metrics.pending > 0 ? (
                            <div className="flex items-start gap-2 text-xs text-nature-700 bg-white/60 p-2 rounded-xl">
                                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                <span className="leading-tight">R$ {fmt(Math.round(metrics.pending))} em recebimentos pendentes de confirmação</span>
                            </div>
                        ) : null}
                        {(flow?.state?.data?.team?.length || 0) === 0 ? (
                            <div className="flex items-start gap-2 text-xs text-nature-700 bg-white/60 p-2 rounded-xl">
                                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                <span className="leading-tight">Nenhum guardião registrado. Convide guardiões para aumentar o faturamento.</span>
                            </div>
                        ) : null}
                        {metrics.totalIncome === 0 && (
                            <div className="flex items-start gap-2 text-xs text-nature-700 bg-white/60 p-2 rounded-xl">
                                <CheckCircle2 size={14} className="text-indigo-500 shrink-0" />
                                <span className="leading-tight">Configure sua conta financeira para receber os primeiros repasses.</span>
                            </div>
                        )}
                        {metrics.totalIncome > 0 && metrics.pending === 0 && (
                            <div className="flex items-start gap-2 text-xs text-nature-700 bg-white/60 p-2 rounded-xl">
                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                <span className="leading-tight">Sem alertas financeiros no momento. Tudo em dia!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PortalView>
    );
};
