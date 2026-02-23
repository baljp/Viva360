
import React from 'react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext';
import { ChevronLeft, Shield, AlertTriangle, FileText, Lock } from 'lucide-react';

export default function SpaceGovernance() {
    const { go } = useSantuarioFlow();

    return (
        <div className="min-h-screen bg-[#fcfdfc] flex flex-col animate-in fade-in duration-500">
            <header className="p-6 flex items-center justify-between sticky top-0 bg-[#fcfdfc]/80 backdrop-blur-md z-10">
                <button onClick={() => go('EXEC_DASHBOARD')} className="p-3 bg-nature-50 rounded-2xl text-nature-900 border border-nature-100 hover:bg-nature-100 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-lg font-serif italic text-nature-900">Governança & Compliance</h1>
                <div className="w-10"></div>
            </header>

            <div className="px-6 space-y-6">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <Shield size={32} className="text-emerald-400" />
                        <div>
                            <h2 className="text-xl font-bold">Status Legal</h2>
                            <p className="text-slate-400 text-xs uppercase tracking-widest">100% Regular</p>
                        </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
                        Alvará de funcionamento válido até Dez/2026. Todos os terapeutas estão com documentação em dia.
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Alertas de Risco</h3>
                    <div className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                        <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-amber-900 text-sm">Contrato Pendente</h4>
                            <p className="text-xs text-amber-700 mt-1">O terapeuta <strong>Carlos Luz</strong> precisa renovar o termo de responsabilidade.</p>
                            <button onClick={() => go('PROS_LIST')} className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-bold uppercase">Resolver</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => go('AUDIT_LOG')} className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm text-left hover:border-emerald-200 transition-colors">
                        <FileText size={24} className="text-nature-400 mb-4" />
                        <h4 className="font-bold text-nature-900 text-sm">Auditoria Financeira</h4>
                    </button>
                    <button onClick={() => go('AUDIT_LOG')} className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm text-left hover:border-emerald-200 transition-colors">
                        <Lock size={24} className="text-nature-400 mb-4" />
                        <h4 className="font-bold text-nature-900 text-sm">LGPD & Dados</h4>
                    </button>
                </div>
            </div>
        </div>
    );
}
