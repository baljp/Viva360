import React, { useState, useCallback } from 'react';
import { ViewState, User, DailyRitualSnap } from '../../types';
import { Zap, History, Sparkles, Compass, ShoppingBag, Droplet, Heart, Leaf, Sunrise, Users, CheckCircle2, Wallet, Bell, MessageCircle, TrendingUp, Book } from 'lucide-react';
import { DynamicAvatar, PortalCard, RitualCompletionCard, BottomSheet, CameraWidget, DailyBlessing, NotificationDrawer } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/useBuscadorFlow';
import { gardenService } from '../../services/gardenService';
import { useClientDashboard } from '../../src/hooks/useClientDashboard';
import { useCountUp } from '../../src/hooks/useCountUp';

export const ClientDashboard: React.FC<{
    user: User,
    setView: (v: ViewState) => void,
    updateUser: (u: User) => void,
    data?: unknown
}> = React.memo(({ user, setView, updateUser, data }) => {
    const { state, actions } = useClientDashboard(user, updateUser, setView);
    const { go } = actions;
    const animatedKarma = useCountUp(user.karma || 0);
    const animatedStreak = useCountUp(user.streak || 0, 700);
    // Destructure state for easier access in JSX
    const { ritualToast, activeModal, showNotifications, notifications, notificationsReadIssue, gardenStatus, plantVisuals } = state;

    // Feature: Karma Synchronization Visual Feedback
    React.useEffect(() => {
        // Simple animation trigger or toast when karma changes significantly
        // This ensures the user feels the update even if the UI refresh is subtle
        if (user.karma > 0) {
            // Karma sync completed
        }
    }, [user.karma]);

    return (
        <div className="flex flex-col animate-in fade-in w-full bg-[#f8faf9] min-h-screen pb-24">
            {ritualToast && (
                <RitualCompletionCard
                    isOpen={!!ritualToast}
                    onClose={() => actions.setRitualToast(null)}
                    title={ritualToast.title}
                    message={ritualToast.message}
                    mood={user.lastMood || 'SERENO'}
                />
            )}
            <NotificationDrawer
                isOpen={showNotifications}
                onClose={() => actions.setShowNotifications(false)}
                notifications={notifications}
                readIssue={notificationsReadIssue}
                onRetryNotifications={actions.loadNotifications}
                onMarkAsRead={actions.handleMarkAsRead}
                onMarkAllRead={actions.handleMarkAllRead}
            />

            {/* MODAIS */}
            <BottomSheet isOpen={activeModal === 'camera'} onClose={() => actions.setActiveModal(null)} title="Novo Rito de Passagem">
                <div className="h-[60vh] -mx-4">
                    <CameraWidget onCapture={actions.handleCapture} />
                </div>
            </BottomSheet>

            {/* Invite flow is handled by TRIBE_INVITE screen */}

            <DailyBlessing user={user} onCheckIn={actions.handleDailyCheckIn} />

            <header className="flex items-center justify-between mt-8 mb-6 px-6 flex-none relative overflow-hidden">

                <div className="flex items-center gap-4">
                    <div className="relative group" onClick={() => go('SETTINGS')}>
                        <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-xl relative z-10 cursor-pointer group-hover:scale-105 transition-transform" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center z-20 pointer-events-none shadow-md animate-pulse"><Zap size={10} className="text-white fill-white" /></div>
                    </div>
                    <div><p className="text-[10px] font-bold text-nature-700 uppercase tracking-[0.3em]">Sua Jornada até aqui,</p><h2 className="text-2xl font-serif italic text-nature-900 leading-none mt-1 max-w-[140px] truncate">{user.name.split(' ')[0]}</h2></div>
                </div>
                <div className="flex items-center gap-3">
                    <button aria-label="Abrir conversas da tribo" onClick={() => go('CHAT_LIST')} className="p-2.5 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all"><MessageCircle size={20} /></button>
                    <button aria-label="Abrir notificações" onClick={() => actions.setShowNotifications(true)} className="p-2.5 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all relative">
                        <Bell size={20} />
                        {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
                    </button>
                    <div role="button" tabIndex={0} aria-label="Abrir carteira de karma" onClick={() => go('KARMA_WALLET')} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go('KARMA_WALLET'))} className="px-4 py-2 bg-white rounded-2xl shadow-sm flex items-center gap-2 border border-nature-100 cursor-pointer hover:bg-nature-50 transition-colors"><Sparkles size={16} className="text-amber-400" /><span className="text-xs font-bold text-nature-900">{animatedKarma}</span></div>
                </div>
            </header>

            <div className="px-4 pb-8 space-y-8">
                {/* JARDIM INTERNO HERO CARD - Refined & Cinematic */}
                <button
                    type="button"
                    id="hero-garden"
                    aria-label="Abrir jardim interno"
                    className="relative rounded-[3.5rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.25)] group cursor-pointer border border-white/10 w-full text-left"
                    onClick={() => go('GARDEN_VIEW')}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:opacity-70 z-10"></div>
                    <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[15000ms] group-hover:scale-110" alt="" />
                    <div className="relative z-20 p-8 h-72 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="bg-white/15 backdrop-blur-xl border border-white/20 p-3 rounded-2xl text-white shadow-inner group-hover:bg-white/25 transition-colors">
                                <Leaf size={24} className="drop-shadow-lg" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="px-4 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em] border border-emerald-400/30 shadow-lg">Vitalidade: {gardenStatus.health}%</span>
                                <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-bold text-white/70 uppercase tracking-widest border border-white/10">{gardenStatus.status}</div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">Núcleo da Vida</p>
                                    <h3 className="text-4xl font-serif italic text-white drop-shadow-2xl">Semente da Essência</h3>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        actions.handleWaterPlant();
                                    }}
                                    className="p-4 bg-white text-nature-900 rounded-[1.5rem] border border-white/30 hover:bg-emerald-50 active:scale-90 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 group/btn"
                                >
                                    <Droplet size={20} className="text-emerald-600 group-hover/btn:animate-bounce" />
                                    <span className="text-[10px] uppercase font-black tracking-widest">Nutrir</span>
                                </button>
                            </div>
                            <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm p-[2px] border border-white/10">
                                <div className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)] ${gardenStatus.health < 30 ? 'bg-gradient-to-r from-rose-400 to-rose-600' : 'bg-gradient-to-r from-emerald-300 to-white'}`} style={{ width: `${gardenStatus.health}%` }}></div>
                            </div>
                        </div>
                    </div>
                </button>

                {/* SESSÃO 1: RITUAIS DE PODER */}
                <div className="space-y-4">
                    <h4 className="px-2 text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} /> Sincronicidade
                    </h4>

                    {/* ORACLE HERO WIDGET */}
                    <div
                        id="portal-oracle"
                        role="button"
                        tabIndex={0}
                        aria-label="Revelar Mensagem do Oráculo"
                        onClick={() => go('ORACLE_PORTAL')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                go('ORACLE_PORTAL');
                            }
                        }}
                        className="bg-gradient-to-br from-indigo-900 via-purple-900 to-nature-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden group cursor-pointer mb-4"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-indigo-500/30 transition-all duration-700"></div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-20 h-24 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform">
                                <Sparkles size={24} className="text-indigo-300" />
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Carta do Dia</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-indigo-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-indigo-400/30">Energia Ativa</span>
                                    <span className="text-[9px] opacity-60">Sincronicidade detectada</span>
                                </div>
                                <h3 className="font-serif italic text-2xl leading-tight mb-1">Revelar Mensagem</h3>
                                <p className="text-xs text-indigo-100/70 line-clamp-2">O universo tem uma resposta baseada na sua energia de hoje.</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-indigo-900 transition-all">
                                <div className="w-0 h-0 border-l-[6px] border-l-current border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* MISSÕES DIÁRIAS - Gamification CTA */}
                <button
                    type="button"
                    aria-label="Abrir missões do dia"
                    onClick={() => go('CLIENT_QUESTS')}
                    className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 rounded-[2.5rem] p-5 text-white shadow-xl relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all w-full text-left"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-white/20 transition-all"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={28} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">Missões do Dia</p>
                            <h4 className="text-lg font-serif italic mt-0.5">Conquiste seu Karma</h4>
                        </div>
                        <div className="text-right">
                            <span className="block text-2xl font-black">{animatedStreak}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-100">dias</span>
                        </div>
                    </div>
                </button>

                {/* LOGICAL GROUPING: EVOLUÇÃO DA ALMA HUB */}
                <div className="bg-white rounded-[3rem] p-6 border border-nature-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <TrendingUp size={20} />
                            </div>
                            <h4 className="text-lg font-serif italic text-nature-900">Evolução da Alma</h4>
                        </div>
                        <div className="px-3 py-1.5 bg-nature-50 rounded-full border border-nature-100">
                            <span className="text-[9px] font-black text-nature-400 uppercase tracking-widest">Ciclo Atual</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div onClick={() => go('METAMORPHOSIS_CHECKIN')} className="bg-nature-25 p-5 rounded-[2.5rem] border border-nature-50 shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-center h-40 cursor-pointer hover:shadow-md group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-nature-600 shadow-sm group-hover:scale-110 transition-transform"><Zap size={24} /></div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-nature-900 tracking-wider">Novo Registro</span>
                                <p className="text-[8px] text-nature-400 uppercase font-bold mt-1">Check-in Vital</p>
                            </div>
                        </div>
                        <div onClick={() => go('EVOLUTION_TIMELAPSE')} className="bg-nature-25 p-5 rounded-[2.5rem] border border-nature-50 shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-center h-40 cursor-pointer hover:shadow-md group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform"><Compass size={24} /></div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-nature-900 tracking-wider">Time Lapse</span>
                                <p className="text-[8px] text-nature-400 uppercase font-bold mt-1">Linha do Tempo</p>
                            </div>
                        </div>
                        <div onClick={() => go('CLIENT_JOURNAL')} className="bg-nature-25 p-5 rounded-[2.5rem] border border-nature-50 shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-center h-40 cursor-pointer hover:shadow-md group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 transition-transform"><Book size={24} /></div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-nature-900 tracking-wider">Diário da Alma</span>
                                <p className="text-[8px] text-nature-400 uppercase font-bold mt-1">Registros Íntimos</p>
                            </div>
                        </div>
                        <div onClick={() => go('EVOLUTION')} className="bg-nature-25 p-5 rounded-[2.5rem] border border-nature-50 shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-center h-40 cursor-pointer hover:shadow-md group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-110 transition-transform"><Sparkles size={24} /></div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-nature-900 tracking-wider">Metamorfose</span>
                                <p className="text-[8px] text-nature-400 uppercase font-bold mt-1">Ver Minha Evolução</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SESSÃO 2: CONEXÕES ÁLMICAS */}
                <div className="space-y-4">
                    <h4 className="px-2 text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} /> Conexões Álmicas
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <PortalCard
                            id="portal-tribe"
                            title="Minha Tribo"
                            subtitle="COMUNIDADE"
                            icon={Users}
                            bgImage="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=600"
                            onClick={() => go('TRIBE_DASH')}
                            delay={300}
                        />
                        <PortalCard
                            id="portal-map"
                            title="Mapa da Cura"
                            subtitle="EXPLORAR"
                            icon={Compass}
                            bgImage="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=600"
                            onClick={() => go('BOOKING_SEARCH')}
                            delay={350}
                        />
                    </div>
                </div>

                {/* SESSÃO 3: RECURSOS */}
                <div className="space-y-4">
                    <h4 className="px-2 text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2">
                        <ShoppingBag size={14} /> Recursos
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <PortalCard
                            id="portal-abundance"
                            title="Abundância"
                            subtitle="CICLOS DE TROCA"
                            icon={Wallet}
                            bgImage="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600"
                            onClick={() => go('PAYMENT_HISTORY')}
                            delay={400}
                        />
                        <PortalCard
                            id="portal-marketplace"
                            title="Santuário de Ofertas"
                            subtitle="RECURSOS DE CURA"
                            icon={ShoppingBag}
                            bgImage="https://images.unsplash.com/photo-1601314167099-232775b3d6fd?q=80&w=800"
                            onClick={() => go('MARKETPLACE')}
                            delay={450}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});
