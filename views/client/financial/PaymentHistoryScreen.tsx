
import React, { useEffect, useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { PortalView, BottomSheet, DegradedRetryNotice } from '../../../components/Common';
import { Receipt, Calendar, ArrowUpRight, ArrowDownLeft, RefreshCw, Filter, X, Download, Printer } from 'lucide-react';
import { authApi } from '../../../services/api/authProxy';
import { accountApi } from '../../../services/api/accountClient';
import { Transaction } from '../../../types';
import { buildReadFailureCopy, isDegradedReadError } from '../../../src/utils/readDegradedUX';

export default function PaymentHistoryScreen() {
    const { back, notify } = useBuscadorFlow();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [readIssue, setReadIssue] = useState<{ title: string; message: string } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const user = await authApi.getCurrentSession();
            if (user) {
                const summary = await accountApi.professionals.getFinanceSummary(user.id);
                setTransactions(summary.transactions || []);
                setReadIssue(null);
            }
        } catch (error) {
            const copy = buildReadFailureCopy(['finance'], transactions.length > 0);
            setReadIssue(copy);
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

                {readIssue && (
                    <DegradedRetryNotice
                        title={readIssue.title}
                        message={readIssue.message}
                        onRetry={fetchData}
                        compact
                    />
                )}

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
                        {/* THE RECEIPT ITSELF */}
                        <div id="receipt-container" className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-indigo-500"></div>

                            <div className="text-center mb-6 mt-2">
                                <h4 className="font-serif italic text-xl text-nature-900">Viva360</h4>
                                <p className="text-[10px] text-nature-400 uppercase tracking-widest">Comprovante de Transação</p>
                            </div>

                            <div className="text-center mb-6">
                                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${selectedTx.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                    {selectedTx.type === 'expense' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                </div>
                                <h3 className="text-3xl font-serif italic text-nature-900">
                                    {selectedTx.type === 'expense' ? '-' : '+'} R$ {selectedTx.amount.toFixed(2).replace('.', ',')}
                                </h3>
                                <p className="text-xs text-nature-500 mt-2 font-bold">{selectedTx.description}</p>
                            </div>

                            <div className="space-y-4 border-t border-dashed border-nature-200 pt-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> Data</span>
                                    <span className="text-sm font-bold text-nature-900">{new Date(selectedTx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} <span className="text-nature-400 font-normal">{new Date(selectedTx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Status</span>
                                    <span className="text-xs font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> {selectedTx.status}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Tipo</span>
                                    <span className="text-sm font-bold text-nature-900">{selectedTx.type === 'expense' ? 'Investimento' : 'Retorno'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">ID Transação</span>
                                    <span className="text-[10px] font-mono text-nature-500 bg-nature-50 px-2 py-1 rounded">{selectedTx.id}</span>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-[8px] text-nature-400 uppercase tracking-widest">Autenticidade Viva360</p>
                                <p className="text-[8px] text-nature-300 font-mono mt-1">HASH: {btoa(selectedTx.id + selectedTx.date).substring(0, 24)}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const receiptHtml = document.getElementById('receipt-container')?.innerHTML;
                                if (!receiptHtml) return;

                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                    printWindow.document.write(`
                                        <html>
                                            <head>
                                                <title>Comprovante Viva360 - ${selectedTx.id.substring(0, 8)}</title>
                                                <style>
                                                    body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #fafafa; display: flex; justify-content: center; }
                                                    .receipt { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 400px; width: 100%; position: relative; overflow: hidden; }
                                                    .stripe { position: absolute; top: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #34d399, #6366f1); }
                                                    .header { text-align: center; margin-bottom: 30px; margin-top: 10px; }
                                                    .brand { font-family: serif; font-style: italic; font-size: 24px; margin: 0; color: #171717; }
                                                    .subtitle { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #a3a3a3; margin: 4px 0 0 0; }
                                                    .value { text-align: center; margin-bottom: 30px; }
                                                    .amount { font-family: serif; font-style: italic; font-size: 36px; margin: 0; color: #171717; }
                                                    .desc { font-size: 14px; font-weight: bold; color: #737373; margin: 8px 0 0 0; }
                                                    .details { border-top: 1px dashed #e5e5e5; padding-top: 24px; display: flex; flex-direction: column; gap: 16px; }
                                                    .row { display: flex; justify-content: space-between; align-items: center; }
                                                    .label { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3; }
                                                    .val { font-size: 14px; font-weight: bold; color: #171717; }
                                                    .status { font-size: 12px; font-weight: bold; color: #059669; background: #ecfdf5; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
                                                    .mono { font-family: monospace; font-size: 11px; background: #fafafa; padding: 4px 8px; border-radius: 4px; color: #737373; }
                                                    .footer { margin-top: 40px; text-align: center; }
                                                    .footer-label { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #a3a3a3; margin: 0; }
                                                    .footer-hash { font-family: monospace; font-size: 9px; color: #d4d4d4; margin: 4px 0 0 0; }
                                                    @media print { body { background: white; padding: 0; } .receipt { box-shadow: none; max-width: 100%; border: 1px solid #e5e5e5; } }
                                                </style>
                                            </head>
                                            <body>
                                                <div class="receipt">
                                                    <div class="stripe"></div>
                                                    <div class="header">
                                                        <h1 class="brand">Viva360</h1>
                                                        <p class="subtitle">Comprovante de Transação</p>
                                                    </div>
                                                    <div class="value">
                                                        <h2 class="amount">${selectedTx.type === 'expense' ? '-' : '+'} R$ ${selectedTx.amount.toFixed(2).replace('.', ',')}</h2>
                                                        <p class="desc">${selectedTx.description}</p>
                                                    </div>
                                                    <div class="details">
                                                        <div class="row"><span class="label">Data</span><span class="val">${new Date(selectedTx.date).toLocaleDateString('pt-BR')} ${new Date(selectedTx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                                        <div class="row"><span class="label">Status</span><span class="status">${selectedTx.status}</span></div>
                                                        <div class="row"><span class="label">Tipo</span><span class="val">${selectedTx.type === 'expense' ? 'Investimento' : 'Retorno'}</span></div>
                                                        <div class="row"><span class="label">ID Transação</span><span class="val mono">${selectedTx.id}</span></div>
                                                    </div>
                                                    <div class="footer">
                                                        <p class="footer-label">Autenticidade Viva360</p>
                                                        <p class="footer-hash">HASH: ${btoa(selectedTx.id + selectedTx.date).substring(0, 24)}</p>
                                                    </div>
                                                </div>
                                                <script>window.onload = function() { window.print(); }</script>
                                            </body>
                                        </html>
                                    `);
                                    printWindow.document.close();
                                    notify('Comprovante Gerado', 'O comprovante foi aberto para impressão/pdf.', 'success');
                                } else {
                                    // Fallback if popup blocked
                                    const a = document.createElement('a');
                                    a.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(printWindow?.document.documentElement.outerHTML || '');
                                    a.download = `comprovante-viva360-${selectedTx.id.substring(0, 8)}.html`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }
                            }}
                            className="w-full mt-2 py-4 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest text-[10px] shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Printer size={16} /> Salvar PDF / Imprimir
                        </button>
                    </div>
                )}
            </BottomSheet>
        </PortalView>
    );
}
