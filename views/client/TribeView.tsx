import React, { useState } from 'react';
import { User } from '../../types';
import { Flame, Plus, Trophy, Heart, Moon } from 'lucide-react';
import { PortalView, BottomSheet, DynamicAvatar } from '../../components/Common';
import { ConstellationOrbit, GlobalMandala } from '../../components/SocialFeatures';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';

export const TribeView: React.FC<{ user: User, updateUser: (u: User) => void, onClose?: () => void }> = ({ user, updateUser, onClose }) => {
    const { go, back, selectTribeRoomContext } = useBuscadorFlow();
    const [activeModal, setActiveModal] = useState<'camera' | 'invite' | 'leaderboard' | null>(null);

    return (
    <PortalView 
        title="Minha Tribo" 
        subtitle="SINCRO-ESTELAR" 
        onBack={back}
        onClose={onClose || back}
    >
      <div className="space-y-10">
        <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm">
           <GlobalMandala user={user} onUpdateUser={updateUser} />
        </div>
        
        <div className="relative">
           <ConstellationOrbit user={user} onUpdateUser={updateUser} onInvite={() => go('TRIBE_INVITE')} />
        </div>

        <div className="space-y-4">
           <div className="flex justify-between items-center px-4">
              <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><Flame size={12} className="text-amber-500"/> Pactos Ativos</h4>
           </div>

            {/* Referral / Invite Tracking - clickable, goes to invite */}
            <div onClick={() => go('TRIBE_INVITE')} className="bg-indigo-50 p-4 rounded-[2rem] border border-indigo-100 flex items-center justify-between mb-4 cursor-pointer active:scale-[0.98] transition-all hover:bg-indigo-100/50">
               <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-indigo-200 rounded-xl flex items-center justify-center shrink-0"><Plus size={18} className="text-indigo-700" /></div>
                  <div className="min-w-0">
                     <h5 className="font-bold text-indigo-900 text-xs truncate">Expandir Tribo</h5>
                     <p className="text-[10px] text-indigo-400 font-bold uppercase mt-0.5 truncate">Convidar nova alma • 3 aceitos</p>
                  </div>
               </div>
               <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center text-[10px]">👩‍🎨</div>
                   <div className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white flex items-center justify-center text-[10px]">🧑‍💻</div>
                   <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-[10px]">🦸‍♀️</div>
               </div>
            </div>

           <div className="bg-white p-6 rounded-[3rem] border border-nature-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all" onClick={() => go('SOUL_PACT')}>
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform"><Flame size={28}/></div>
                 <div>
                    <h5 className="font-bold text-nature-900 text-sm">Pacto de Respiração</h5>
                    <p className="text-[10px] text-nature-400 font-bold uppercase mt-1">Com Lucas Paz • 4/7 Dias</p>
                 </div>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-nature-50" />
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-amber-500" strokeDasharray={150} strokeDashoffset={150 - (150 * 0.57)} />
                 </svg>
                 <span className="absolute text-[10px] font-black text-amber-600">57%</span>
              </div>
           </div>

            {/* Offline Retreat Entry */}
            <div onClick={() => go('OFFLINE_RETREAT')} className="bg-nature-900 rounded-[2.5rem] p-6 text-white flex items-center justify-between cursor-pointer hover:bg-black transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform">
                        <Moon size={24} />
                    </div>
                    <div>
                        <h5 className="text-sm font-bold">Retiro Offline</h5>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Silenciar notificações</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black text-white/60 tracking-widest uppercase">Ativar</div>
            </div>
         </div>

         <div className="bg-indigo-900 rounded-[3.5rem] p-10 text-white text-center space-y-6 relative overflow-hidden">
            <Trophy size={160} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
            <h4 className="font-serif italic text-2xl relative z-10">Jornada Coletiva</h4>
            <div className="flex justify-center -space-x-4 relative z-10">
               {[1,2,3,4,5].map(i => <img key={i} src={`https://api.dicebear.com/7.x/notionists/svg?seed=tribo${i}`} className="w-14 h-14 rounded-full border-4 border-indigo-800 shadow-xl object-cover" />)}
            </div>
            <p className="text-xs text-indigo-200 italic px-4 relative z-10">"Sua tribo elevou a vibração coletiva em 14% este mês. Continuem brilhando."</p>
            <div className="grid grid-cols-1 gap-3 relative z-10 px-4">
                 <button onClick={() => { selectTribeRoomContext({ type: 'healing_circle' }); go('HEALING_CIRCLE'); }} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                     <Heart size={14} fill="currentColor"/> Participar do Círculo de Cura
                 </button>
                 <button onClick={() => { selectTribeRoomContext({ type: 'support_room' }); go('TRIBE_INTERACTION'); }} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                     <Plus size={14} /> Sala de Apoio Coletivo
                 </button>
                 <button onClick={() => setActiveModal('leaderboard')} className="w-full py-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">Ver evolução da tribo</button>
             </div>
         </div>
        
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
      </div>
    </PortalView>
    );
};
