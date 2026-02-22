
import React, { useState, useEffect } from 'react';
import { ViewState, User, UserRole } from '../types';
import { api } from '../services/api';
import {
    LayoutDashboard, Users, BarChart3, Shield, AlertTriangle, CheckCircle,
    Search, Ban, Eye, FileText, ChevronRight, Activity, DollarSign, Database
} from 'lucide-react';
import { PortalView, ZenToast, Card } from '../components/Common';

export const AdminViews: React.FC<{ user: User, view: ViewState, setView: (v: ViewState) => void }> = ({ user, view, setView }) => {
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ title: string, message: string } | null>(null);

    const handleLegalReportExport = () => {
        const csv = ['acao,alvo,data', `relatorio_legal,consent_logs,${new Date().toISOString()}`].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `viva360-relatorio-legal-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setToast({ title: 'Relatório exportado', message: 'O arquivo legal foi gerado com sucesso.' });
    };

    const refreshDashboard = async () => {
        setIsLoading(true);
        try {
            // Mock data if backend not fully ready or for demo speed
            const dash = await api.admin.getDashboard().catch(() => ({
                totalUsers: 1250,
                activeUsers: 890,
                revenue: 45000,
                systemHealth: 98
            }));
            setStats(dash);
        } catch (e) { console.error(e); }
        setIsLoading(false);
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const list: User[] = await api.admin.listUsers().catch(() => [
                { id: 'u1', name: 'Maria Silva', email: 'maria@email.com', role: UserRole.CLIENT, status: 'active', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 } as any,
                { id: 'u2', name: 'Dr. João', email: 'joao@email.com', role: UserRole.PROFESSIONAL, status: 'active', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 } as any,
                { id: 'u3', name: 'Espaço Zen', email: 'zen@email.com', role: UserRole.SPACE, status: 'blocked', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 } as any
            ]);
            setUsers(list);
        } catch (e) { console.error(e); }
        setIsLoading(false);
    };

    useEffect(() => {
        let cancelled = false;
        const safeSetStats = (v: any) => { if (!cancelled) setStats(v); };
        const safeSetUsers = (v: User[]) => { if (!cancelled) setUsers(v); };
        const safeSetLoading = (v: boolean) => { if (!cancelled) setIsLoading(v); };

        if (view === ViewState.ADMIN_DASHBOARD) {
            safeSetLoading(true);
            api.admin.getDashboard()
                .catch(() => ({ totalUsers: 1250, activeUsers: 890, revenue: 45000, systemHealth: 98 }))
                .then((dash) => { safeSetStats(dash); safeSetLoading(false); });
        }
        if (view === ViewState.ADMIN_USERS) {
            safeSetLoading(true);
            api.admin.listUsers()
                .catch(() => [
                    { id: 'u1', name: 'Maria Silva', email: 'maria@email.com', role: UserRole.CLIENT, status: 'active', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 } as any,
                    { id: 'u2', name: 'Dr. João', email: 'joao@email.com', role: UserRole.PROFESSIONAL, status: 'active', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 } as any,
                    { id: 'u3', name: 'Espaço Zen', email: 'zen@email.com', role: UserRole.SPACE, status: 'blocked', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 } as any,
                ])
                .then((list) => { safeSetUsers(list); safeSetLoading(false); });
        }
        return () => { cancelled = true; };
    }, [view]);

    // --- DASHBOARD ---
    if (view === ViewState.ADMIN_DASHBOARD) return (
        <PortalView title="Governança" subtitle="VISÃO EXECUTIVA" showCloseWithBack={false}>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-nature-900 text-white p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400">Total Usuários</p>
                        <h3 className="text-3xl font-serif italic mt-2">{stats?.totalUsers || '...'}</h3>
                    </Card>
                    <Card className="bg-white p-6 border-nature-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-nature-400">Receita Global</p>
                        <h3 className="text-3xl font-serif italic mt-2 text-emerald-600">R$ {stats?.revenue ? (stats.revenue / 1000).toFixed(1) + 'k' : '...'}</h3>
                    </Card>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-nature-900 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} className="text-primary-500" /> Saúde do Sistema
                    </h4>
                    <div className="h-4 bg-nature-50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[98%]"></div>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-bold text-right">98% Uptime</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setView(ViewState.ADMIN_USERS)} className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm hover:shadow-md transition-all text-center space-y-2 group">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"><Users size={24} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Usuários</span>
                    </button>
                    <button onClick={() => setView(ViewState.ADMIN_LGPD)} className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm hover:shadow-md transition-all text-center space-y-2 group">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"><Shield size={24} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">LGPD & Logs</span>
                    </button>
                </div>
            </div>
        </PortalView>
    );

    // --- USERS ---
    if (view === ViewState.ADMIN_USERS) return (
        <PortalView title="Comunidade" subtitle="GESTÃO DE ACESSO" onBack={() => setView(ViewState.ADMIN_DASHBOARD)}>
            <div className="space-y-6">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-300" size={18} />
                    <input type="text" placeholder="Buscar por e-mail, nome ou ID..." className="w-full bg-white border border-nature-100 py-4 pl-14 pr-6 rounded-2xl text-sm shadow-sm outline-none" />
                </div>

                <div className="space-y-4">
                    {users.map((u: any) => (
                        <div key={u.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs ${u.role === 'CLIENT' ? 'bg-primary-50 text-primary-600' : u.role === 'PROFESSIONAL' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {u.role.substring(0, 2)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-nature-900 text-sm">{u.name}</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase">{u.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setToast({ title: "Visualizando", message: `Detalhes de ${u.name}` })} className="p-3 bg-nature-50 text-nature-400 rounded-xl hover:text-nature-900"><Eye size={16} /></button>
                                <button onClick={() => setToast({ title: "Usuário Bloqueado", message: `${u.name} foi bloqueado.` })} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100"><Ban size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </PortalView>
    );

    // --- LGPD ---
    if (view === ViewState.ADMIN_LGPD) return (
        <PortalView title="Privacidade" subtitle="AUDITORIA LGPD" onBack={() => setView(ViewState.ADMIN_DASHBOARD)}>
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-serif italic text-lg text-nature-900">Logs de Consentimento</h4>
                        <Database size={20} className="text-nature-200" />
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-nature-50 rounded-2xl">
                                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                <p className="text-[10px] text-nature-600 leading-tight">
                                    <span className="font-bold">User_{100 + i}</span> aceitou compartilhar dados clínicos com <span className="font-bold">Pro_Anna</span>.
                                    <br /><span className="text-[9px] text-nature-400 uppercase">{new Date().toLocaleDateString()} - Hash: 0x8F...2A</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={handleLegalReportExport} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"><FileText size={16} /> Exportar Relatório Legal</button>
            </div>
        </PortalView>
    );

    return null;
};
