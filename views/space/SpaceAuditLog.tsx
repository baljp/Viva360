import React, { useMemo, useState } from 'react';
import { ChevronLeft, Shield, Search, FileText, User, Calendar, Lock } from 'lucide-react';

export const SpaceAuditLog: React.FC<{ flow: any }> = ({ flow }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'Todos' | 'Contratos' | 'Financeiro' | 'Salas' | 'Equipe'>('Todos');
    const logs = [
        { id: 1, action: 'Edição de Contrato', user: 'Admin Santuário', target: 'Mestre Carlos', date: 'Hoje, 10:24', type: 'contract', severity: 'medium' },
        { id: 2, action: 'Criação de Altar', user: 'Gestor Espaço', target: 'Sala Gaia', date: 'Hoje, 09:15', type: 'room', severity: 'low' },
        { id: 3, action: 'Alteração de Repasse', user: 'Financeiro', target: 'Taxa de Manutenção', date: 'Ontem, 16:45', type: 'finance', severity: 'high' },
        { id: 4, action: 'Acesso às Gravações', user: 'Admin Santuário', target: 'Câmera Jardim', date: 'Ontem, 14:20', type: 'security', severity: 'medium' },
        { id: 5, action: 'Novo Guardião Admitido', user: 'Gestor Espaço', target: 'Mestre Ana', date: '29 Jan, 11:00', type: 'team', severity: 'low' },
    ];

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        }
    };

    const filteredLogs = useMemo(() => {
        const byTab = logs.filter((log) => {
            if (activeTab === 'Todos') return true;
            if (activeTab === 'Contratos') return log.type === 'contract';
            if (activeTab === 'Financeiro') return log.type === 'finance';
            if (activeTab === 'Salas') return log.type === 'room';
            return log.type === 'team';
        });

        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) return byTab;
        return byTab.filter((log) => `${log.action} ${log.user} ${log.target}`.toLowerCase().includes(normalizedSearch));
    }, [activeTab, logs, searchTerm]);

    const handleExport = () => {
        const csvHeader = 'id,acao,usuario,alvo,data,tipo,severidade';
        const csvRows = filteredLogs.map((log) => `${log.id},"${log.action}","${log.user}","${log.target}","${log.date}",${log.type},${log.severity}`);
        const blob = new Blob([[csvHeader, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `auditoria-viva360-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-[#fcfdfc] animate-in fade-in">
            <header className="p-6 flex items-center justify-between border-b border-nature-100 bg-white sticky top-0 z-10">
                <button onClick={() => flow.go('GOVERNANCE')} className="p-2 hover:bg-nature-50 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-nature-900" />
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest leading-none mb-1">Segurança & Governança</p>
                    <h2 className="text-lg font-serif italic text-nature-900 leading-none">Trilha de Auditoria</h2>
                </div>
                <div className="w-10 h-10 bg-nature-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Shield size={18} />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
                {/* Search & Filters */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" size={18} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Buscar por usuário, ação ou alvo..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-nature-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-nature-900/10 placeholder:text-nature-300 transition-all"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['Todos', 'Contratos', 'Financeiro', 'Salas', 'Equipe'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border ${activeTab === tab ? 'bg-nature-900 text-white border-nature-900' : 'bg-white text-nature-400 border-nature-100'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Log List */}
                <div className="space-y-4">
                    {filteredLogs.map(log => (
                        <div key={log.id} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex gap-4 hover:shadow-md transition-all group">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${getSeverityStyles(log.severity)}`}>
                                 <Lock size={20} />
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start mb-1">
                                     <h4 className="font-bold text-nature-900 text-sm truncate">{log.action}</h4>
                                     <span className="text-[9px] font-bold text-nature-400 uppercase shrink-0">{log.date}</span>
                                 </div>
                                 <div className="flex flex-col gap-1">
                                     <div className="flex items-center gap-1.5">
                                         <User size={12} className="text-nature-300" />
                                         <span className="text-[11px] text-nature-600"><span className="font-bold text-nature-900">{log.user}</span> em {log.target}</span>
                                     </div>
                                     <div className="flex items-center gap-1.5">
                                         <FileText size={12} className="text-nature-300" />
                                         <span className="text-[9px] font-bold uppercase tracking-widest text-nature-400 italic">Ref: #{1024 + log.id}</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>

                {/* Export CTA */}
                <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 flex flex-col items-center text-center gap-4 border-dashed mt-8">
                     <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-600">
                         <Calendar size={28} />
                     </div>
                     <div>
                         <h4 className="font-bold text-indigo-900">Relatório de Integridade</h4>
                         <p className="text-xs text-indigo-700 opacity-80 mt-1">Gere um log criptografado de todas as ações dos últimos 30 dias para exportação jurídica.</p>
                     </div>
                     <button onClick={handleExport} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                         Exportar Log (PDF)
                     </button>
                </div>
            </div>
        </div>
    );
};
