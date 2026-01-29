import React, { useState, useCallback } from 'react';
import { ViewState, User, DailyRitualSnap } from '../../types';
import { Zap, History, Sparkles, Compass, ShoppingBag, Droplet, Heart, Leaf, Sunrise, Users, CheckCircle2, Wallet, Bell, MessageCircle, TrendingUp } from 'lucide-react';
import { DynamicAvatar, PortalCard, ZenToast, BottomSheet, CameraWidget, DailyBlessing, NotificationDrawer } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { api } from '../../services/api';
import { gardenService } from '../../services/gardenService';

export const ClientDashboard: React.FC<{ 
    user: User, 
    setView: (v: ViewState) => void, 
    updateUser: (u: User) => void,
    data?: any 
}> = React.memo(({ user, setView, updateUser, data }) => {
    const { go } = useBuscadorFlow();
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);
    const [activeModal, setActiveModal] = useState<'camera' | 'invite' | 'leaderboard' | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);

    // Mock Notifications
    const [notifications, setNotifications] = useState([
        { id: '1', title: 'Hora do Ritual', message: 'O sol nasceu. Hora de despertar.', type: 'ritual', read: false },
        { id: '2', title: 'Pagamento Recebido', message: 'Sua sessão com Dr. Pedro foi confirmada.', type: 'finance', read: true },
    ]);

    const handleMarkAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const gardenStatus = gardenService.getPlantStatus(user);
    const plantVisuals = gardenService.getPlantVisuals(user.plantStage || 'seed', gardenStatus.status);

    const handleWaterPlant = useCallback(async () => {
        try {
            const reward = gardenService.calculateWateringReward(user);
            const updated = { 
                ...user, 
                lastWateredAt: new Date().toISOString(),
                plantXp: (user.plantXp || 0) + reward.xp,
                plantHealth: Math.min(100, (user.plantHealth || 0) + 10)
            };
            
            updateUser(updated);
            setToast({ title: "Essência Nutrida", message: `+${reward.xp} PX. Seu jardim floresce.` });
            await api.users.update(updated as User);
        } catch (e) {
            console.error("Water Plant Error", e);
            setToast({ title: "Erro na conexão", message: "Sua intenção foi registrada no éter." });
        }
    }, [user, updateUser]);

    const handleDailyCheckIn = useCallback(async (reward: number) => {
          const res = await api.users.checkIn(user.id, reward);
          if (res && res.user) {
              updateUser(res.user as User);
              setToast({ title: "Sincronizado", message: `+${res.reward} Karma recebido.` });
          }
    }, [user, updateUser]);

    const handleCapture = useCallback(async (image: string) => {
          const newSnap: DailyRitualSnap = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              image,
              mood: 'SERENO', 
              note: 'Registro de Metamorfose'
          };
          const updatedUser = { ...user, snaps: [newSnap, ...(user.snaps || [])] };
          const res = await api.users.update(updatedUser);
          updateUser(res);
          setActiveModal(null);
          setToast({ title: "Registro Salvo", message: "Sua memória foi cristalizada." });
    }, [user, updateUser]);

    const handleInvite = useCallback(() => {
        if (!inviteEmail) return;
        setToast({ title: "Convite Enviado", message: `Chamado enviado para ${inviteEmail}` });
        setInviteEmail("");
        setActiveModal(null);
    }, [inviteEmail]);

    return (
        <div className="flex flex-col animate-in fade-in w-full bg-[#f8faf9] min-h-screen pb-24">
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            <NotificationDrawer 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                notifications={notifications as any} 
                onMarkAsRead={handleMarkAsRead} 
                onMarkAllRead={() => {}} 
            />
            
            {/* MODAIS */}
            <BottomSheet isOpen={activeModal === 'camera'} onClose={() => setActiveModal(null)} title="Novo Registro">
                 <div className="h-[60vh] -mx-4">
                     <CameraWidget onCapture={handleCapture} />
                 </div>
            </BottomSheet>

            <BottomSheet isOpen={activeModal === 'invite'} onClose={() => setActiveModal(null)} title="Convidar para Tribo">
                 <div className="space-y-6 pb-20">
                     <div className="text-center space-y-4">
                         <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500"><Users size={40}/></div>
                         <p className="text-sm text-nature-600">Convide uma alma afim para caminhar junto. <br/>Vocês compartilharão Karma e evolução.</p>
                     </div>
                     <div className="space-y-2">
                         <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">E-mail do Convidado</label>
                         <input 
                            value={inviteEmail} 
                            onChange={e => setInviteEmail(e.target.value)} 
                            placeholder="nome@email.com" 
                            className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                         />
                     </div>
                     <button onClick={handleInvite} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Enviar Chamado</button>
                 </div>
            </BottomSheet>

            <DailyBlessing user={user} onCheckIn={handleDailyCheckIn} />
            
            <header className="flex items-center justify-between mt-8 mb-6 px-6 flex-none relative overflow-hidden">

                <div className="flex items-center gap-4">
                    <div className="relative group" onClick={() => go('SETTINGS')}>
                        <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-xl relative z-10 cursor-pointer group-hover:scale-105 transition-transform" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center z-20 pointer-events-none shadow-md animate-pulse"><Zap size={10} className="text-white fill-white" /></div>
                    </div>
                    <div><p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">Boa Jornada,</p><h2 className="text-2xl font-serif italic text-nature-900 leading-none mt-1">{user.name.split(' ')[0]}</h2></div>
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={() => go('CHAT_LIST')} className="p-2.5 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all"><MessageCircle size={20}/></button>
                     <button onClick={() => setShowNotifications(true)} className="p-2.5 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all relative">
                         <Bell size={20}/>
                         {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
                     </button>
                     <div onClick={() => go('KARMA_WALLET')} className="px-4 py-2 bg-white rounded-2xl shadow-sm flex items-center gap-2 border border-nature-100 cursor-pointer hover:bg-nature-50 transition-colors"><Sparkles size={16} className="text-amber-400" /><span className="text-xs font-bold text-nature-900">{user.karma}</span></div>
                </div>
            </header>

            <div className="px-4 pb-8 space-y-8">
                {/* JARDIM INTERNO HERO CARD */}
                <div id="hero-garden" className="relative rounded-[3.5rem] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => go('GARDEN_VIEW')}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10"></div>
                    <img src="https://images.unsplash.com/photo-1518173946687-a4c8892415f4?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="relative z-20 p-8 h-64 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="bg-white/20 backdrop-blur-md border border-white/30 p-3 rounded-2xl text-white">
                                <Leaf size={24} />
                            </div>
                            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">Saúde: {gardenStatus.health}%</span>
                        </div>
                        <div>
                             <h3 className="text-3xl font-serif italic text-white mb-2 drop-shadow-md">Semente da Essência</h3>
                             <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                                <div className={`h-full transition-all duration-1000 ${gardenStatus.health < 30 ? 'bg-rose-400' : 'bg-white'}`} style={{ width: `${gardenStatus.health}%` }}></div>
                             </div>
                             <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest mt-3 flex items-center gap-2">
                                 {plantVisuals.icon} {plantVisuals.label} • {gardenStatus.status.toUpperCase()}
                             </p>
                        </div>
                    </div>
                </div>

                {/* SESSÃO 1: RITUAIS DE PODER */}
                <div className="space-y-4">
                    <h4 className="px-2 text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14}/> Sincronicidade
                    </h4>
                    
                    {/* ORACLE HERO WIDGET */}
                    <div onClick={() => go('ORACLE_PORTAL')} className="bg-gradient-to-br from-indigo-900 via-purple-900 to-nature-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden group cursor-pointer mb-4">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-indigo-500/30 transition-all duration-700"></div>
                         <div className="relative z-10 flex items-center gap-6">
                              <div className="w-20 h-24 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform">
                                  <Sparkles size={24} className="text-indigo-300" />
                                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">Carta do Dia</span>
                              </div>
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                      <span className="px-2 py-0.5 bg-indigo-500/30 rounded-lg text-[8px] font-bold uppercase tracking-wider border border-indigo-400/30">Energia Ativa</span>
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

                    <div className="grid grid-cols-2 gap-3">
                            <PortalCard 
                                id="portal-rituals"
                                title="Rituais" 
                                subtitle="PRÁTICAS" 
                                icon={CheckCircle2} 
                                bgImage="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600" 
                                onClick={() => go('METAMORPHOSIS_RITUAL')}
                                delay={200} 
                            />
                    </div>
                </div>

                {/* SESSÃO NOVA: JORNADA & EVOLUÇÃO (Moved from Garden) */}
                <div className="space-y-4">
                    <h4 className="px-2 text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2">
                        <History size={14}/> Jornada & Evolução
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                         <div onClick={() => setActiveModal('camera')} className="bg-white p-4 rounded-[2rem] border border-nature-100 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all text-center h-32">
                             <div className="w-10 h-10 bg-nature-50 rounded-xl flex items-center justify-center text-nature-600 mb-1"><Zap size={20}/></div>
                             <span className="text-[9px] font-bold uppercase text-nature-600 tracking-wider">Novo<br/>Registro</span>
                         </div>
                         <div onClick={() => go('EVOLUTION_HISTORY')} className="bg-white p-4 rounded-[2rem] border border-nature-100 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all text-center h-32">
                             <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-1"><History size={20}/></div>
                             <span className="text-[9px] font-bold uppercase text-nature-600 tracking-wider">Linha do<br/>Tempo</span>
                         </div>
                         <div onClick={() => go('EVOLUTION_TIMELAPSE')} className="bg-white p-4 rounded-[2rem] border border-nature-100 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all text-center h-32">
                             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-1"><TrendingUp size={20}/></div>
                             <span className="text-[9px] font-bold uppercase text-nature-600 tracking-wider">Time<br/>Lapse</span>
                         </div>
                    </div>
                </div>

                {/* SESSÃO 2: CONEXÕES ÁLMICAS */}
                <div className="space-y-4">
                    <h4 className="px-2 text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2">
                        <Users size={14}/> Conexões Álmicas
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
                        <ShoppingBag size={14}/> Recursos
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <PortalCard 
                            id="portal-abundance"
                            title="Abundância" 
                            subtitle="MINHAS TROCAS" 
                            icon={Wallet} 
                            bgImage="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600" 
                            onClick={() => go('PAYMENT_HISTORY')} 
                            delay={400} 
                        />
                         <PortalCard 
                            id="portal-marketplace"
                            title="Bazar Natural" 
                            subtitle="FARMÁCIA DA ALMA" 
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
