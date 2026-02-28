import React, { useState } from 'react';
import { ViewState, Professional, User, Notification } from '../../types';
import { Zap, History, Calendar, Flower, Briefcase, Wallet, ShoppingBag, Sparkles, Plus, Stethoscope, Layers, ChevronRight, Bell, MessageCircle, Video, Trophy, Target, Flame, Star, CheckCircle2, Award, Lock } from 'lucide-react';
import { DynamicAvatar, PortalCard, Logo, NotificationDrawer } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/useGuardiaoFlow';
import { api } from '../../services/api';
import { useGuardianPresence } from '../../src/hooks/useGuardianPresence';
import { PRO_ACHIEVEMENTS, checkAchievements, getUserRank, PRO_RANKS, getRankProgress, getUnlockedCount } from '../../utils/gamification';
import { useCountUp } from '../../src/hooks/useCountUp';

type DashboardAppointmentLike = {
    status?: string;
    date?: string;
    time?: string;
    clientName?: string;
    [key: string]: unknown;
};

export const ProDashboard: React.FC<{
    user: Professional,
    setView: (v: ViewState) => void,
    updateUser: (u: User) => void,
    data?: unknown
}> = ({ user, setView, updateUser, data }) => {
    const { go, notify, selectAppointment, state } = useGuardiaoFlow();
    const [activeTab, setActiveTab] = useState<'consultorio' | 'financeiro' | 'comunidade'>('consultorio');
    const [showNotifications, setShowNotifications] = useState(false);
    const { status, toggleStatus, isOnline } = useGuardianPresence(user);

    // Real Notifications from API
    const [notifications, setNotifications] = useState<Notification[]>([]);
    React.useEffect(() => {
        let cancelled = false;
        api.notifications.list().then((data: Notification[]) => {
            if (!cancelled && Array.isArray(data)) setNotifications(data);
        }).catch(() => { /* silently keep empty — non-critical */ });
        return () => { cancelled = true; };
    }, [user.id]);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // Weekly Challenge Tasks — loaded from gamification API
    const [weeklyTasks, setWeeklyTasks] = useState([
        { id: 'sessions', label: '3 Sessões', done: false },
        { id: 'evolution', label: '1 Evolução', done: false },
        { id: 'escambo', label: '1 Escambo', done: false },
        { id: 'registros', label: '5 Registros', done: false },
    ]);
    const [leaderboard, setLeaderboard] = React.useState<Array<{ userId: string; name: string; karma: number; avatar?: string | null }>>([]);
    React.useEffect(() => {
        let cancelled = false;
        api.gamification.getLeaderboard().then((data) => {
            if (cancelled || !data) return;
            // Sync weekly tasks with real challenge state
            if (data.me?.challenges?.items?.length) {
                setWeeklyTasks(prev => prev.map(t => {
                    const match = data.me!.challenges.items.find(
                        (ch) => ch.id === t.id || ch.label.toLowerCase().includes(t.id)
                    );
                    return match ? { ...t, done: match.completed } : t;
                }));
            }
            // Populate leaderboard (include self + others)
            if (data.leaderboard?.length) {
                setLeaderboard(data.leaderboard.slice(0, 5));
            }
        }).catch(() => { /* non-critical */ });
        return () => { cancelled = true; };
    }, [user.id]);
    const weeklyDone = weeklyTasks.filter(t => t.done).length;
    const weeklyTotal = weeklyTasks.length;

    const toggleWeeklyTask = (id: string) => {
        setWeeklyTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
        const task = weeklyTasks.find(t => t.id === id);
        if (task && !task.done) {
            const karmaReward = 25;
            const updated = { ...user, karma: (user.karma || 0) + karmaReward };
            updateUser(updated);
            notify(`+${karmaReward} Karma`, `${task.label} concluída!`, 'success');
        }
    };

    // Gamification
    const proAchievements = checkAchievements(user, PRO_ACHIEVEMENTS);
    const proUnlocked = getUnlockedCount(proAchievements);
    const proRank = getUserRank(user.karma || 0, PRO_RANKS);
    const proRankProgress = getRankProgress(user.karma || 0, PRO_RANKS);
    const animatedKarma = useCountUp(user.karma || 0);

    const nextAppointment = (() => {
        const apts = state.data.appointments || [];
        const parsed = (apts as unknown[])
            .filter((a): a is DashboardAppointmentLike => !!a && typeof a === 'object' && ['confirmed', 'pending'].includes(String((a as { status?: unknown }).status || '')))
            .map((a) => {
                const base = String(a.date || '');
                const dt = base.includes('T') ? new Date(base) : new Date(`${base}T${String(a.time || '00:00')}`);
                return { apt: a, dt };
            })
            .filter((entry) => Number.isFinite(entry.dt.getTime()))
            .sort((a, b) => a.dt.getTime() - b.dt.getTime());
        const now = Date.now();
        return parsed.find((p) => p.dt.getTime() >= now - 30 * 60 * 1000)?.apt || parsed[0]?.apt || null;
    })();

    return (
        <div className="flex flex-col animate-in fade-in w-full bg-[#fcfdfc] min-h-screen pb-32">
            {/* PRESENCE BANNER */}
            <div className={`w-full px-6 py-2.5 flex items-center justify-between transition-all duration-500 ${isOnline ? 'bg-emerald-50/50 backdrop-blur-sm border-b border-emerald-100/50' : 'bg-slate-50/50 backdrop-blur-sm border-b border-slate-100/50'}`}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`}></div>
                        {isOnline && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></div>}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${isOnline ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {isOnline ? 'Frequência Ativa' : 'Frequência Oculta'}
                    </span>
                </div>
                <button
                    onClick={toggleStatus}
                    className={`text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full transition-all duration-300 ${isOnline ? 'bg-white text-emerald-600 border border-emerald-200 shadow-sm hover:shadow-md' : 'bg-nature-900 text-white shadow-md hover:bg-black hover:scale-105'}`}
                >
                    {isOnline ? 'Recolher' : 'Irradiar'}
                </button>
            </div>

            <NotificationDrawer
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllRead={handleMarkAllRead}
            />

            <header className="flex items-center justify-between mt-6 mb-8 px-6 flex-none relative">
                <div className="flex items-center gap-4">
                    <button onClick={() => go('SETTINGS')} className="relative group transition-transform duration-500 hover:scale-105">
                        <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-2xl" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center z-20 shadow-lg"><Zap size={10} className="text-white fill-white" /></div>
                    </button>
                    <div>
                        <h2 className="text-2xl font-serif italic text-nature-900 leading-tight">Guardião {user.name.split(' ')[0]}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            <p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.2em]">Caminho da Cura</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => go('CHAT_LIST')} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 hover:text-nature-900 active:scale-95 transition-all"><MessageCircle size={20} /></button>
                    <button onClick={() => setShowNotifications(true)} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 hover:text-nature-900 active:scale-95 transition-all relative">
                        <Bell size={20} />
                        {notifications.some(n => !n.read) && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>}
                    </button>
                    <button onClick={() => go('AGENDA_VIEW')} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 hover:text-nature-900 active:scale-95 transition-all"><Calendar size={20} /></button>
                </div>
            </header>

            {/* HUB DE JORNADA E AÇÕES RÁPIDAS */}
            <div className="px-6 space-y-6">

                {/* SESSION BANNER - Refined and Integrated */}
                <div className="animate-in slide-in-from-top-4 duration-700">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-5 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors"></div>
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 bg-white/15 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                                <Video size={24} className="text-white animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-emerald-400/30 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-400/20">
                                        {nextAppointment?.date ? 'Hoje' : 'Sessão'} • {nextAppointment?.time || '14:00'}
                                    </span>
                                </div>
                                <h4 className="text-base font-bold tracking-tight">
                                    Sintonizando com {nextAppointment?.clientName ? String(nextAppointment.clientName).split(' ')[0] : user.name.split(' ')[0]}
                                </h4>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (!nextAppointment) {
                                    notify('Nenhuma sessão', 'Você não tem sessões confirmadas agora.', 'info');
                                    return;
                                }
                                selectAppointment(nextAppointment as any);
                                go('VIDEO_PREP');
                            }}
                            className="bg-white text-emerald-800 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all relative z-10"
                        >
                            Atender
                        </button>
                    </div>
                </div>

                {/* GOAL HUB - Grouped Daily & Weekly for cleaner flow */}
                <div className="bg-white rounded-[3rem] p-6 border border-nature-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <Trophy size={20} />
                            </div>
                            <h3 className="text-lg font-serif italic text-nature-900">Minha Jornada</h3>
                        </div>
                        <div className="flex items-center gap-1.5 bg-nature-50 px-3 py-1.5 rounded-full border border-nature-100">
                            <Flame size={14} className="text-orange-500" />
                            <span className="text-[10px] font-bold text-nature-600">{user.streak || 0} dias</span>
                        </div>
                    </div>

                    {/* Daily Progress Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {(() => {
                            const todayStr = new Date().toISOString().slice(0, 10);
                            const todayApts = (state.data.appointments || []).filter((a: any) => String(a.date || '').slice(0, 10) === todayStr);
                            const attended = todayApts.filter((a: any) => ['completed', 'confirmed'].includes(String(a.status || ''))).length;
                            const totalToday = Math.max(todayApts.length, attended);
                            const registered = todayApts.filter((a: any) => !!a.notes || !!a.clinical_notes).length;
                            return [
                                { label: 'Atender', done: attended, total: Math.max(totalToday, 1), icon: Stethoscope, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                { label: 'Registrar', done: registered, total: Math.max(totalToday, 1), icon: Flower, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { label: 'Verificar', done: todayApts.length > 0 ? 1 : 0, total: 1, icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-50' },
                            ];
                        })().map((goal, i) => (
                            <div key={i} className="flex flex-col items-center p-4 rounded-3xl bg-nature-25 border border-nature-50 shadow-sm hover:shadow-md transition-all group">
                                <div className={`${goal.bg} ${goal.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                                    <goal.icon size={18} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-nature-400 mb-1">{goal.label}</span>
                                <span className="text-sm font-black text-nature-900">
                                    {goal.done >= goal.total ? <CheckCircle2 size={16} className="text-emerald-500" /> : `${goal.done}/${goal.total}`}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Weekly Challenge Sub-section */}
                    <div className="pt-2">
                        <div className="flex justify-between items-end mb-3 px-2">
                            <div>
                                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-0.5">Desafio do Guardião</p>
                                <h4 className="text-sm font-bold text-nature-900">Meta Semanal de Cura</h4>
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">+75 Karma</span>
                        </div>

                        <div className="flex gap-2 mb-4">
                            {weeklyTasks.map((task) => (
                                <button
                                    key={task.id}
                                    onClick={() => toggleWeeklyTask(task.id)}
                                    className={`flex-1 py-1.5 rounded-xl text-[8px] font-bold uppercase tracking-wider transition-all active:scale-95 border ${task.done ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' : 'bg-white text-nature-400 border-nature-100 hover:bg-nature-50'}`}
                                >
                                    {task.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative h-2 w-full bg-nature-100 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                style={{ width: `${(weeklyDone / weeklyTotal) * 100}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-2 px-1">
                            <span className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">{weeklyDone}/{weeklyTotal} concluídos</span>
                            <div className="flex gap-1.5 items-center">
                                {weeklyTasks.map((t, idx) => (
                                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${t.done ? 'bg-emerald-500' : 'bg-nature-200'}`}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAB SELECTOR - More modern and integrated */}
                <div className="flex p-1.5 bg-nature-100/50 rounded-2xl backdrop-blur-sm shadow-inner">
                    {[
                        { id: 'consultorio', label: 'Consultório', icon: Stethoscope },
                        { id: 'financeiro', label: 'Abundância', icon: Wallet },
                        { id: 'comunidade', label: 'Egrégora', icon: Zap }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 px-2 text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-white shadow-md text-nature-900 ring-1 ring-nature-100/50' : 'text-nature-400 hover:text-nature-600'}`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-6 space-y-8 mt-8 min-h-[50vh]">

                {/* VIEW: CONSULTÓRIO */}
                {activeTab === 'consultorio' && (
                    <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                        <button
                            type="button"
                            id="hero-agenda"
                            aria-label="Abrir agenda"
                            className="relative h-72 rounded-[3.5rem] overflow-hidden shadow-2xl group cursor-pointer w-full text-left"
                            onClick={() => go('AGENDA_VIEW')}
                        >
                            <img src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=800" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-110" alt="" />
                            <div className="absolute inset-0 bg-nature-900/60 transition-colors group-hover:bg-nature-900/40"></div>
                            <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 bg-emerald-500 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit animate-pulse">Hoje • 14:00</div>
                                    <h3 className="text-3xl font-serif italic leading-none">Minha Agenda</h3>
                                    <p className="text-[10px] text-primary-200 font-bold uppercase tracking-[0.2em] opacity-80">3 Sessões programadas</p>
                                </div>
                            </div>
                            <div className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                                <Calendar size={20} className="text-white" />
                            </div>
                        </button>

                        <div className="grid grid-cols-1 gap-4">
                            <PortalCard id="portal-patients" title="Almas em Cuidado" subtitle="JARDIM" icon={Flower} bgImage="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600" onClick={() => go('PATIENTS_LIST')} />
                        </div>
                    </div>
                )}

                {/* VIEW: ABUNDÂNCIA (FINANCEIRO) */}
                {activeTab === 'financeiro' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[3.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md"><Wallet size={20} /></div>
                                    <div>
                                        <h4 className="text-lg font-serif italic text-white">Abundância</h4>
                                        <p className="text-[9px] font-bold uppercase opacity-70 tracking-widest text-emerald-100">Gestão de Fluxo e Prosperidade</p>
                                    </div>
                                </div>
                                <button onClick={() => go('FINANCIAL_DASHBOARD')} className="bg-white text-emerald-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                    Ver Extrato Detalhado
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <PortalCard id="portal-finance-overview" title="Resumo Mensal" subtitle="FINANÇAS" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=600" onClick={() => go('FINANCIAL_DASHBOARD')} />
                        </div>
                    </div>
                )}

                {/* VIEW: EGRÉGORA (COMUNIDADE) */}
                {activeTab === 'comunidade' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-gradient-to-br from-indigo-900 to-primary-900 rounded-[3.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md"><Zap size={20} /></div>
                                    <div>
                                        <h4 className="text-lg font-serif italic text-white">Rede Viva</h4>
                                        <p className="text-[9px] font-bold uppercase opacity-70 tracking-widest text-indigo-100">Terapia Compartilhada e Escambo</p>
                                    </div>
                                </div>
                                <button onClick={() => go('TRIBE_PRO')} className="bg-white text-indigo-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                    Entrar na Comunidade
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <PortalCard id="portal-marketplace" title="Alquimia" subtitle="BAZAR" icon={ShoppingBag} bgImage="https://images.unsplash.com/photo-1512418490979-92798cec1380?q=80&w=600" onClick={() => go('ESCAMBO_MARKET')} />
                            <PortalCard id="portal-consert" title="Conselheiros" subtitle="CÍRCULO" icon={MessageCircle} bgImage="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600" onClick={() => notify("Círculo de Conselheiros", "Espaço anônimo para discussão clínica em breve.", "info")} />
                        </div>

                        <div className="bg-emerald-50 rounded-[2.5rem] p-6 text-emerald-900 border border-emerald-100 flex items-center justify-between cursor-pointer active:scale-95 transition-all" onClick={async () => {
                            try {
                                const res = await api.users.bless();
                                if (res.user) updateUser(res.user);
                                notify("Bênção Ativada", "Sua luz impulsiona a Radiância da rede.", "success");
                            } catch (err: any) {
                                notify("Erro", err.message || "Não foi possível abençoar a rede.", "error");
                            }
                        }}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100/50 rounded-2xl flex items-center justify-center text-emerald-600"><Sparkles size={20} /></div>
                                <div>
                                    <h4 className="text-sm font-bold">Abençoar Rede</h4>
                                    <p className="text-[9px] uppercase tracking-wider opacity-70">Doe 50 Karma</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"><Plus size={14} /></div>
                        </div>

                        {/* LEADERBOARD - Ranking dos Guardiões */}
                        <div className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-nature-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Trophy size={20} className="text-amber-500" />
                                        <h4 className="font-bold text-nature-900">Harmonia da Egrégora</h4>
                                    </div>
                                    <span className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Semanal</span>
                                </div>
                            </div>
                            <div className="divide-y divide-nature-50">
                                {leaderboard.length > 0 ? (
                                    (() => {
                                        const medals = ['🥇', '🥈', '🥉'];
                                        const allEntries = leaderboard.some(e => e.userId === user.id)
                                            ? leaderboard
                                            : [{ userId: user.id, name: user.name, karma: user.karma || 0 }, ...leaderboard];
                                        return allEntries.slice(0, 5).map((g, idx) => {
                                            const isUser = g.userId === user.id;
                                            return (
                                                <div key={g.userId} className={`flex items-center gap-4 px-6 py-4 ${isUser ? 'bg-emerald-50/50' : ''}`}>
                                                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black bg-amber-50 text-amber-700">
                                                        {medals[idx] || `${idx + 1}`}
                                                    </span>
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-2 bg-emerald-100 text-emerald-700 ring-emerald-300">
                                                        {(g.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-nature-900 text-sm">{g.name}</h5>
                                                        <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">{isUser ? animatedKarma : (g.karma || 0).toLocaleString('pt-BR')} Karma</p>
                                                    </div>
                                                    {isUser && <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-1 rounded-lg uppercase">Você</span>}
                                                </div>
                                            );
                                        });
                                    })()
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4 px-6 py-4 bg-emerald-50/50">
                                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black bg-amber-100 text-amber-700">🥇</span>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-2 bg-emerald-100 text-emerald-700 ring-emerald-300">{user.name.charAt(0)}</div>
                                            <div className="flex-1">
                                                <h5 className="font-bold text-nature-900 text-sm">{user.name}</h5>
                                                <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">{animatedKarma} Karma</p>
                                            </div>
                                            <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-1 rounded-lg uppercase">Você</span>
                                        </div>
                                        <div className="px-6 py-4 text-center">
                                            <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">Ranking completo disponível quando mais guardiões participarem</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Rank & Achievements */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2.5rem] border border-indigo-100 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${proRank.bg}`}>
                                        <Award size={22} className={proRank.color} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-nature-400 uppercase tracking-[0.2em]">Seu Título</p>
                                        <h4 className={`text-lg font-serif italic ${proRank.color}`}>{proRank.name}</h4>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">{proRankProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-1000" style={{ width: `${proRankProgress}%` }}></div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2">
                                {proAchievements.slice(0, 9).map(a => (
                                    <div key={a.id} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${a.unlockedAt ? 'bg-white border border-amber-100 shadow-sm' : 'bg-white/50 opacity-30 grayscale'
                                        }`}>
                                        <span className="text-xl">{a.icon}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-nature-600 text-center leading-tight">{a.label}</span>
                                        {!a.unlockedAt && <Lock size={9} className="text-nature-300" />}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-center text-nature-400 font-bold uppercase tracking-widest">{proUnlocked}/{proAchievements.length} conquistas desbloqueadas</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
