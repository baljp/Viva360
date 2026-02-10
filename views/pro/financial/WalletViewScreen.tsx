import React, { useState, useEffect } from 'react';
import { Professional, Transaction } from '../../../types';
import { PortalView, BottomSheet, ZenToast } from '../../../components/Common';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { 
    Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Share2, 
    Leaf, Heart, Shuffle, Landmark, CreditCard, ChevronRight, 
    BarChart3, PieChart, Package, Calendar, Sparkles, Filter, Info
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

const EnergyFlowCard: React.FC<{ balance: number, onAction: (action: string) => void }> = ({ balance, onAction }) => (
    <div className="bg-[#1a1f1d] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400 mb-2 flex items-center gap-2">
                <Leaf size={12} /> Energia em Fluxo
            </p>
            <h2 className="text-5xl font-serif italic mb-8">R$ {balance.toFixed(2).replace('.', ',')}</h2>
            
            <div className="grid grid-cols-3 gap-3">
                <button onClick={() => onAction('withdraw')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><ArrowDownRight size={16}/></div>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Sacar</span>
                </button>
                <button onClick={() => onAction('reinvest')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400"><Shuffle size={16}/></div>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Reinvestir</span>
                </button>
                <button onClick={() => onAction('donate')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400"><Heart size={16}/></div>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Doar</span>
                </button>
            </div>
        </div>
    </div>
);

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
                {tx.type === 'income' ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>}
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
    
    // Mock Data (In real app, comes from state.data or props)
    const transactions = state.data.transactions?.length ? state.data.transactions : [
        { id: '1', date: new Date().toISOString(), amount: 150, type: 'income', description: 'Sessão Reiki', status: 'completed' },
        { id: '2', date: new Date().toISOString(), amount: 300, type: 'income', description: 'Pacote Mensal', status: 'completed' },
        { id: '3', date: new Date().toISOString(), amount: 50, type: 'expense', description: 'Taxa Eco', status: 'completed' },
    ];

    const currentBalance = user.personalBalance || 1250;

    const handleAction = (action: string) => {
        if (action === 'withdraw') setShowWithdraw(true);
        if (action === 'reinvest') setShowReinvest(true);
        if (action === 'donate') setShowDonate(true);
    };

    const handleWithdrawConfirm = async (amount: number) => {
        setWithdrawProcessing(true);
        await new Promise(r => setTimeout(r, 1800));
        setWithdrawProcessing(false);
        setShowWithdraw(false);
        notify('Saque Solicitado', `R$ ${amount},00 serão transferidos via PIX em até 24h. Protocolo #${Math.random().toString(36).substring(2, 8).toUpperCase()}`, 'success');
    };

    const handleDonateConfirm = async (amount: number, cause: string) => {
        setDonateProcessing(true);
        await new Promise(r => setTimeout(r, 1500));
        setDonateProcessing(false);
        setShowDonate(false);
        notify('Ação de Graça', `R$ ${amount},00 doados para "${cause}". Sua generosidade move o mundo. +${amount} Karma recebido!`, 'success');
    };

    const handleReinvestConfirm = (type: string, amount: number) => {
        setShowReinvest(false);
        notify('Semente Plantada', type === 'garden' ? `R$ ${amount} investidos no seu Jardim! Novos itens e vibração desbloqueados.` : `R$ ${amount} iluminaram o caminho de alguém. Você recebeu +${amount * 2} Karma!`, 'success');
    };

    return (
        <PortalView 
            title="Santuário Financeiro" 
            subtitle="GESTÃO CONSCIENTE" 
            onBack={() => go('DASHBOARD')}
            heroImage="https://images.unsplash.com/photo-1620022410313-1f1638234372?q=80&w=800"
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
                        {transactions.map((tx: any) => <TransactionItem key={tx.id} tx={tx} />)}
                    </div>

                    <ProsperityIndexWidget score={82} />
                </div>
            )}

            {activeTab === 'analysis' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 relative overflow-hidden">
                        <h4 className="font-serif italic text-xl text-nature-900 mb-6">Evolução Mensal</h4>
                        {/* Fake Simple Chart using CSS/Flex */}
                         <div className="flex items-end gap-3 h-40 px-2 pb-2">
                            {[40, 60, 45, 80, 70, 90, 100].map((h, i) => (
                                <div key={i} className="flex-1 bg-indigo-50 rounded-t-xl relative group hover:bg-indigo-100 transition-colors" style={{ height: `${h}%` }}>
                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-nature-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">R$ {h * 40}</div>
                                </div>
                            ))}
                         </div>
                         <div className="flex justify-between mt-2 text-[9px] font-bold text-nature-400 uppercase">
                             <span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-[2rem] border border-nature-100">
                             <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Ticket Médio</p>
                             <h4 className="text-2xl font-serif text-nature-900">R$ 180</h4>
                        </div>
                         <div className="bg-white p-5 rounded-[2rem] border border-nature-100">
                             <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Taxa de Retorno</p>
                             <h4 className="text-2xl font-serif text-nature-900">68%</h4>
                        </div>
                     </div>
                </div>
            )}

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
            {/* Note: Other modals would be implemented similarly */}
        </PortalView>
    );
}
