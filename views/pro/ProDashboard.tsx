import React, { useState } from 'react';
import { ViewState, Professional, User } from '../../types';
import { Zap, History, Calendar, Flower, Briefcase, Wallet, ShoppingBag, Sparkles, Plus, Stethoscope, Layers, ChevronRight, Bell, MessageCircle, Video, Trophy, Target, Flame, Star, CheckCircle2 } from 'lucide-react';
import { DynamicAvatar, PortalCard, ZenToast, Logo, NotificationDrawer } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';
import { api } from '../../services/api';
import { useGuardianPresence } from '../../src/hooks/useGuardianPresence';

export const ProDashboard: React.FC<{ 
    user: Professional, 
    setView: (v: ViewState) => void, 
    updateUser: (u: User) => void,
    data?: any
}> = ({ user, setView, updateUser, data }) => {
    const { go, notify } = useGuardiaoFlow();
    const [activeTab, setActiveTab] = useState<'consultorio' | 'financeiro' | 'comunidade'>('consultorio');
    const [showNotifications, setShowNotifications] = useState(false);
    const { status, toggleStatus, isOnline } = useGuardianPresence(user);
    
    // Mock Notifications
    const [notifications, setNotifications] = useState([
        { id: '1', title: 'Início de Ritual', message: 'Ana Silva completou o ritual diário.', type: 'ritual', read: false },
        { id: '2', title: 'Proposta de Troca', message: 'Nova oferta no Escambo Rede Viva.', type: 'alert', read: false },
    ]);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
    <div className="flex flex-col animate-in fade-in w-full bg-[#fcfdfc] min-h-screen pb-32">
        {/* PRESENCE BANNER */}
        <div className={`w-full px-6 py-3 flex items-center justify-between transition-colors ${isOnline ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-slate-50 border-b border-slate-100'}`}>
             <div className="flex items-center gap-2">
                 <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                 <span className={`text-[10px] font-bold uppercase tracking-widest ${isOnline ? 'text-emerald-700' : 'text-slate-500'}`}>
                     {isOnline ? 'Sua Luz brilha no Mapa' : 'Sua frequência está oculta'}
                 </span>
             </div>
             <button 
                onClick={toggleStatus}
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${isOnline ? 'bg-white text-emerald-600 border border-emerald-200 shadow-sm hover:bg-emerald-50' : 'bg-nature-900 text-white shadow-md hover:bg-black'}`}
             >
                 {isOnline ? 'Recolher Presença' : 'Irradiar Presença'}
             </button>
        </div>

        <NotificationDrawer 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                notifications={notifications as any} 
                onMarkAsRead={handleMarkAsRead} 
                onMarkAllRead={handleMarkAllRead} 
        />
        <header className="flex items-center justify-between mt-4 mb-6 px-6 flex-none relative overflow-hidden">
            <div className="flex items-center gap-4">
                <button onClick={() => go('SETTINGS')} className="relative group">
                    <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-xl group-hover:scale-105 transition-transform" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center z-20 pointer-events-none shadow-md animate-pulse"><Zap size={10} className="text-white fill-white" /></div>
                </button>
                <div>
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em] mb-0.5">Luz no Caminho,</p>
                    <h2 className="text-2xl font-serif italic text-nature-900 leading-none">Guardião {user.name.split(' ')[0]}</h2>
            </div>
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={() => go('CHAT_LIST')} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all outline-none"><MessageCircle size={20}/></button>
                 <button onClick={() => setShowNotifications(true)} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all outline-none relative">
                     <Bell size={20}/>
                     {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
                 </button>
                 <button onClick={() => go('AGENDA_VIEW')} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all outline-none"><Calendar size={20}/></button>
            </div>
        </header>

        {/* MENSAGEM DE SESSÃO IMINENTE */}
        <div className="px-6 mb-6 animate-in slide-in-from-top-2 duration-500">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 rounded-3xl text-white shadow-lg flex items-center justify-between group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Video size={20} className="text-white animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Conexão Próxima • 14:00</p>
                        <h4 className="text-sm font-bold">Sintonizando com {user.name.split(' ')[0]}</h4>
                    </div>
                </div>
                <button 
                    onClick={() => go('VIDEO_PREP')} 
                    className="bg-white text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md active:scale-95 transition-all relative z-10"
                >
                    Entrar agora
                </button>
            </div>
        </div>

        {/* DAILY ENGAGEMENT TRACKER */}
        <div className="px-6 mb-6">
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-500 rounded-[2.5rem] p-5 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                <Target size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-100">Metas do Dia</p>
                                <h4 className="text-sm font-bold">Engajamento Guardião</h4>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                            <Flame size={14} className="text-amber-200" />
                            <span className="text-[10px] font-bold">{user.streak || 0} dias</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Atender', done: 2, total: 3, icon: Stethoscope },
                            { label: 'Registrar', done: 1, total: 2, icon: Flower },
                            { label: 'Conectar', done: 0, total: 1, icon: MessageCircle },
                        ].map((goal, i) => (
                            <div key={i} className={`bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center ${goal.done >= goal.total ? 'ring-2 ring-white/40' : ''}`}>
                                <goal.icon size={16} className="mx-auto mb-1.5 text-white/80" />
                                <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">{goal.label}</p>
                                <p className="text-sm font-black mt-0.5">
                                    {goal.done >= goal.total ? <CheckCircle2 size={16} className="mx-auto text-white" /> : `${goal.done}/${goal.total}`}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.round((3/6)*100)}%` }}></div>
                    </div>
                </div>
            </div>
        </div>

        {/* TABS DE NAVEGAÇÃO SUPERIOR */}
        <div className="px-6 mb-6">
            <div className="flex p-1 bg-nature-50 rounded-2xl">
                <button 
                    onClick={() => setActiveTab('consultorio')} 
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'consultorio' ? 'bg-white shadow-sm text-nature-900 font-black' : 'text-nature-400 hover:text-nature-600'}`}
                >
                    <Stethoscope size={14}/> Portal de Cura
                </button>
                <button 
                    onClick={() => setActiveTab('financeiro')} 
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'financeiro' ? 'bg-white shadow-sm text-nature-900 font-black' : 'text-nature-400 hover:text-nature-600'}`}
                >
                    <Wallet size={14}/> Prosperidade
                </button>
                <button 
                    onClick={() => setActiveTab('comunidade')} 
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'comunidade' ? 'bg-white shadow-sm text-nature-900 font-black' : 'text-nature-400 hover:text-nature-600'}`}
                >
                    <Zap size={14}/> Egrégora
                </button>
            </div>
        </div>

        <div className="px-4 space-y-8 min-h-[50vh]">
            
            {/* GAMIFICATION STRIP - Desafios Diários do Guardião */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 rounded-[2.5rem] p-5 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                <Target size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-100">Desafio do Guardião</p>
                                <h4 className="text-sm font-bold">Meta Semanal de Cura</h4>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1.5">
                                <Flame size={16} className="text-amber-200" />
                                <span className="text-lg font-black">{user.streak || 0}</span>
                            </div>
                            <span className="text-[9px] font-bold text-amber-100 uppercase">dias</span>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                        {[
                            { label: '3 Sessões', done: true },
                            { label: '1 Evolução', done: true },
                            { label: '1 Escambo', done: false },
                            { label: '5 Registros', done: false },
                        ].map((task, i) => (
                            <div key={i} className={`flex-1 text-center py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${task.done ? 'bg-white/30 text-white' : 'bg-white/10 text-white/50'}`}>
                                {task.done && <CheckCircle2 size={10} className="inline mr-1" />}
                                {task.label}
                            </div>
                        ))}
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: '50%' }}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] font-bold text-amber-100 uppercase tracking-widest">
                        <span>2/4 Concluídos</span>
                        <span>+75 Karma ao completar</span>
                    </div>
                </div>
            </div>

            {/* VIEW: CONSULTÓRIO */}
            {activeTab === 'consultorio' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    <div id="hero-agenda" className="relative h-72 rounded-[3.5rem] overflow-hidden shadow-xl group cursor-pointer" onClick={() => go('AGENDA_VIEW')}>
                        <img src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=800" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-110" />
                        <div className="absolute inset-0 bg-nature-900/60 transition-colors group-hover:bg-nature-900/40"></div>
                        <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 bg-emerald-500 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit animate-pulse">Hoje • 14:00</div>
                                <h3 className="text-3xl font-serif italic leading-none">Minha Agenda</h3>
                                <p className="text-[10px] text-primary-200 font-bold uppercase tracking-[0.2em] opacity-80">3 Sessões programadas</p>
                            </div>
                        </div>
                        <div className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                            <Calendar size={20} className="text-white"/>
                        </div>
                    </div>

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
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md"><Wallet size={20}/></div>
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
                        <PortalCard id="portal-finance-overview" title="Resumo Mensal" subtitle="FINANÇAS" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1565514020175-8501da23d5a3?q=80&w=600" onClick={() => go('FINANCIAL_DASHBOARD')} />
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
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md"><Zap size={20}/></div>
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
                        <PortalCard id="portal-jobs" title="Chamados" subtitle="VAGAS" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=600" onClick={() => go('VAGAS_LIST')} />
                    </div>

                    <div className="bg-emerald-50 rounded-[2.5rem] p-6 text-emerald-900 border border-emerald-100 flex items-center justify-between cursor-pointer active:scale-95 transition-all" onClick={async () => {
                        const updatedUser = { ...user, karma: (user.karma || 0) + 50 };
                        updateUser(updatedUser); 
                        await api.users.update(updatedUser); 
                        notify("Bênção Global Ativada", "Você enviou luz para todos os buscadores.", "success");
                    }}>
                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-emerald-100/50 rounded-2xl flex items-center justify-center text-emerald-600"><Sparkles size={20}/></div>
                             <div>
                                 <h4 className="text-sm font-bold">Abençoar Rede</h4>
                                 <p className="text-[9px] uppercase tracking-wider opacity-70">Doe 50 Karma</p>
                             </div>
                        </div>
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"><Plus size={14}/></div>
                    </div>

                    {/* LEADERBOARD - Ranking dos Guardiões */}
                    <div className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-nature-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Trophy size={20} className="text-amber-500" />
                                    <h4 className="font-bold text-nature-900">Ranking da Egrégora</h4>
                                </div>
                                <span className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Semanal</span>
                            </div>
                        </div>
                        <div className="divide-y divide-nature-50">
                            {[
                                { rank: 1, name: 'Dra. Marina', karma: 320, avatar: 'M', color: 'bg-amber-100 text-amber-700 ring-amber-300' },
                                { rank: 2, name: user.name, karma: user.karma || 180, avatar: user.name.charAt(0), color: 'bg-emerald-100 text-emerald-700 ring-emerald-300' },
                                { rank: 3, name: 'Dr. Rafael', karma: 150, avatar: 'R', color: 'bg-indigo-100 text-indigo-700 ring-indigo-300' },
                                { rank: 4, name: 'Terapeuta Ana', karma: 120, avatar: 'A', color: 'bg-rose-50 text-rose-600 ring-rose-200' },
                            ].map((g) => (
                                <div key={g.rank} className={`flex items-center gap-4 px-6 py-4 ${g.name === user.name ? 'bg-emerald-50/50' : ''}`}>
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${g.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-nature-50 text-nature-400'}`}>
                                        {g.rank <= 3 ? ['🥇','🥈','🥉'][g.rank-1] : g.rank}
                                    </span>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-2 ${g.color}`}>
                                        {g.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-bold text-nature-900 text-sm">{g.name}</h5>
                                        <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">{g.karma} Karma</p>
                                    </div>
                                    {g.name === user.name && (
                                        <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-1 rounded-lg uppercase">Você</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
    );
};
