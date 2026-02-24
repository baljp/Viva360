import React, { useState } from 'react';
import { User } from '../../types';
import { Shield, FileText, Calendar, DollarSign, Clock, CheckCircle2, AlertTriangle, Download, Sparkles, Loader2 } from 'lucide-react';
import { useGuardiaoFlow } from '../../src/flow/useGuardiaoFlow';
import { ZenToast, BottomSheet, DegradedRetryNotice } from '../../components/Common';
import { buildReadFailureCopy, isDegradedReadError } from '../../src/utils/readDegradedUX';

import { api } from '../../services/api';

export const SantuarioContractView: React.FC<{ user: User }> = ({ user }) => {
    const { go, back, notify } = useGuardiaoFlow();
    const [toast, setToast] = useState<any>(null);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [contract, setContract] = useState<any>(null);
    const [noContract, setNoContract] = useState(false);
    const [readIssue, setReadIssue] = useState<{ title: string; message: string } | null>(null);

    const loadContract = React.useCallback(async () => {
        setReadIssue(null);
        try {
            const data = await api.spaces.getContract();
            if (data && !data.error) {
                setContract(data);
                setNoContract(false);
                return;
            }
            setNoContract(true);
        } catch (err: any) {
            if (err?.response?.status === 404 || err?.status === 404) {
                setNoContract(true);
                return;
            }
            const copy = buildReadFailureCopy(['spaces'], isDegradedReadError(err));
            setReadIssue(copy);
            notify(copy.title, copy.message, 'warning');
        }
    }, [notify]);

    React.useEffect(() => {
        loadContract().catch(() => undefined);
    }, [loadContract]);

    if (noContract) return (
        <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center px-6 text-center gap-4">
            <Shield size={48} className="text-nature-300" />
            <h2 className="text-xl font-serif italic text-nature-700">Nenhum Contrato Ativo</h2>
            <p className="text-sm text-nature-400">Você ainda não possui um contrato vinculado a um espaço.</p>
            <button onClick={back} className="mt-4 px-6 py-3 bg-nature-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest">Voltar</button>
        </div>
    );

    if (!contract) {
        if (readIssue) {
            return (
                <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center px-6">
                    <div className="w-full max-w-md">
                        <DegradedRetryNotice title={readIssue.title} message={readIssue.message} onRetry={loadContract} />
                    </div>
                </div>
            );
        }
        return <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center gap-3 text-nature-400"><Loader2 size={28} className="animate-spin" /><span className="text-xs font-bold uppercase tracking-widest">Carregando Contrato...</span></div>;
    }


    const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const handleRenew = () => {
        setShowRenewModal(false);
        notify('Renovação Solicitada', 'Seu pedido foi enviado ao Santuário. Aguarde a confirmação.', 'success');
    };

    const handleExport = () => {
        const blob = new Blob([`Contrato ${contract.id} - ${contract.spaceName}\nGuardião: ${user.name}\nVigência: ${contract.startDate} a ${contract.endDate}`], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrato_${contract.spaceName.replace(/\s/g, '_')}.txt`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-[#f8faf9] pb-32">
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            <header className="bg-gradient-to-br from-nature-900 to-emerald-900 px-6 pt-14 pb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <button onClick={back} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white mb-6 active:scale-95">←</button>
                <div className="flex items-center gap-3 mb-2">
                    <Shield size={24} className="text-emerald-300" />
                    <h1 className="text-3xl font-serif italic text-white">Contrato Sagrado</h1>
                </div>
                <p className="text-emerald-200/70 text-xs font-bold uppercase tracking-widest">{contract.spaceName} • Vigente</p>
            </header>

            <div className="px-4 -mt-4 space-y-4">
                {/* Status Banner */}
                <div className="bg-emerald-50 p-5 rounded-[2.5rem] border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={24} className="text-emerald-600" />
                        <div>
                            <h3 className="font-bold text-emerald-900 text-sm">Contrato Ativo</h3>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase">{contract.daysRemaining} dias restantes</p>
                        </div>
                    </div>
                    <div className="w-16 h-16 relative">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-emerald-100" />
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-emerald-500" strokeDasharray={176} strokeDashoffset={176 - (176 * (contract.daysRemaining / 365))} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-700">{Math.round((contract.daysRemaining/365)*100)}%</span>
                    </div>
                </div>

                {/* Key Terms */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 space-y-5">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest">Termos do Vínculo</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-nature-50 rounded-2xl">
                            <Calendar size={18} className="text-nature-400 mb-2" />
                            <p className="text-[9px] font-bold text-nature-400 uppercase">Vigência</p>
                            <p className="text-xs font-bold text-nature-900 mt-1">{formatDate(contract.startDate)}</p>
                            <p className="text-[10px] text-nature-500">até {formatDate(contract.endDate)}</p>
                        </div>
                        <div className="p-4 bg-nature-50 rounded-2xl">
                            <DollarSign size={18} className="text-emerald-500 mb-2" />
                            <p className="text-[9px] font-bold text-nature-400 uppercase">Valor Mensal</p>
                            <p className="text-lg font-bold text-nature-900 mt-1">R$ {contract.monthlyFee}</p>
                        </div>
                        <div className="p-4 bg-nature-50 rounded-2xl">
                            <Sparkles size={18} className="text-indigo-500 mb-2" />
                            <p className="text-[9px] font-bold text-nature-400 uppercase">Repasse</p>
                            <p className="text-lg font-bold text-nature-900 mt-1">{contract.revenueShare}%</p>
                            <p className="text-[10px] text-nature-500">sobre atendimentos</p>
                        </div>
                        <div className="p-4 bg-nature-50 rounded-2xl">
                            <Clock size={18} className="text-amber-500 mb-2" />
                            <p className="text-[9px] font-bold text-nature-400 uppercase">Carga Horária</p>
                            <p className="text-lg font-bold text-nature-900 mt-1">{contract.hoursPerWeek}h</p>
                            <p className="text-[10px] text-nature-500">por semana</p>
                        </div>
                    </div>
                </div>

                {/* Rooms */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-3">Altares Autorizados</h3>
                    <div className="flex gap-2">
                        {contract.roomsAllowed.map((r, i) => (
                            <span key={i} className="px-4 py-2 bg-indigo-50 rounded-xl text-xs font-bold text-indigo-700 border border-indigo-100">{r}</span>
                        ))}
                    </div>
                </div>

                {/* Benefits */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-3">Benefícios Inclusos</h3>
                    <div className="space-y-2">
                        {contract.benefits.map((b, i) => (
                            <div key={i} className="flex items-center gap-3 py-2">
                                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                <span className="text-sm text-nature-700">{b}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rules */}
                <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100">
                    <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Acordos de Convivência</h3>
                    <div className="space-y-2">
                        {contract.rules.map((r, i) => (
                            <div key={i} className="flex items-start gap-3 py-1">
                                <span className="text-amber-400 text-xs mt-0.5">•</span>
                                <span className="text-sm text-amber-800">{r}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button onClick={() => setShowRenewModal(true)} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Sparkles size={16} /> Solicitar Renovação
                    </button>
                    <button onClick={handleExport} className="w-full py-4 bg-white text-nature-900 rounded-2xl font-bold uppercase tracking-widest text-xs border border-nature-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Download size={16} /> Exportar Contrato
                    </button>
                </div>
            </div>

            <BottomSheet isOpen={showRenewModal} onClose={() => setShowRenewModal(false)} title="Solicitar Renovação">
                <div className="space-y-6 pb-12">
                    <div className="text-center space-y-3">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto"><Shield size={36} className="text-emerald-500" /></div>
                        <p className="text-sm text-nature-600">Deseja renovar seu vínculo com <strong>{contract.spaceName}</strong> por mais 12 meses?</p>
                        <p className="text-xs text-nature-400">O santuário será notificado e analisará a solicitação.</p>
                    </div>
                    <button onClick={handleRenew} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Confirmar Renovação</button>
                </div>
            </BottomSheet>
        </div>
    );
};
