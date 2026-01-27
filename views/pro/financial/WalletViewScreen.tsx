
import React, { useEffect, useState } from 'react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { PortalView } from '../../../components/Common';
import { Wallet, TrendingUp, ArrowDownLeft, Calendar, DollarSign } from 'lucide-react';
import { PaymentServiceMock } from '../../../services/mock/paymentMock';
import { Transaction } from '../../../types';

export default function WalletViewScreen() {
    const { back } = useGuardiaoFlow();
    const [balance, setBalance] = useState({ personal: 0, corporate: 0 });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
             const userId = 'pro_001'; // Mock ID
             const bal = await PaymentServiceMock.getBalance(userId);
             const hist = await PaymentServiceMock.getHistory(userId);
             setBalance(bal);
             setTransactions(hist);
             setLoading(false);
        };
        loadData();
    }, []);

    return (
        <PortalView title="Financeiro" subtitle="SUA CARTEIRA" onBack={back}>
            <div className="space-y-6">
                
                {/* Balance Cards */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden ring-1 ring-emerald-500/20">
                        <div className="relative z-10">
                            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Saldo Disponível</p>
                            <h2 className="text-4xl font-serif">R$ {balance.personal.toFixed(2).replace('.', ',')}</h2>
                            <button className="mt-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-xl transition-all border border-emerald-500/30">
                                Solicitar Saque
                            </button>
                        </div>
                        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 transform">
                            <DollarSign size={120} />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                             <TrendingUp size={14} className="text-emerald-400" />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Projeção</span>
                        </div>
                        <p className="text-xl font-bold text-white">R$ {(balance.personal * 1.2).toFixed(2).replace('.', ',')}</p>
                    </div>
                     <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                             <Wallet size={14} className="text-blue-400" />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pendente</span>
                        </div>
                        <p className="text-xl font-bold text-white">R$ 0,00</p>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest ml-1">Movimentações</h3>
                     {loading ? (
                        <div className="p-8 text-center text-slate-500">Carregando...</div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                    <ArrowDownLeft size={18} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-sm">{tx.description}</h4>
                                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                                        <Calendar size={10} />
                                        <span className="text-[10px]">{new Date(tx.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold block text-emerald-400">
                                        + R$ {tx.amount.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{tx.status}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </PortalView>
    );
}
