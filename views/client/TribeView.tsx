import React, { useState } from 'react';
import { User } from '../../types';
import { Flame, Plus, Trophy } from 'lucide-react';
import { PortalView, BottomSheet, DynamicAvatar } from '../../components/Common';
import { ConstellationOrbit, GlobalMandala } from '../../components/SocialFeatures';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';

export const TribeView: React.FC<{ user: User, updateUser: (u: User) => void }> = ({ user, updateUser }) => {
    const { go } = useBuscadorFlow();
    const [activeModal, setActiveModal] = useState<'camera' | 'invite' | 'leaderboard' | null>(null);

    return (
    <PortalView title="Minha Tribo" subtitle="SINCRO-ESTELAR" onBack={() => go('DASHBOARD')}>
      <div className="space-y-10">
        <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm">
           <GlobalMandala />
        </div>
        
        <div className="relative">
           <ConstellationOrbit user={user} onUpdateUser={updateUser} />
        </div>

        <div className="space-y-4">
           <div className="flex justify-between items-center px-4">
              <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><Flame size={12} className="text-amber-500"/> Pactos Ativos</h4>
              <button onClick={() => go('TRIBE_INVITE')} className="text-[9px] font-bold text-primary-600 uppercase flex items-center gap-1 bg-white border border-primary-100 px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform"><Plus size={12}/> Convidar Externo</button>
           </div>

            {/* Referral / Invite Tracking */}
            <div className="bg-indigo-50 p-4 rounded-[2rem] border border-indigo-100 flex items-center justify-between mb-4">
               <div>
                  <h5 className="font-bold text-indigo-900 text-xs">Sementes Plantadas</h5>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">3 Convites Aceitos</p>
               </div>
               <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center text-[10px]">👩‍🎨</div>
                   <div className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white flex items-center justify-center text-[10px]">🧑‍💻</div>
                   <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-[10px]">🦸‍♀️</div>
               </div>
            </div>

           <div className="bg-white p-6 rounded-[3rem] border border-nature-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all" onClick={() => go('TRIBE_INTERACTION')}>
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
        </div>

        <div className="bg-indigo-900 rounded-[3.5rem] p-10 text-white text-center space-y-6 relative overflow-hidden">
           <Trophy size={160} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
           <h4 className="font-serif italic text-2xl relative z-10">Jornada Coletiva</h4>
           <div className="flex justify-center -space-x-4 relative z-10">
              {[1,2,3,4,5].map(i => <img key={i} src={`https://api.dicebear.com/7.x/notionists/svg?seed=tribo${i}`} className="w-14 h-14 rounded-full border-4 border-indigo-800 shadow-xl object-cover" />)}
           </div>
           <p className="text-xs text-indigo-200 italic px-4 relative z-10">"Sua tribo elevou a vibração coletiva em 14% este mês. Continuem brilhando."</p>
           <button onClick={() => setActiveModal('leaderboard')} className="w-full py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-[10px] font-bold uppercase tracking-widest relative z-10 hover:bg-white/20 transition-all">Ver evolução da tribo</button>
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
