
import React, { useState } from 'react';
import { ViewState, User, DailyRitualSnap } from '../../types';
import { Sparkles, Leaf, Sunrise, Users, Compass, ShoppingBag, CheckCircle2, Zap, Droplets } from 'lucide-react';
import { DynamicAvatar, PortalCard, ZenToast, BottomSheet, CameraWidget, DailyBlessing } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { api } from '../../services/api';

export const ClientDashboard: React.FC<{ user: User, setView: (v: ViewState) => void, updateUser: (u: User) => void }> = ({ user, setView, updateUser }) => {
    const { go } = useBuscadorFlow();
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);
    const [activeModal, setActiveModal] = useState<'camera' | 'invite' | 'leaderboard' | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");

    const handleWaterPlant = async () => {
        const newXp = (user.plantXp || 0) + 10;
        let newStage = user.plantStage;
        if (newXp > 100 && user.plantStage === 'seed') newStage = 'sprout';
        const updated = { ...user, plantXp: newXp, plantStage: newStage };
        const res = await api.users.update(updated as User);
        updateUser(res);
        setToast({ title: "Essência Nutrida", message: "+10 XP de Vida. Seu jardim floresce." });
    };

    const handleDailyCheckIn = async () => {
          const res = await api.users.checkIn(user.id);
          if (res && res.user) {
              updateUser(res.user as User);
              setToast({ title: "Sincronizado", message: `+${res.reward} Karma recebido.` });
          }
    };
    
    // We keep modal handlers internal or assume they are handled by context? 
    // For now internal.
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

        <BottomSheet isOpen={activeModal === 'leaderboard'} onClose={() => setActiveModal(null)} title="Classificação Radiante">
             <div className="space-y-6 pb-12">
                 <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="text-2xl font-black text-indigo-200">#42</div>
                        <DynamicAvatar user={user} size="md" />
                        <div>
                            <h4 className="font-bold text-nature-900 text-sm">Você</h4>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase">{user.plantStage} • Nível {Math.floor((user.plantXp || 0) / 20) + 1}</p>
                        </div>
                     </div>
                     <div className="text-right">
                         <span className="block text-xl font-black text-nature-900">{user.karma}</span>
                         <span className="text-[9px] font-bold text-nature-400 uppercase">Karma</span>
                     </div>
                 </div>
             </div>
        </BottomSheet>

        <DailyBlessing user={user} onCheckIn={handleDailyCheckIn} />
        
        <header className="flex items-center justify-between mt-8 mb-6 px-6 flex-none">
            <div className="flex items-center gap-4">
                <div className="relative group" onClick={() => setView(ViewState.SETTINGS)}>
                    <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-xl relative z-10 cursor-pointer group-hover:scale-105 transition-transform" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center z-20 pointer-events-none shadow-md animate-pulse"><Zap size={10} className="text-white fill-white" /></div>
                </div>
                <div><p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">Boa Jornada,</p><h2 className="text-2xl font-serif italic text-nature-900 leading-none mt-1">{user.name.split(' ')[0]}</h2></div>
            </div>
            <div className="px-5 py-2.5 bg-white rounded-2xl shadow-sm flex items-center gap-2 border border-nature-100 animate-in slide-in-from-top"><Sparkles size={16} className="text-amber-400" /><span className="text-sm font-bold text-nature-900">{user.karma}</span></div>
        </header>

        <div className="px-4 space-y-8">
            {/* JARDIM INTERNO CARD */}
            <div className="relative rounded-[3.5rem] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => handleWaterPlant()}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10"></div>
                <img src="https://images.unsplash.com/photo-1592323287019-2169b1834225?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="relative z-20 p-8 h-64 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="bg-white/20 backdrop-blur-md border border-white/30 p-3 rounded-2xl text-white">
                            <Leaf size={24} />
                        </div>
                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">Nível {Math.floor((user.plantXp || 0) / 20) + 1}</span>
                    </div>
                    <div>
                         <h3 className="text-3xl font-serif italic text-white mb-2 drop-shadow-md">Jardim Interno</h3>
                         <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                            <div className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-1000" style={{ width: `${(user.plantXp || 0) % 100}%` }}></div>
                         </div>
                         <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest mt-3 flex items-center gap-2"><Droplets size={12}/> {user.plantStage} • Toque para Nutrir</p>
                    </div>
                </div>
            </div>

            {/* GRID PRINCIPAL */}
            <div className="grid grid-cols-2 gap-4">
                <PortalCard 
                    title="Metamorfose" 
                    subtitle="DIÁRIO" 
                    icon={Sunrise} 
                    bgImage="https://images.unsplash.com/photo-1470252649378-b736a029c69d?q=80&w=600" 
                    onClick={() => go('METAMORPHOSIS_CHECKIN')} 
                />
                <PortalCard 
                    title="Minha Tribo" 
                    subtitle="COMUNIDADE" 
                    icon={Users} 
                    bgImage="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=600" 
                    onClick={() => go('TRIBE_DASH')} 
                    delay={100}
                />
                <PortalCard 
                    title="Mapa da Cura" 
                    subtitle="EXPLORAR" 
                    icon={Compass} 
                    bgImage="https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=600" 
                    onClick={() => go('BOOKING_SEARCH')} 
                    delay={200}
                />
                <PortalCard 
                    title="Bazar" 
                    subtitle="FARMÁCIA" 
                    icon={ShoppingBag} 
                    bgImage="https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=600" 
                    onClick={() => go('BOOKING_SEARCH')} 
                    delay={300} 
                />
                <PortalCard 
                    title="Oráculo" 
                    subtitle="MENSAGEM" 
                    icon={Sparkles} 
                    bgImage="https://images.unsplash.com/photo-1506318137071-a8bcbf675bfa?q=80&w=600" 
                    onClick={() => go('ORACLE_PORTAL')} 
                    delay={400} 
                />
                <PortalCard 
                    title="Rituais" 
                    subtitle="HÁBITOS" 
                    icon={CheckCircle2} 
                    bgImage="https://images.unsplash.com/photo-1518609878319-a16322081109?q=80&w=600" 
                    onClick={() => go('METAMORPHOSIS_RITUAL')} // Mapping ritual builder
                    delay={500} 
                />
            </div>
        </div>
    </div>
  );
};
