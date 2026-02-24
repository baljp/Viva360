
import React, { useEffect, useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { PortalView, BottomSheet } from '../../../components/Common';
import { Receipt, Calendar, ArrowUpRight, ArrowDownLeft, RefreshCw, Filter, X, Download } from 'lucide-react';
import { api } from '../../../services/api';
import { Transaction } from '../../../types';
import { buildReadFailureCopy, isDegradedReadError } from '../../../src/utils/readDegradedUX';

export default function PaymentHistoryScreen() {
    const { back, notify } = useBuscadorFlow();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const user = await api.auth.getCurrentSession();
            if (user) {
                const summary = await api.professionals.getFinanceSummary(user.id);
                setTransactions(summary.transactions || []);
            }
        } catch (error) {
            const copy = buildReadFailureCopy(['finance'], transactions.length > 0);
            notify(copy.title, copy.message, isDegradedReadError(error) ? 'warning' : 'error');
            if (transactions.length === 0) {
                setTransactions([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
    const totalExpense = transactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);
    const totalIncome = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);

    return (
        <PortalView title="Financeiro" subtitle="SEUS PAGAMENTOS" onBack={back}>
            <div className="space-y-6">

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Investido</p>
                        <h2 className="text-3xl font-serif">R$ {totalExpense.toFixed(2).replace('.', ',')}</h2>
                        <div className="mt-4 flex gap-3 flex-wrap">
                            <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-2">
                                <Receipt size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-bold">{transactions.length} Transações</span>
                            </div>
                            {totalIncome > 0 && (
                                <div className="bg-emerald-500/20 px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-2">
                                    <ArrowDownLeft size={14} className="text-emerald-400" />
                                    <span className="text-[10px] font-bold text-emerald-300">+R$ {totalIncome.toFixed(2).replace('.', ',')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                        <Receipt size={200} />
                    </div>
                </div>

                {/* Filter Tabs + Refresh */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'expense', label: 'Saídas' },
                            { id: 'income', label: 'Entradas' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${filter === f.id ? 'bg-nature-900 text-white shadow-sm' : 'bg-nature-50 text-nature-400'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchData} disabled={loading} className="p-2 bg-nature-50 rounded-xl text-nature-400 hover:bg-nature-100 transition-all active:scale-95">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-nature-50 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-nature-400 text-xs italic">Nenhuma transação encontrada.</div>
                    ) : (
                        filtered.map(tx => (
                            <div
                                key={tx.id}
                                onClick={() => setSelectedTx(tx)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-nature-50 flex items-center gap-4 cursor-pointer hover:bg-nature-50/50 active:scale-[0.98] transition-all"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                    {tx.type === 'expense' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-nature-900 text-sm truncate">{tx.description}</h4>
                                    <div className="flex items-center gap-2 text-nature-400 mt-1">
                                        <Calendar size={10} />
                                        <span className="text-[10px]">{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`font-bold block ${tx.type === 'expense' ? 'text-nature-900' : 'text-emerald-600'}`}>
                                        {tx.type === 'expense' ? '-' : '+'} R$ {tx.amount.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">{tx.status}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Transaction Detail */}
            <BottomSheet isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Detalhes da Transação">
                {selectedTx && (
                    <div className="space-y-6 pb-8">
                        <div className="text-center">
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${selectedTx.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                {selectedTx.type === 'expense' ? <ArrowUpRight size={28} /> : <ArrowDownLeft size={28} />}
                            </div>
                            <h3 className="text-2xl font-serif italic text-nature-900">
                                {selectedTx.type === 'expense' ? '-' : '+'} R$ {selectedTx.amount.toFixed(2).replace('.', ',')}
                            </h3>
                            <p className="text-sm text-nature-500 mt-1">{selectedTx.description}</p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between p-4 bg-nature-50 rounded-2xl">
                                <span className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Data</span>
                                <span className="text-sm font-bold text-nature-900">{new Date(selectedTx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between p-4 bg-nature-50 rounded-2xl">
                                <span className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Status</span>
                                <span className="text-sm font-bold text-emerald-600 uppercase">{selectedTx.status}</span>
                            </div>
                            <div className="flex justify-between p-4 bg-nature-50 rounded-2xl">
                                <span className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Tipo</span>
                                <span className="text-sm font-bold text-nature-900">{selectedTx.type === 'expense' ? 'Investimento' : 'Retorno'}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                // Stub for PDF Download (txt generation for now)
                                const content = `Viva360 - Comprovante de Transação\n--------------------------------\nData: ${new Date(selectedTx.date).toLocaleString('pt-BR')}\nValor: R$ ${selectedTx.amount.toFixed(2).replace('.', ',')}\nDescrição: ${selectedTx.description}\nTipo: ${selectedTx.type === 'expense' ? 'Investimento' : 'Retorno'}\nStatus: ${selectedTx.status.toUpperCase()}\nID da Transação: ${selectedTx.id}`;
                                const blob = new Blob([content], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `comprovante-viva360-${selectedTx.id?.slice(0, 8)}.txt`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                notify('Comprovante Gerado', 'Seu comprovante foi baixado com sucesso.', 'success');
                            }}
                            className="w-full mt-6 py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={16} /> Baixar Comprovante
                        </button>
                    </div>
                )}
            </BottomSheet>
        </PortalView>
    );
}
