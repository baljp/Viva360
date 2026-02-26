import React, { useEffect, useState } from 'react';
import { useSantuarioFlow } from '../../../src/flow/useSantuarioFlow';
import { ChevronLeft, Shield, AlertTriangle, FileText, Lock, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../../../services/api';

type ContractData = {
    status?: string;
    license_valid_until?: string;
    legal_status?: string;
    pending_contracts?: Array<{ professional_name?: string; type?: string }>;
    compliance_score?: number;
};

export default function SpaceGovernance() {
    const { go } = useSantuarioFlow();
    const [contract, setContract] = useState<ContractData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchContract = async () => {
        setLoading(true);
        try {
            const data = await api.spaces.getContract();
            setContract(data as ContractData || {});
        } catch {
            setContract({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchContract(); }, []);

    const isRegular = contract?.status === 'active' || contract?.legal_status === 'regular' || (!contract?.status && contract !== null);
    const pendingContracts = Array.isArray(contract?.pending_contracts) ? contract.pending_contracts : [];
    const licenseDate = contract?.license_valid_until
        ? new Date(contract.license_valid_until).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="min-h-screen bg-[#fcfdfc] flex flex-col animate-in fade-in duration-500">
            <header className="p-6 flex items-center justify-between sticky top-0 bg-[#fcfdfc]/80 backdrop-blur-md z-10">
                <button onClick={() => go('EXEC_DASHBOARD')} className="p-3 bg-nature-50 rounded-2xl text-nature-900 border border-nature-100 hover:bg-nature-100 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-lg font-serif italic text-nature-900">Governança & Compliance</h1>
                <button onClick={fetchContract} disabled={loading} className="p-3 bg-nature-50 rounded-2xl text-nature-400 border border-nature-100 hover:bg-nature-100 transition-colors disabled:opacity-40">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            <div className="px-6 space-y-6 pb-24">

                {/* Legal Status */}
                <div className={`p-8 rounded-[2.5rem] text-white shadow-xl ${isRegular ? 'bg-slate-900' : 'bg-rose-900'}`}>
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 size={24} className="animate-spin text-white/50" />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-4 mb-4">
                                <Shield size={32} className={isRegular ? 'text-emerald-400' : 'text-rose-300'} />
                                <div>
                                    <h2 className="text-xl font-bold">Status Legal</h2>
                                    <p className={`text-xs uppercase tracking-widest ${isRegular ? 'text-emerald-400' : 'text-rose-300'}`}>
                                        {isRegular ? '✓ Regular' : '⚠ Verificar'}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
                                {licenseDate
                                    ? `Alvará de funcionamento válido até ${licenseDate}. Todos os documentos verificados.`
                                    : contract && Object.keys(contract).length > 0
                                        ? 'Contrato ativo. Consulte seu gestor para detalhes de validade.'
                                        : 'Dados do contrato não disponíveis. Configure sua conta para visualizar o status legal.'}
                            </div>
                        </>
                    )}
                </div>

                {/* Risk Alerts */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Alertas de Risco</h3>

                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 size={20} className="animate-spin text-nature-300" />
                        </div>
                    ) : pendingContracts.length > 0 ? (
                        pendingContracts.map((pc, i) => (
                            <div key={i} className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                                <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                                <div>
                                    <h4 className="font-bold text-amber-900 text-sm">Contrato Pendente</h4>
                                    <p className="text-xs text-amber-700 mt-1">
                                        O guardião <strong>{pc.professional_name || 'Não identificado'}</strong> precisa renovar o {pc.type || 'termo de responsabilidade'}.
                                    </p>
                                    <button onClick={() => go('PROS_LIST')} className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-bold uppercase active:scale-95 transition-all">
                                        Resolver
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-100 flex items-center gap-4">
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                            <div>
                                <h4 className="font-bold text-emerald-900 text-sm">Sem Alertas</h4>
                                <p className="text-xs text-emerald-700 mt-1">
                                    {loading ? 'Verificando contratos...' : 'Todos os contratos estão em ordem.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Access */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => go('AUDIT_LOG')} className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm text-left hover:border-emerald-200 transition-colors active:scale-95">
                        <FileText size={24} className="text-nature-400 mb-4" />
                        <h4 className="font-bold text-nature-900 text-sm">Auditoria Financeira</h4>
                        <p className="text-[10px] text-nature-400 mt-1 uppercase tracking-wide">Ver trilha de logs</p>
                    </button>
                    <button onClick={() => go('AUDIT_LOG')} className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm text-left hover:border-emerald-200 transition-colors active:scale-95">
                        <Lock size={24} className="text-nature-400 mb-4" />
                        <h4 className="font-bold text-nature-900 text-sm">LGPD & Dados</h4>
                        <p className="text-[10px] text-nature-400 mt-1 uppercase tracking-wide">Conformidade de dados</p>
                    </button>
                    <button onClick={() => go('PROS_LIST')} className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm text-left hover:border-indigo-200 transition-colors active:scale-95">
                        <Shield size={24} className="text-nature-400 mb-4" />
                        <h4 className="font-bold text-nature-900 text-sm">Contratos de Guardiões</h4>
                        <p className="text-[10px] text-nature-400 mt-1 uppercase tracking-wide">Gerenciar contratos</p>
                    </button>
                    <button onClick={() => go('FINANCE_OVERVIEW')} className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm text-left hover:border-indigo-200 transition-colors active:scale-95">
                        <FileText size={24} className="text-nature-400 mb-4" />
                        <h4 className="font-bold text-nature-900 text-sm">Relatório Financeiro</h4>
                        <p className="text-[10px] text-nature-400 mt-1 uppercase tracking-wide">Fluxo de caixa</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
