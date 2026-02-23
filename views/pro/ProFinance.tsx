
import React from 'react';
import { ViewState, Professional, Transaction } from '../../types';
import { TrendingUp, Filter, ArrowUpRight, ArrowDownRight, Share2 } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/useGuardiaoFlow';
import { request } from '../../services/api';

export const ProFinance: React.FC<{ user: Professional, transactions?: Transaction[] }> = ({ user, transactions: propTransactions = [] }) => {
    const { go, notify } = useGuardiaoFlow();
    const [txFilter, setTxFilter] = React.useState<'all' | 'income' | 'expense'>('all');
    const [transactions, setTransactions] = React.useState<Transaction[]>(propTransactions);
    const [txLoading, setTxLoading] = React.useState(!propTransactions.length);

    // SEC-03: Fetch real transactions from API instead of relying on mock/props only
    React.useEffect(() => {
        if (propTransactions.length > 0) return; // Props already provided
        let cancelled = false;
        (async () => {
            try {
                const data = await request('/finance/transactions', { purpose: 'pro-finance', timeoutMs: 8000 });
                if (!cancelled && Array.isArray(data)) {
                    setTransactions(data);
                }
            } catch (err) {
                console.warn('[ProFinance] Failed to load transactions:', err);
            } finally {
                if (!cancelled) setTxLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const chartData = [1200, 1500, 1100, 1800, 1600, 2100, 1840];
    const maxVal = Math.max(...chartData);
    const points = chartData.map((val, i) => `${(i / (chartData.length - 1)) * 100},${100 - (val / maxVal) * 80}`).join(' ');
    const filteredTransactions = transactions.filter((tx) => txFilter === 'all' || tx.type === txFilter);

    return (
    <PortalView title="Abundância" subtitle="FLUXO DE PROSPERIDADE" onBack={() => go('DASHBOARD')} heroImage="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=800">
      <div className="space-y-8 px-2">
        <div className="bg-nature-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
           {/* Chart Background */}
           <div className="absolute inset-x-0 bottom-0 h-48 opacity-20 pointer-events-none">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={`M0,100 L${points} L100,100 Z`} fill="url(#chartGrad)" />
                    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
           </div>
           
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-400 mb-1">Saldo Disponível</p>
                    <h3 className="text-4xl font-serif italic">R$ {user.personalBalance}<span className="text-xl text-primary-400 opacity-80">,00</span></h3>
                </div>
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10"><TrendingUp className="text-emerald-400"/></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-bold uppercase text-primary-200 mb-1">A Liberar</p>
                    <span className="text-lg font-bold text-emerald-400">R$ 1.840</span>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-bold uppercase text-primary-200 mb-1">Crescimento</p>
                    <span className="text-lg font-bold text-white flex items-center gap-2">+12% <TrendingUp size={14}/></span>
                  </div>
              </div>
           </div>
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Fluxo Recente</h4>
                <button onClick={() => setTxFilter((prev) => (prev === 'all' ? 'income' : prev === 'income' ? 'expense' : 'all'))} className="p-2 bg-white rounded-xl border border-nature-100 shadow-sm" title={`Filtro atual: ${txFilter}`}>
                    <Filter size={14} className="text-nature-400"/>
                </button>
            </div>
            {txLoading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-nature-200 border-t-nature-700 rounded-full animate-spin"></div>
                </div>
            ) : filteredTransactions.length > 0 ? filteredTransactions.map(tx => (
                <div key={tx.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                            {tx.type === 'income' ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>}
                        </div>
                        <div>
                            <h4 className="font-bold text-nature-900 text-sm truncate max-w-[140px]">{tx.description}</h4>
                            <p className="text-[9px] text-nature-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'income' ? '+' : '-'} R$ {tx.amount}
                        </p>
                        <span className="text-[9px] text-nature-200 uppercase font-bold">{tx.status}</span>
                    </div>
                </div>
            )) : (
                <div className="text-center py-10 opacity-50">
                    <p className="text-xs text-nature-400 italic">Nenhuma transação recente.</p>
                </div>
            )}
        </div>

        <button onClick={() => {
            // SEC-03: Honest feedback instead of fake setTimeout success.
            notify('Funcionalidade em Implementação', 'O relatório PDF estará disponível em breve.', 'info');
        }} className="w-full py-5 border-2 border-dashed border-nature-100 rounded-[2.5rem] text-nature-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white transition-all"><Share2 size={16}/> Baixar Relatório Mensal</button>
      </div>
    </PortalView>
    );
};
