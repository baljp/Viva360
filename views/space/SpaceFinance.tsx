import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3, Filter, Users, Wallet, AlertTriangle, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { ViewState, Transaction } from '../../types';
import { PortalView, ZenToast } from '../../components/Common';

interface SpaceFinanceProps {
    view: ViewState;
    setView: (v: ViewState) => void;
    transactions: Transaction[];
    flow: any;
}

export const SpaceFinance: React.FC<SpaceFinanceProps> = ({ view, setView, transactions, flow }) => {
    const [toast, setToast] = useState<{title: string, message: string, type?: 'success' | 'warning' | 'info'} | null>(null);

    const handleAction = (action: string) => {
        setToast({ title: 'Ação Iniciada', message: `Processando: ${action}`, type: 'info' });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <PortalView title="Painel de Prosperidade" subtitle="GESTÃO FINANCEIRA & OPERACIONAL" onBack={() => flow.go('EXEC_DASHBOARD')}>
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            <div className="space-y-6">
                {/* 1. VISÃO GERAL (HEADER EXECUTIVO) */}
                <div className="bg-nature-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-12 translate-x-12"></div>
                    <Wallet size={120} className="absolute -right-6 -bottom-6 opacity-5 rotate-12" />
                    
                    <div className="relative z-10 space-y-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-400 mb-2">Faturamento do Período</p>
                            <h3 className="text-4xl font-serif italic text-white">R$ 24.850<span className="text-xl text-primary-400 opacity-60">,00</span></h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Média p/ Sala', value: 'R$ 4.200', icon: BarChart3 },
                                { label: 'Crescimento', value: '+12%', icon: TrendingUp, highlight: true },
                                { label: 'Ticket Médio', value: 'R$ 135', icon: Wallet },
                                { label: 'Taxa Ocupação', value: '78%', icon: Users }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-bold uppercase text-primary-200/70 mb-1">{stat.label}</p>
                                    <div className={`text-sm font-bold flex items-center gap-1 ${stat.highlight ? 'text-emerald-400' : 'text-white'}`}>
                                        {stat.value}
                                        {stat.highlight && <ArrowUpRight size={10} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. OCUPAÇÃO DOS ALTARES */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={14}/> Ocupação Semanal</h4>
                        <button onClick={() => handleAction('Ver Agenda')} className="text-[10px] font-bold text-indigo-600 hover:underline">Ver detalhada</button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: 'Altar Gaia', level: 82, color: 'bg-emerald-500' },
                            { name: 'Altar Sol', level: 74, color: 'bg-amber-500' },
                            { name: 'Altar Lua', level: 65, color: 'bg-indigo-500' },
                            { name: 'Altar Terra', level: 91, color: 'bg-stone-500' }
                        ].map(altar => (
                            <div key={altar.name} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-nature-600">
                                    <span>{altar.name}</span>
                                    <span>{altar.level}%</span>
                                </div>
                                <div className="h-2 w-full bg-nature-50 rounded-full overflow-hidden">
                                    <div className={`h-full ${altar.color} rounded-full transition-all duration-1000`} style={{ width: `${altar.level}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. CAPACIDADE OPERACIONAL */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={14}/> Capacidade Operacional</h4>
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 p-3 bg-nature-50 rounded-2xl border border-nature-100 text-center">
                            <span className="block text-xl font-bold text-nature-900">320h</span>
                            <span className="text-[8px] font-bold text-nature-400 uppercase">Disponíveis</span>
                        </div>
                        <div className="flex-1 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                            <span className="block text-xl font-bold text-indigo-700">250h</span>
                            <span className="text-[8px] font-bold text-indigo-400 uppercase">Ocupadas</span>
                        </div>
                        <div className="flex-1 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                            <span className="block text-xl font-bold text-emerald-700">70h</span>
                            <span className="text-[8px] font-bold text-emerald-500 uppercase">Ociosa</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {[
                            { label: 'Abrir Horários', icon: Calendar },
                            { label: 'Criar Evento', icon: Users },
                            { label: 'Bloquear', icon: AlertTriangle }
                        ].map(act => (
                            <button key={act.label} onClick={() => handleAction(act.label)} className="flex-1 py-3 border border-nature-100 rounded-xl flex flex-col items-center gap-1 hover:bg-nature-50 transition-colors active:scale-95">
                                <act.icon size={14} className="text-nature-400" />
                                <span className="text-[9px] font-bold text-nature-600 uppercase tracking-tight">{act.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. PERFORMANCE DOS GUARDIÕES */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={14}/> Performance da Equipe</h4>
                    <div className="space-y-3">
                        {[
                            { name: 'Ana S.', role: 'Reiki', occ: 92 },
                            { name: 'Pedro L.', role: 'Yoga', occ: 88 },
                            { name: 'Maria C.', role: 'Theta', occ: 76 }
                        ].map((g, i) => (
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

                {/* 5. FLUXO FINANCEIRO */}
                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-[2.5rem] border border-indigo-100/50 space-y-4">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14}/> Fluxo do Período</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                            <span className="text-xs text-nature-600">Entradas Totais</span>
                            <span className="text-sm font-bold text-nature-900">R$ 24.850</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                            <span className="text-xs text-nature-600">Repasse Guardiões</span>
                            <span className="text-sm font-bold text-nature-900">- R$ 16.400</span>
                        </div>
                         <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                            <span className="text-xs text-nature-600">Comissão Santuário</span>
                            <span className="text-sm font-bold text-emerald-600">+ R$ 8.450</span>
                        </div>
                         <div className="flex justify-between items-center py-2">
                            <span className="text-xs text-nature-600 font-medium">Saques Pendentes</span>
                            <span className="text-sm font-bold text-amber-500">R$ 1.320</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleAction('Ver Extrato')} className="py-3 bg-white border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-600 uppercase hover:bg-indigo-50 transition-colors">Ver Extrato</button>
                            <button onClick={() => handleAction('Solicitar Saque')} className="py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors active:scale-95">Solicitar Saque</button>
                        </div>
                        <button 
                            onClick={() => {
                                handleAction('Gerando Relatório...');
                                setTimeout(() => {
                                    setToast({ title: 'Sucesso', message: 'Relatório Mensal consolidado e enviado para o e-mail cadastrado.', type: 'success' });
                                }, 2000);
                            }} 
                            className="w-full py-3 bg-nature-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
                        >
                            Exportar p/ Contabilidade
                        </button>
                    </div>
                </div>

                {/* 6. ALERTAS OPERACIONAIS */}
                <div className="bg-amber-50/50 p-6 rounded-[2.5rem] border border-amber-100">
                     <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-3"><AlertTriangle size={14}/> Alertas</h4>
                     <div className="space-y-2">
                        {[
                            { msg: 'Sala Terra com alta demanda amanhã', type: 'warn' },
                            { msg: 'Horários de sexta quase lotados', type: 'warn' },
                            { msg: 'Sugestão: abrir mais 2 janelas noturnas', type: 'idea' }
                        ].map((a, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-nature-700 bg-white/60 p-2 rounded-xl">
                                {a.type === 'warn' ? <AlertTriangle size={14} className="text-amber-500 shrink-0"/> : <CheckCircle2 size={14} className="text-indigo-500 shrink-0"/>}
                                <span className="leading-tight">{a.msg}</span>
                            </div>
                        ))}
                     </div>
                </div>

            </div>
        </PortalView>
    );
};
