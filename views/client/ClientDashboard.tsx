import React, { useState } from 'react';
import { ViewState, User, DailyRitualSnap } from '../../types';
import { Zap, History, Sparkles, Compass, ShoppingBag, Droplet, Heart, Leaf, Sunrise, Users, CheckCircle2 } from 'lucide-react';
import { DynamicAvatar, PortalCard, ZenToast, BottomSheet, CameraWidget, DailyBlessing, Logo } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { api } from '../../services/api';
import { gardenService } from '../../services/gardenService';

export const ClientDashboard: React.FC<{ 
    user: User, 
    setView: (v: ViewState) => void, 
    updateUser: (u: User) => void,
    data?: any 
}> = ({ user, setView, updateUser, data }) => {
    const { go } = useBuscadorFlow();
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);
    const [activeModal, setActiveModal] = useState<'camera' | 'invite' | 'leaderboard' | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");

    const gardenStatus = gardenService.getPlantStatus(user);
    const plantVisuals = gardenService.getPlantVisuals(user.plantStage || 'seed', gardenStatus.status);

    const handleWaterPlant = async () => {
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
    };

    const handleDailyCheckIn = async () => {
          const res = await api.users.checkIn(user.id);
          if (res && res.user) {
              updateUser(res.user as User);
              setToast({ title: "Sincronizado", message: `+${res.reward} Karma recebido.` });
          }
    };

    const handleCapture = async (image: string) => {
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
    };

    const handleInvite = () => {
        if (!inviteEmail) return;
        setToast({ title: "Convite Enviado", message: `Chamado enviado para ${inviteEmail}` });
        setInviteEmail("");
        setActiveModal(null);
    };

    return (
        <div className="flex flex-col animate-in fade-in w-full bg-[#f8faf9] min-h-screen pb-24">
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
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
                <Logo size="xl" className="absolute -top-10 -left-10 opacity-[0.03] rotate-12 pointer-events-none" />
                <div className="flex items-center gap-4">
                    <div className="relative group" onClick={() => go('SETTINGS')}>
                        <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-xl relative z-10 cursor-pointer group-hover:scale-105 transition-transform" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center z-20 pointer-events-none shadow-md animate-pulse"><Zap size={10} className="text-white fill-white" /></div>
                    </div>
                    <div><p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">Boa Jornada,</p><h2 className="text-2xl font-serif italic text-nature-900 leading-none mt-1">{user.name.split(' ')[0]}</h2></div>
                </div>
                <div className="px-5 py-2.5 bg-white rounded-2xl shadow-sm flex items-center gap-2 border border-nature-100 animate-in slide-in-from-top"><Sparkles size={16} className="text-amber-400" /><span className="text-sm font-bold text-nature-900">{user.karma}</span></div>
            </header>

            <div className="px-4 space-y-8">
                {/* JARDIM INTERNO HERO CARD */}
                <div id="hero-garden" className="relative rounded-[3.5rem] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => go('GARDEN_VIEW')}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10"></div>
                    <img src="https://images.unsplash.com/photo-1592323287019-2169b1834225?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
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
                    {gardenStatus.status === 'withered' && (
                        <div className="absolute inset-0 bg-rose-900/40 rounded-[3.5rem] flex items-center justify-center backdrop-blur-[2px]">
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">Precisa de Atenção</span>
                        </div>
                    )}
                </div>

                {/* GRID PRINCIPAL */}
                <div className="grid grid-cols-2 gap-4">
                    <PortalCard 
                        id="portal-metamorphosis"
                        title="Metamorfose" 
                        subtitle="RITUAL DIÁRIO" 
                        icon={Sunrise} 
                        bgImage="https://images.unsplash.com/photo-1470252649378-b736a029c69d?q=80&w=600" 
                        onClick={() => go('METAMORPHOSIS_CHECKIN')} 
                        delay={100}
                    />
                    <PortalCard 
                        id="portal-tribe"
                        title="Minha Tribo" 
                        subtitle="COMUNIDADE" 
                        icon={Users} 
                        bgImage="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=600" 
                        onClick={() => go('TRIBE_DASH')} 
                        delay={100}
                    />
                    <PortalCard 
                        id="portal-map"
                        title="Mapa da Cura" 
                        subtitle="EXPLORAR" 
                        icon={Compass} 
                        bgImage="https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=600" 
                        onClick={() => go('BOOKING_SEARCH')} 
                        delay={200} 
                    />
                    <PortalCard 
                        id="portal-marketplace"
                        title="Bazar" 
                        subtitle="FARMÁCIA" 
                        icon={ShoppingBag} 
                        bgImage="https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=600" 
                        onClick={() => go('MARKETPLACE')} 
                        delay={300} 
                    />
                    <PortalCard 
                        id="portal-oracle"
                        title="Oráculo" 
                        subtitle="MENSAGEM" 
                        icon={Sparkles} 
                        bgImage="https://images.unsplash.com/photo-1506318137071-a8bcbf675bfa?q=80&w=600" 
                        onClick={() => go('ORACLE_PORTAL')} 
                        delay={400} 
                    />
                    <PortalCard 
                        id="portal-rituals"
                        title="Rituais" 
                        subtitle="HÁBITOS" 
                        icon={CheckCircle2} 
                        bgImage="https://images.unsplash.com/photo-1518609878319-a16322081109?q=80&w=600" 
                        onClick={() => go('METAMORPHOSIS_RITUAL')}
                        delay={500} 
                    />
                </div>
            </div>
        </div>
    );
};
