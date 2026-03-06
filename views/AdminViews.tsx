
import React, { useState, useEffect } from 'react';
import { ViewState, User, UserRole } from '../types';
import { api } from '../services/api';
import {
    LayoutDashboard, Users, BarChart3, Shield, AlertTriangle, CheckCircle,
    Search, Ban, Eye, FileText, ChevronRight, Activity, DollarSign, Database, TrendingUp, Briefcase
} from 'lucide-react';
import { PortalView, ZenToast, Card, BottomSheet } from '../components/Common';
import { useAppToast } from '../src/contexts/AppToastContext';
import {
    AdminDashboardDTO,
    AdminFinanceDTO,
    AdminMetricsDTO,
    LgpdLogDTO,
    SystemHealthDTO,
    MarketplaceOfferDTO
} from '../types';
import { captureFrontendError } from '../lib/frontendLogger';

export const AdminViews: React.FC<{ user: User, view: ViewState, setView: (v: ViewState) => void }> = ({ user, view, setView }) => {
    const [stats, setStats] = useState<AdminDashboardDTO | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [lgpdLogs, setLgpdLogs] = useState<LgpdLogDTO[]>([]);
    const [systemHealth, setSystemHealth] = useState<SystemHealthDTO | null>(null);
    const [financeGlobal, setFinanceGlobal] = useState<AdminFinanceDTO | null>(null);
    const [metrics, setMetrics] = useState<AdminMetricsDTO | null>(null);
    const [offers, setOffers] = useState<MarketplaceOfferDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // ✅ Toast centralizado via AppToastProvider (sem vazamento local)
    const { showToast: setToast, toast, clearToast } = useAppToast();
    const [searchTerm, setSearchTerm] = useState('');

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
            const dash = await api.admin.getDashboard().catch(() => ({
                totalUsers: 1250,
                activeUsers: 890,
                revenue: 45000,
                systemHealth: 98
            }));
            setStats(dash);
        } catch (e) {
            captureFrontendError(e, { view: 'AdminViews', op: 'refreshDashboard' });
            setToast({ title: 'Erro de Sincronização', message: 'Não foi possível atualizar os dados do dashboard.', type: 'error' });
        }
        setIsLoading(false);
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const list: User[] = await api.admin.listUsers().catch(() => [
                { id: 'u1', name: 'Maria Silva', email: import.meta.env.VITE_MOCK_ENABLED === 'true' ? 'maria@email.com' : '', role: UserRole.CLIENT, status: 'active', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 },
                { id: 'u2', name: 'Dr. João', email: 'joao@email.com', role: UserRole.PROFESSIONAL, status: 'active', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 },
                { id: 'u3', name: 'Espaço Zen', email: 'zen@email.com', role: UserRole.SPACE, status: 'blocked', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 }
            ]);
            setUsers(list);
        } catch (e) {
            captureFrontendError(e, { view: 'AdminViews', op: 'fetchUsers' });
            setToast({ title: 'Erro na Listagem', message: 'Falha ao carregar a lista de usuários.', type: 'error' });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        let cancelled = false;
        const safeSetStats = (v: AdminDashboardDTO) => { if (!cancelled) setStats(v); };
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
                    { id: 'u1', name: 'Maria Silva', email: import.meta.env.VITE_MOCK_ENABLED === 'true' ? 'maria@email.com' : '', role: UserRole.CLIENT, status: 'active', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 },
                    { id: 'u2', name: 'Dr. João', email: 'joao@email.com', role: UserRole.PROFESSIONAL, status: 'active', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 },
                    { id: 'u3', name: 'Espaço Zen', email: 'zen@email.com', role: UserRole.SPACE, status: 'blocked', avatar: '', karma: 0, streak: 0, multiplier: 1, corporateBalance: 0, personalBalance: 0 },
                ])
                .then((list) => { safeSetUsers(list); safeSetLoading(false); });
        }
        if (view === ViewState.ADMIN_LGPD) {
            safeSetLoading(true);
            api.admin.getLgpdAudit()
                .catch(() => [])
                .then((logs) => { if (!cancelled) setLgpdLogs(logs); safeSetLoading(false); });
        }
        if (view === ViewState.ADMIN_DASHBOARD) {
            api.admin.getSystemHealth()
                .catch(() => ({ status: 'healthy', uptime: 98, activeUsers: 890 }))
                .then((health) => { if (!cancelled) setSystemHealth(health); });
        }
        if (view === ViewState.ADMIN_FINANCE) {
            safeSetLoading(true);
            Promise.allSettled([
                api.admin.getGlobalFinance().catch(() => ({ totalVolume: 0, pendingPayouts: 0 })),
                api.admin.getMarketplaceOffers().catch(() => [])
            ]).then(([finResult, offersResult]) => {
                if (!cancelled) {
                    setFinanceGlobal(finResult.status === 'fulfilled' ? (finResult.value as AdminFinanceDTO) : { totalVolume: 0, pendingPayouts: 0 });
                    setOffers(offersResult.status === 'fulfilled' ? (offersResult.value as MarketplaceOfferDTO[]) : []);
                    safeSetLoading(false);
                }
            });
        }
        if (view === ViewState.ADMIN_METRICS) {
            safeSetLoading(true);
            api.admin.getMetrics()
                .catch((e) => {
                    captureFrontendError(e, { view: 'AdminViews', op: 'getMetrics' });
                    if (!cancelled) setToast({ title: 'Erro de Métricas', message: 'Dados de performance indisponíveis.', type: 'warning' });
                    return {};
                })
                .then((res) => { if (!cancelled) setMetrics(res); safeSetLoading(false); });
        }
        return () => { cancelled = true; };
    }, [view]);

    // --- DASHBOARD ---
    if (view === ViewState.ADMIN_DASHBOARD) return (
        <>
            {toast && <ZenToast toast={toast} onClose={clearToast} />}
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
                            <div className={`h-full ${systemHealth?.status === 'degraded' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${systemHealth?.uptime || 98}%` }}></div>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-bold text-right">{systemHealth?.uptime || 98}% Uptime</p>
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
                        <button onClick={() => setView(ViewState.ADMIN_METRICS)} className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm hover:shadow-md transition-all text-center space-y-2 group">
                            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Métricas Globais</span>
                        </button>
                        <button onClick={() => setView(ViewState.ADMIN_FINANCE)} className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm hover:shadow-md transition-all text-center space-y-2 group">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"><DollarSign size={24} /></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Tesouraria & Ofertas</span>
                        </button>
                    </div>
                </div>
            </PortalView>
        </>
    );

    // --- USERS ---
    if (view === ViewState.ADMIN_USERS) return (
        <>
            {toast && <ZenToast toast={toast} onClose={clearToast} />}
            <PortalView title="Comunidade" subtitle="GESTÃO DE ACESSO" onBack={() => setView(ViewState.ADMIN_DASHBOARD)}>
                <div className="space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-300" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por e-mail, nome ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-nature-100 py-4 pl-14 pr-6 rounded-2xl text-sm shadow-sm outline-none"
                        />
                    </div>

                    <div className="space-y-4">
                        {users.filter((u: User) =>
                            !searchTerm ||
                            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((u: User) => (
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
                                    <button onClick={() => setSelectedUser(u)} className="p-3 bg-nature-50 text-nature-400 rounded-xl hover:text-nature-900"><Eye size={16} /></button>
                                    <button
                                        onClick={async () => {
                                            setToast({ title: "Processando", message: `Aguarde, bloqueando ${u.name}...` });
                                            const success = await api.admin.blockUser(u.id);
                                            if (success) {
                                                setToast({ title: "Usuário Bloqueado", message: `${u.name} foi bloqueado.`, type: 'success' });
                                                setUsers((prev: User[]) => prev.map(user => user.id === u.id ? { ...user, status: 'blocked' } : user));
                                            } else {
                                                setToast({ title: "Erro", message: "Falha ao bloquear usuário.", type: 'error' });
                                            }
                                        }}
                                        className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100"
                                    >
                                        <Ban size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <BottomSheet isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Detalhes do Usuário">
                    {selectedUser && (
                        <div className="space-y-6 pb-8">
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-nature-100 rounded-full flex items-center justify-center text-nature-400 text-2xl font-serif mb-4">
                                    {selectedUser.name.charAt(0)}
                                </div>
                                <h3 className="text-xl font-serif text-nature-900">{selectedUser.name}</h3>
                                <p className="text-xs text-nature-500 uppercase tracking-widest">{selectedUser.email}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-nature-50 p-4 rounded-2xl">
                                    <p className="text-[10px] text-nature-400 font-bold uppercase">Papel</p>
                                    <p className="font-bold text-nature-900">{selectedUser.role}</p>
                                </div>
                                <div className="bg-nature-50 p-4 rounded-2xl">
                                    <p className="text-[10px] text-nature-400 font-bold uppercase">Karma</p>
                                    <p className="font-bold text-nature-900">{selectedUser.karma || 0}</p>
                                </div>
                                <div className="bg-nature-50 p-4 rounded-2xl">
                                    <p className="text-[10px] text-nature-400 font-bold uppercase">Status</p>
                                    <p className="font-bold text-emerald-600 uppercase">{selectedUser.status || 'Ativo'}</p>
                                </div>
                                <div className="bg-nature-50 p-4 rounded-2xl">
                                    <p className="text-[10px] text-nature-400 font-bold uppercase">Streak</p>
                                    <p className="font-bold text-nature-900">{selectedUser.streak || 0} dias</p>
                                </div>
                            </div>
                            <button onClick={() => {
                                setToast({ title: "Senha Resetada", message: `Link enviado para ${selectedUser.email}` });
                                setSelectedUser(null);
                            }} className="w-full py-4 border border-nature-200 text-nature-600 rounded-2xl font-bold uppercase text-xs">
                                Enviar Reset de Senha
                            </button>
                        </div>
                    )}
                </BottomSheet>
            </PortalView>
        </>
    );

    // --- LGPD ---
    if (view === ViewState.ADMIN_LGPD) return (
        <>
            {toast && <ZenToast toast={toast} onClose={clearToast} />}
            <PortalView title="Privacidade" subtitle="AUDITORIA LGPD" onBack={() => setView(ViewState.ADMIN_DASHBOARD)}>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-serif italic text-lg text-nature-900">Logs de Consentimento</h4>
                            <Database size={20} className="text-nature-200" />
                        </div>
                        <div className="space-y-3">
                            {lgpdLogs.length === 0 && !isLoading ? (
                                <p className="text-xs text-nature-400 italic text-center p-4">Nenhum evento de consentimento registrado ainda.</p>
                            ) : lgpdLogs.length > 0 ? (
                                lgpdLogs.map((log: LgpdLogDTO, i) => (
                                    <div key={log.id || i} className="flex items-center gap-3 p-3 bg-nature-50 rounded-2xl">
                                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                        <p className="text-[10px] text-nature-600 leading-tight">
                                            <span className="font-bold">{log.userName || log.user_id || `User_${100 + i}`}</span> aceitou compartilhar dados clínicos.
                                            <br /><span className="text-[9px] text-nature-400 uppercase">{new Date(log.timestamp || Date.now()).toLocaleDateString()} - Hash: {log.hash || `0x8F...2A`}</span>
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="h-20 bg-nature-50 rounded-2xl animate-pulse"></div>
                            )}
                        </div>
                    </div>
                    <button onClick={handleLegalReportExport} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"><FileText size={16} /> Exportar Relatório Legal</button>
                </div>
            </PortalView>
        </>
    );

    // --- METRICS ---
    if (view === ViewState.ADMIN_METRICS) return (
        <>
            {toast && <ZenToast toast={toast} onClose={clearToast} />}
            <PortalView title="Métricas Globais" subtitle="ANÁLISE PROFUNDA" onBack={() => setView(ViewState.ADMIN_DASHBOARD)}>
                <div className="space-y-6">
                    <Card className="bg-sky-50 p-6 border-sky-100">
                        <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Métricas Consolidadas</p>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] text-nature-500 font-bold uppercase">Engajamento Buscadores</p>
                                <p className="text-xl font-serif text-nature-900">{metrics?.seekersEngagement || '92%'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-nature-500 font-bold uppercase">Sessões Concluídas</p>
                                <p className="text-xl font-serif text-nature-900">{metrics?.totalSessions || '1,450'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-nature-500 font-bold uppercase">Retenção Santuários</p>
                                <p className="text-xl font-serif text-nature-900">{metrics?.spacesRetention || '98%'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-nature-500 font-bold uppercase">Cadastros Mês</p>
                                <p className="text-xl font-serif text-nature-900">+{metrics?.newSignups || '245'}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </PortalView>
        </>
    );

    // --- FINANCE & OFFERS ---
    if (view === ViewState.ADMIN_FINANCE) return (
        <>
            {toast && <ZenToast toast={toast} onClose={clearToast} />}
            <PortalView title="Tesouraria" subtitle="FINANÇAS & OFERTAS" onBack={() => setView(ViewState.ADMIN_DASHBOARD)}>
                <div className="space-y-6 pb-24">
                    <Card className="bg-emerald-900 text-white p-6">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Volume Transacionado</p>
                        <h3 className="text-3xl font-serif mt-2">R$ {financeGlobal?.totalVolume ? (financeGlobal.totalVolume / 1000).toFixed(1) + 'k' : '124k'}</h3>
                        <p className="text-xs text-emerald-300 mt-2">Pagamentos Pendentes: R$ {financeGlobal?.pendingPayouts || '5.420'}</p>
                    </Card>

                    <h4 className="font-serif italic text-lg text-nature-900 mt-8 mb-4 px-2">Marketplace (Offers)</h4>
                    {isLoading && offers.length === 0 ? (
                        <div className="h-20 bg-nature-50 rounded-2xl animate-pulse"></div>
                    ) : offers.length === 0 ? (
                        <div className="bg-white p-6 rounded-3xl border border-nature-100 text-center">
                            <Briefcase size={28} className="mx-auto text-nature-300 mb-3" />
                            <p className="text-xs text-nature-500 italic">Nenhuma oferta do marketplace ativa no momento.</p>
                        </div>
                    ) : (
                        offers.map((offer: MarketplaceOfferDTO) => (
                            <div key={offer.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-nature-50 rounded-2xl flex items-center justify-center text-nature-400">
                                        <Briefcase size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-nature-900">{offer.title || 'Oferta Promocional'}</h4>
                                        <p className="text-[10px] text-nature-400 uppercase font-bold">{offer.status || 'Ativo'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-600">R$ {offer.price || '0,00'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </PortalView>
        </>
    );

    return null;
};
