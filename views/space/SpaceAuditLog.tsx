import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Shield, Search, FileText, User, Calendar, Lock, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

type AuditLog = {
    id: string | number;
    action: string;
    user: string;
    target: string;
    date: string;
    type: string;
    severity: 'high' | 'medium' | 'low';
};

const normalizeLog = (raw: any, i: number): AuditLog => ({
    id: raw.id || i,
    action: raw.action || raw.operation || raw.event || 'Operação',
    user: raw.user || raw.actor || raw.performed_by || raw.user_email || 'Sistema',
    target: raw.target || raw.resource || raw.entity || raw.description || '—',
    date: raw.created_at || raw.date || raw.timestamp
        ? new Date(raw.created_at || raw.date || raw.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '—',
    type: raw.type || raw.category || 'system',
    severity: raw.severity || (raw.type === 'finance' ? 'high' : raw.type === 'security' ? 'medium' : 'low'),
});

const getSeverityStyles = (severity: string) => {
    switch (severity) {
        case 'high': return 'bg-rose-50 text-rose-600 border-rose-100';
        case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
        default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
};

const TABS = ['Todos', 'Contratos', 'Financeiro', 'Salas', 'Equipe'] as const;
type Tab = typeof TABS[number];

export const SpaceAuditLog: React.FC<{ flow: any }> = ({ flow }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('Todos');
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);

    const fetchLogs = async (isRetry = false) => {
        if (isRetry) setRetrying(true); else setLoading(true);
        try {
            const data = await api.audit.listLogs();
            const list = Array.isArray(data) ? data : [];
            setLogs(list.map(normalizeLog));
        } catch {
            flow?.notify?.('Auditoria', 'Não foi possível carregar os registros de auditoria.', 'warning');
            setLogs([]);
        } finally {
            setLoading(false);
            setRetrying(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const filteredLogs = useMemo(() => {
        const byTab = logs.filter((log) => {
            if (activeTab === 'Todos') return true;
            if (activeTab === 'Contratos') return log.type === 'contract';
            if (activeTab === 'Financeiro') return log.type === 'finance';
            if (activeTab === 'Salas') return log.type === 'room';
            return log.type === 'team';
        });
        const s = searchTerm.trim().toLowerCase();
        if (!s) return byTab;
        return byTab.filter((log) => `${log.action} ${log.user} ${log.target}`.toLowerCase().includes(s));
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
                <div className="flex items-center gap-2">
                    <button onClick={() => fetchLogs(true)} disabled={retrying} className="p-2 hover:bg-nature-50 rounded-full transition-colors disabled:opacity-50">
                        <RefreshCw size={18} className={`text-nature-400 ${retrying ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={handleExport} disabled={loading || logs.length === 0} className="p-2 hover:bg-nature-50 rounded-full transition-colors disabled:opacity-40">
                        <FileText size={18} className="text-nature-400" />
                    </button>
                </div>
            </header>

            {/* Search */}
            <div className="px-6 pt-4">
                <div className="flex items-center gap-3 bg-white border border-nature-100 rounded-2xl px-4 py-3 shadow-sm">
                    <Search size={16} className="text-nature-300" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por ação, usuário ou alvo..."
                        className="flex-1 bg-transparent border-none outline-none text-nature-900 placeholder:text-nature-300 text-sm font-medium"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 py-4 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors border ${
                            activeTab === tab
                                ? 'bg-nature-900 text-white border-nature-900'
                                : 'bg-white border-nature-100 text-nature-500 hover:bg-nature-50'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-nature-300" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12">
                        <Shield size={32} className="mx-auto text-nature-200 mb-3" />
                        <p className="text-xs text-nature-400 italic">
                            {logs.length === 0 ? 'Nenhum log de auditoria disponível.' : 'Nenhum resultado para esse filtro.'}
                        </p>
                    </div>
                ) : filteredLogs.map((log) => (
                    <div key={log.id} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex gap-4 items-start">
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${getSeverityStyles(log.severity)}`}>
                            {log.type === 'contract' ? <FileText size={16} /> :
                             log.type === 'finance'  ? <Shield size={16} /> :
                             log.type === 'room'     ? <Calendar size={16} /> :
                             log.type === 'security' ? <Lock size={16} /> :
                             <User size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-nature-900 text-sm leading-tight">{log.action}</h4>
                                <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${getSeverityStyles(log.severity)}`}>
                                    {log.severity === 'high' ? 'Alto' : log.severity === 'medium' ? 'Médio' : 'Baixo'}
                                </span>
                            </div>
                            <p className="text-[10px] text-nature-500 mt-1">
                                <span className="font-bold">{log.user}</span> · {log.target}
                            </p>
                            <p className="text-[9px] text-nature-300 mt-1 font-bold uppercase tracking-wider">{log.date}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
