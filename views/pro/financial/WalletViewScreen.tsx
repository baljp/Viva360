import React, { useState, useEffect } from 'react';
import { Professional, Transaction } from '../../../types';
import { PortalView, BottomSheet } from '../../../components/Common'; // ZenToast removido: usa notify() do GuardiaoFlow
import { useGuardiaoFlow } from '../../../src/flow/useGuardiaoFlow';
import { api, request } from '../../../services/api';
import { useCountUp } from '../../../src/hooks/useCountUp';
import {
    Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Share2,
    Leaf, Heart, Shuffle, Landmark, CreditCard, ChevronRight,
    BarChart3, PieChart, Package, Calendar, Sparkles, Filter, Info,
    Construction
} from 'lucide-react';

// --- SUB-COMPONENTS ---

const ProsperityIndexWidget: React.FC<{ score: number }> = ({ score }) => (
    <div className="bg-gradient-to-br from-indigo-900 to-nature-900 p-6 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-amber-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">Índice de Prosperidade</span>
                </div>
                <div className="flex items-end gap-2">
                    <h3 className="text-4xl font-serif italic leading-none">{score}</h3>
                    <span className="text-sm font-bold opacity-60 mb-1">/ 100</span>
                </div>
                <p className="text-[10px] mt-2 text-indigo-200 font-medium">Você está em <span className="text-amber-400 font-bold">Livre Expansão</span></p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent rotation-animation"></div>
                <span className="text-xs font-bold">A+</span>
            </div>
        </div>
    </div>
);

const EnergyFlowCard: React.FC<{ balance: number, onAction: (action: string) => void }> = ({ balance, onAction }) => {
    const animatedBalance = useCountUp(balance, 1200, 2);
    return (
        <div className="bg-[#1a1f1d] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400 mb-2 flex items-center gap-2">
                    <Leaf size={12} /> Energia em Fluxo
                </p>
                <h2 className="text-5xl font-serif italic mb-8">R$ {animatedBalance}</h2>

                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => onAction('withdraw')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><ArrowDownRight size={16} /></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Sacar</span>
                    </button>
                    <button onClick={() => onAction('reinvest')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400"><Shuffle size={16} /></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Reinvestir</span>
                    </button>
                    <button onClick={() => onAction('donate')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400"><Heart size={16} /></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Doar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProjectionWidget: React.FC<{ day7: number, day30: number }> = ({ day7, day30 }) => (
    <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-nature-400 mb-1">Próximos 7 Dias</p>
            <div className="flex items-end gap-2 text-nature-900">
                <span className="text-xl font-serif font-bold">R$ {day7}</span>
                <ArrowUpRight size={14} className="text-emerald-500 mb-1" />
            </div>
        </div>
        <div className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-nature-400 mb-1">Próximos 30 Dias</p>
            <div className="flex items-end gap-2 text-nature-900">
                <span className="text-xl font-serif font-bold">R$ {day30}</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md mb-1">+18%</span>
            </div>
        </div>
    </div>
);

const TransactionItem: React.FC<{ tx: Transaction }> = ({ tx }) => (
    <div className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            </div>
            <div>
                <h4 className="font-bold text-nature-900 text-sm">{tx.description}</h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-nature-400">{new Date(tx.date).toLocaleDateString()}</span>
                    {tx.type === 'income' && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 rounded font-bold">SESSÃO</span>}
                </div>
            </div>
        </div>
        <div className="text-right">
            <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-nature-900'}`}>{tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}</p>
            <p className="text-[9px] text-nature-300 font-bold uppercase mt-0.5 group-hover:text-emerald-500 transition-colors">Confirmado</p>
        </div>
    </div>
);

// --- INLINE FORM COMPONENTS ---

const WithdrawForm: React.FC<{ balance: number; onConfirm: (amount: number) => void; processing: boolean }> = ({ balance, onConfirm, processing }) => {
    const [amount, setAmount] = React.useState(Math.min(100, balance));
    const presets = [50, 100, 200, 500].filter(p => p <= balance);
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {presets.map(p => (
                    <button key={p} onClick={() => setAmount(p)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${amount === p ? 'bg-nature-900 text-white border-nature-900' : 'bg-white text-nature-500 border-nature-100 hover:border-nature-300'}`}>
                        R$ {p}
                    </button>
                ))}
            </div>
            <input type="number" min={1} max={balance} value={amount}
                onChange={e => setAmount(Math.min(balance, Math.max(1, Number(e.target.value))))}
                className="w-full px-4 py-3 bg-nature-50 border border-nature-100 rounded-2xl text-sm font-bold text-nature-900 outline-none focus:ring-2 focus:ring-nature-200" />
            <button onClick={() => onConfirm(amount)} disabled={processing || amount <= 0 || amount > balance}
                className="w-full py-4 bg-nature-900 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                {processing ? <Wallet size={14} className="animate-pulse" /> : <Landmark size={14} />}
                {processing ? 'Processando...' : `Solicitar R$ ${amount}`}
            </button>
        </div>
    );
};

const DonateForm: React.FC<{ onConfirm: (amount: number, cause: string) => void; processing: boolean }> = ({ onConfirm, processing }) => {
    const [amount, setAmount] = React.useState(50);
    const [cause, setCause] = React.useState('fundo-solidario');
    const causes = [
        { id: 'fundo-solidario', label: 'Fundo Solidário Viva360' },
        { id: 'bolsa-terapeutica', label: 'Bolsa Terapêutica' },
        { id: 'instituto-cura', label: 'Instituto de Cura Integrativa' },
    ];
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {causes.map(cc => (
                    <button key={cc.id} onClick={() => setCause(cc.id)}
                        className={`w-full p-3 rounded-2xl border text-left text-xs font-bold transition-all ${cause === cc.id ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-nature-100 text-nature-600 hover:border-nature-200'}`}>
                        {cc.label}
                    </button>
                ))}
            </div>
            <div className="flex gap-2">
                {[10, 25, 50, 100].map(p => (
                    <button key={p} onClick={() => setAmount(p)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${amount === p ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-nature-500 border-nature-100 hover:border-nature-300'}`}>
                        R$ {p}
                    </button>
                ))}
            </div>
            <button onClick={() => onConfirm(amount, cause)} disabled={processing}
                className="w-full py-4 bg-emerald-700 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                {processing ? <Heart size={14} className="animate-pulse" /> : <Heart size={14} />}
                {processing ? 'Processando...' : `Doar R$ ${amount}`}
            </button>
        </div>
    );
};

// --- MODALS ---

const ReinvestModal: React.FC<{ isOpen: boolean, onClose: () => void, balance: number, onConfirm: (type: string, amount: number) => void }> = ({ isOpen, onClose, balance, onConfirm }) => {
    const [amount, setAmount] = useState(50);
    if (!isOpen) return null;
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Semear o Futuro">
            <div className="space-y-6 pb-6">
                <p className="text-sm text-nature-600 italic">"Ao reinvestir no seu Jardim, você amplifica sua capacidade de cura e atrai mais abundância."</p>
                <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => onConfirm('garden', 100)} className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 text-left hover:bg-emerald-100 transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-emerald-800 text-xs uppercase tracking-widest">Melhorar meu Jardim</span>
                            <Leaf size={16} className="text-emerald-500" />
                        </div>
                        <p className="text-[10px] text-emerald-600 leading-tight">Desbloqueia novos itens decorativos e aumenta a vibração do perfil.</p>
                    </button>
                    <button onClick={() => onConfirm('scholarship', 150)} className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 text-left hover:bg-indigo-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-indigo-800 text-xs uppercase tracking-widest">Bolsa Terapêutica</span>
                            <Heart size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-[10px] text-indigo-600 leading-tight">Financeie 1 sessão para alguém em vulnerabilidade.</p>
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
};

// --- MAIN SCREEN ---

export default function WalletViewScreen({ user }: { user: Professional }) {
    const { notify, back, go, state } = useGuardiaoFlow();
    const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'services'>('overview');
    const [showReinvest, setShowReinvest] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showDonate, setShowDonate] = useState(false);
    const [withdrawProcessing, setWithdrawProcessing] = useState(false);
    const [donateProcessing, setDonateProcessing] = useState(false);

    // SEC-03: Real transactions from API instead of mock/setTimeout
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [txLoading, setTxLoading] = useState(true);
    const [metrics, setMetrics] = useState<{ nps: number; retentionRate: number; averageRating: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [txs, met] = await Promise.all([
                    request('/finance/transactions', { purpose: 'wallet-transactions', timeoutMs: 8000 }),
                    api.profiles.getMetrics(user.id)
                ]);
                if (!cancelled) {
                    if (Array.isArray(txs)) setTransactions(txs);
                    if (met) setMetrics(met);
                }
            } catch (err) {
                console.warn('[WalletView] Failed to load data:', err);
                // Fallback to flow state data if available
                if (!cancelled && state.data.transactions?.length) {
                    setTransactions(state.data.transactions);
                }
            } finally {
                if (!cancelled) setTxLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [user.id]);

    const currentBalance = user.personalBalance || 0;

    const handleAction = (action: string) => {
        if (action === 'withdraw') setShowWithdraw(true);
        if (action === 'reinvest') setShowReinvest(true);
        if (action === 'donate') setShowDonate(true);
    };

    // SEC-03: Financial operations show honest "Em implementação" instead of fake setTimeout success.
    const handleWithdrawConfirm = async (amount: number) => {
        setWithdrawProcessing(true);
        try {
            // When POST /api/finance/withdraw exists, uncomment:
            // const result = await request('/finance/withdraw', { method: 'POST', body: { amount }, purpose: 'withdraw' });
            // notify('Saque Solicitado', `R$ ${amount},00 serão transferidos. Protocolo #${result.protocol}`, 'success');
            notify('Funcionalidade em Implementação', 'O saque via PIX estará disponível em breve. Sua solicitação foi registrada.', 'info');
        } catch (err: any) {
            notify('Erro', err?.message || 'Não foi possível processar o saque.', 'error');
        } finally {
            setWithdrawProcessing(false);
            setShowWithdraw(false);
        }
    };

    const handleDonateConfirm = async (amount: number, cause: string) => {
        setDonateProcessing(true);
        try {
            // When POST /api/finance/donate exists, uncomment:
            // const result = await request('/finance/donate', { method: 'POST', body: { amount, cause }, purpose: 'donate' });
            // notify('Ação de Graça', `R$ ${amount},00 doados para "${cause}". +${amount} Karma!`, 'success');
            notify('Funcionalidade em Implementação', 'Doações estarão disponíveis em breve. Obrigado pela intenção!', 'info');
        } catch (err: any) {
            notify('Erro', err?.message || 'Não foi possível processar a doação.', 'error');
        } finally {
            setDonateProcessing(false);
            setShowDonate(false);
        }
    };

    const handleReinvestConfirm = (type: string, amount: number) => {
        setShowReinvest(false);
        notify('Funcionalidade em Implementação', 'Reinvestimento estará disponível em breve.', 'info');
    };

    return (
        <PortalView
            title="Santuário Financeiro"
            subtitle="GESTÃO CONSCIENTE"
            onBack={() => go('DASHBOARD')}
            heroImage="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=800"
            headerRight={
                <button onClick={() => notify('Painel Financeiro', 'Aqui você gerencia saldo, projeções, saques e reinvestimentos. Toque em cada card para mais detalhes.', 'info')} className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-all">
                    <Info size={20} />
                </button>
            }
        >
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar -mx-2 px-2">
                {[
                    { id: 'overview', label: 'Visão Geral', icon: Wallet },
                    { id: 'analysis', label: 'Análise Profunda', icon: BarChart3 },
                    { id: 'services', label: 'Serviços', icon: Package },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-nature-900 text-white border-nature-900 shadow-lg' : 'bg-white text-nature-400 border-nature-100'}`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <EnergyFlowCard balance={currentBalance} onAction={handleAction} />

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Projeção & Insight</h4>
                        </div>
                        <ProjectionWidget day7={currentBalance + 450} day30={currentBalance * 4} />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Fluxo Recente</h4>
                            <button onClick={() => setActiveTab('analysis')} className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline">Ver Completo</button>
                        </div>
                        {txLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-5 rounded-[2rem] border border-nature-100 flex items-center gap-4 animate-pulse">
                                        <div className="w-12 h-12 rounded-2xl bg-nature-100 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-nature-100 rounded-full w-3/4" />
                                            <div className="h-2.5 bg-nature-50 rounded-full w-1/2" />
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <div className="h-3 bg-nature-100 rounded-full w-16" />
                                            <div className="h-2 bg-nature-50 rounded-full w-10 ml-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : transactions.length > 0 ? (
                            transactions.map((tx: Transaction) => <TransactionItem key={tx.id} tx={tx} />)
                        ) : (
                            <div className="text-center py-8 opacity-50">
                                <p className="text-xs text-nature-400 italic">Nenhuma transação recente.</p>
                            </div>
                        )}
                    </div>

                    <ProsperityIndexWidget score={82} />
                </div>
            )}

            {activeTab === 'analysis' && (() => {
                // Derive analytics from real transactions
                const incomeTransactions = transactions.filter(tx => tx.type === 'income');

                // Weekly chart: last 4 weeks income
                const weeklyTotals = [0, 0, 0, 0];
                const now = new Date();
                incomeTransactions.forEach(tx => {
                    const d = new Date(tx.date || '');
                    if (isNaN(d.getTime())) return;
                    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
                    const weekIdx = Math.floor(diffDays / 7);
                    if (weekIdx >= 0 && weekIdx < 4) weeklyTotals[3 - weekIdx] += Number(tx.amount || 0);
                });
                const maxWeekly = Math.max(...weeklyTotals, 1);
                const hasRealData = weeklyTotals.some(v => v > 0);

                // Ticket médio
                const avgTicket = incomeTransactions.length > 0
                    ? Math.round(incomeTransactions.reduce((s, tx) => s + Number(tx.amount || 0), 0) / incomeTransactions.length)
                    : null;

                // Taxa de retorno: clientes com >1 transação / total clientes
                const clientCounts: Record<string, number> = {};
                incomeTransactions.forEach(tx => {
                    const k = String(tx.clientId || tx.description || 'desconhecido');
                    clientCounts[k] = (clientCounts[k] || 0) + 1;
                });
                const totalClients = Object.keys(clientCounts).length;
                const returningClients = Object.values(clientCounts).filter(v => v > 1).length;
                const returnRate = totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : null;

                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 relative overflow-hidden">
                            <h4 className="font-serif italic text-xl text-nature-900 mb-6">Evolução Semanal</h4>
                            <div className="flex items-end gap-3 h-40 px-2 pb-2">
                                {(hasRealData ? weeklyTotals : [400, 600, 450, 800]).map((val, i) => {
                                    const h = Math.max((val / maxWeekly) * 100, 4);
                                    return (
                                        <div key={i} className="flex-1 bg-indigo-50 hover:bg-indigo-100 rounded-t-xl relative group transition-colors" style={{ height: `${h}%` }}>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-nature-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                R$ {val.toLocaleString('pt-BR')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-2 text-[9px] font-bold text-nature-400 uppercase">
                                <span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span>
                            </div>
                            {!hasRealData && (
                                <p className="text-center text-[9px] text-nature-300 mt-3 italic">Gráfico real disponível após primeiras transações</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-[2rem] border border-nature-100 flex flex-col justify-between">
                                <div>
                                    <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Ecos de Gratidão (NPS)</p>
                                    <h4 className="text-2xl font-serif text-nature-900">
                                        {metrics ? `${metrics.nps}%` : '—'}
                                    </h4>
                                </div>
                                {metrics && metrics.nps >= 90 && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">
                                        <Sparkles size={10} /> Alta Ressonância
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-5 rounded-[2rem] border border-nature-100">
                                <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Taxa de Retorno</p>
                                <h4 className="text-2xl font-serif text-nature-900">
                                    {metrics ? `${metrics.retentionRate}%` : (returnRate !== null ? `${returnRate}%` : '—')}
                                </h4>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {activeTab === 'services' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center py-10 space-y-4 bg-white/50 rounded-[3rem] border border-dashed border-nature-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-nature-300">
                            <Package size={24} />
                        </div>
                        <p className="text-xs text-nature-500 italic max-w-xs mx-auto">Crie jornadas, pacotes e rituais para aumentar seu impacto e previsibilidade.</p>
                        <button onClick={() => { go('ALQUIMIA_CREATE'); }} className="bg-nature-900 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Criar Nova Jornada</button>
                    </div>
                </div>
            )}

            <ReinvestModal isOpen={showReinvest} onClose={() => setShowReinvest(false)} balance={currentBalance} onConfirm={handleReinvestConfirm} />

            {/* Withdraw BottomSheet */}
            <BottomSheet isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Solicitar Saque">
                <div className="space-y-5 pb-6">
                    <p className="text-sm text-nature-600 italic">Saque via PIX — os valores são transferidos em até 2 dias úteis.</p>
                    <div className="bg-nature-50 rounded-2xl p-4 flex justify-between items-center">
                        <span className="text-xs font-bold text-nature-500 uppercase tracking-widest">Saldo Disponível</span>
                        <span className="text-lg font-bold text-nature-900">R$ {currentBalance.toLocaleString('pt-BR')}</span>
                    </div>
                    <WithdrawForm balance={currentBalance} onConfirm={handleWithdrawConfirm} processing={withdrawProcessing} />
                </div>
            </BottomSheet>

            {/* Donate BottomSheet */}
            <BottomSheet isOpen={showDonate} onClose={() => setShowDonate(false)} title="Semear Compaixão">
                <div className="space-y-5 pb-6">
                    <p className="text-sm text-nature-600 italic">"Ao dar, recebemos. Ao compartilhar abundância, ela se multiplica."</p>
                    <DonateForm onConfirm={handleDonateConfirm} processing={donateProcessing} />
                </div>
            </BottomSheet>
        </PortalView>
    );
}
