
import React, { useEffect, useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { PortalView } from '../../../components/Common';
import { Receipt, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { PaymentServiceMock } from '../../../services/mock/paymentMock';
import { Transaction } from '../../../types';

export default function PaymentHistoryScreen() {
    const { back } = useBuscadorFlow();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        PaymentServiceMock.getHistory('user_current').then(data => {
            setTransactions(data);
            setLoading(false);
        });
    }, []);

    return (
        <PortalView title="Financeiro" subtitle="SEUS PAGAMENTOS" onBack={back}>
            <div className="space-y-6">
                
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                   <div className="relative z-10">
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Investido</p>
                       <h2 className="text-3xl font-serif">R$ {transactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0).toFixed(2).replace('.', ',')}</h2>
                       <div className="mt-4 flex gap-4">
                           <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-2">
                               <Receipt size={14} className="text-emerald-400"/>
                               <span className="text-[10px] font-bold">{transactions.length} Transações</span>
                           </div>
                       </div>
                   </div>
                   <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                       <Receipt size={200} />
                   </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest ml-1">Histórico</h3>
                    
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Carregando...</div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                    {tx.type === 'expense' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 text-sm">{tx.description}</h4>
                                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                                        <Calendar size={10} />
                                        <span className="text-[10px]">{new Date(tx.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`font-bold block ${tx.type === 'expense' ? 'text-slate-900' : 'text-emerald-600'}`}>
                                        {tx.type === 'expense' ? '-' : '+'} R$ {tx.amount.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">{tx.status}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </PortalView>
    );
}
