import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import type { ConstellationPact } from '../../types';
import { Flame, Plus, Trophy, Heart, Moon, Loader } from 'lucide-react';
import { PortalView, BottomSheet, DynamicAvatar, InteractiveButton } from '../../components/Common';
import { ConstellationOrbit, GlobalMandala } from '../../components/SocialFeatures';
import { useBuscadorFlow } from '../../src/flow/useBuscadorFlow';
import { api } from '../../services/api';
import type { GamificationLeaderboardResponse } from '../../services/api/domains/gamification';
import { captureFrontendError } from '../../lib/frontendLogger';

export const TribeView: React.FC<{ user: User, updateUser: (u: User) => void, onClose?: () => void }> = ({ user, updateUser, onClose }) => {
   const { go, back, selectTribeRoomContext } = useBuscadorFlow();
   const [activeModal, setActiveModal] = useState<'camera' | 'invite' | 'leaderboard' | null>(null);
   const [leaderboard, setLeaderboard] = useState<GamificationLeaderboardResponse | null>(null);
   const [leaderboardLoading, setLeaderboardLoading] = useState(false);
   const [activePacts, setActivePacts] = useState<ConstellationPact[]>([]);
   const [pactsLoading, setPactsLoading] = useState(true);

   // ✅ Pactos ativos via API
   useEffect(() => {
      let cancelled = false;
      (async () => {
         try {
            const data = await api.tribe.getActivePacts();
            if (!cancelled) setActivePacts(data);
         } catch (err) {
            captureFrontendError(err, { view: 'TribeView', op: 'getActivePacts' });
         } finally {
            if (!cancelled) setPactsLoading(false);
         }
      })();
      return () => { cancelled = true; };
   }, []);

   const openLeaderboard = async () => {
      setActiveModal('leaderboard');
      if (leaderboard || leaderboardLoading) return;
      setLeaderboardLoading(true);
      try {
         const payload = await api.gamification.getLeaderboard();
         setLeaderboard(payload);
      } catch (error) {
         captureFrontendError(error, { view: 'TribeView', op: 'openLeaderboard' });
      } finally {
         setLeaderboardLoading(false);
      }
   };

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
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><Flame size={12} className="text-amber-500" /> Pactos Ativos</h4>
               </div>

               {/* Referral / Invite Tracking - clickable, goes to invite */}
               <div onClick={() => go('TRIBE_INVITE')} className="bg-indigo-50 p-4 rounded-[2rem] border border-indigo-100 flex items-center justify-between mb-4 cursor-pointer active:scale-[0.98] transition-all hover:bg-indigo-100/50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                     <div className="w-10 h-10 bg-indigo-200 rounded-xl flex items-center justify-center shrink-0"><Plus size={18} className="text-indigo-700" /></div>
                     <div className="min-w-0">
                        <h5 className="font-bold text-indigo-900 text-xs truncate">Expandir Tribo</h5>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase mt-0.5 truncate">Convidar nova alma para o Viva360</p>
                     </div>
                  </div>
               </div>

               {pactsLoading ? (
                  <div className="flex items-center justify-center py-6 text-nature-400 gap-2">
                     <Loader size={16} className="animate-spin" />
                     <span className="text-xs italic">Buscando pactos...</span>
                  </div>
               ) : activePacts.length === 0 ? (
                  <div
                     onClick={() => go('SOUL_PACT')}
                     className="bg-amber-50 p-6 rounded-[3rem] border border-dashed border-amber-200 flex items-center gap-4 cursor-pointer active:scale-95 transition-all hover:bg-amber-100/50"
                  >
                     <div className="w-14 h-14 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center"><Flame size={28} /></div>
                     <div>
                        <h5 className="font-bold text-amber-900 text-sm">Nenhum Pacto Ativo</h5>
                        <p className="text-[10px] text-amber-500 font-bold uppercase mt-1">Toque para criar um pacto de alma</p>
                     </div>
                  </div>
               ) : (
                  activePacts.slice(0, 3).map(pact => {
                     const progress = ((pact.myProgress + pact.partnerProgress) / (pact.target * 2));
                     const progressPct = Math.round(Math.min(progress, 1) * 100);
                     const strokeDashoffset = 150 - (150 * Math.min(progress, 1));
                     return (
                        <div
                           key={pact.id}
                           className="bg-white p-6 rounded-[3rem] border border-nature-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all cursor-pointer"
                           onClick={() => go('SOUL_PACT')}
                        >
                           <div className="flex items-center gap-5">
                              <img
                                 src={pact.partnerAvatar}
                                 alt={pact.partnerName}
                                 className="w-14 h-14 rounded-2xl border-2 border-amber-100 object-cover"
                              />
                              <div>
                                 <h5 className="font-bold text-nature-900 text-sm">{pact.missionLabel}</h5>
                                 <p className="text-[10px] text-nature-400 font-bold uppercase mt-1">
                                    Com {pact.partnerName.split(' ')[0]} • {pact.myProgress}/{pact.target} Dias
                                 </p>
                              </div>
                           </div>
                           <div className="relative w-14 h-14 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90">
                                 <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-nature-50" />
                                 <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-amber-500" strokeDasharray={150} strokeDashoffset={strokeDashoffset} />
                              </svg>
                              <span className="absolute text-[10px] font-black text-amber-600">{progressPct}%</span>
                           </div>
                        </div>
                     );
                  })
               )}

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
                  {[1, 2, 3, 4, 5].map(i => <img key={i} src={`https://api.dicebear.com/7.x/notionists/svg?seed=tribo${i}`} className="w-14 h-14 rounded-full border-4 border-indigo-800 shadow-xl object-cover" alt="Membro da tribo" />)}
               </div>
               <p className="text-xs text-indigo-200 italic px-4 relative z-10">"Sua tribo elevou a vibração coletiva em 14% este mês. Continuem brilhando."</p>
               <div className="grid grid-cols-1 gap-3 relative z-10 px-4">
                  <InteractiveButton variant="glass" size="lg" onClick={() => { selectTribeRoomContext({ type: 'healing_circle' }); go('HEALING_CIRCLE'); }} className="w-full rounded-2xl flex items-center justify-center gap-2 text-indigo-900">
                     <Heart size={14} fill="currentColor" /> Participar do Círculo de Cura
                  </InteractiveButton>
                  <InteractiveButton variant="primary" size="lg" onClick={() => { selectTribeRoomContext({ type: 'support_room' }); go('TRIBE_INTERACTION'); }} className="w-full rounded-2xl flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600">
                     <Plus size={14} /> Sala de Apoio Coletivo
                  </InteractiveButton>
                  <InteractiveButton variant="ghost" size="md" onClick={openLeaderboard} className="w-full rounded-2xl text-white border-white/20 hover:bg-white/20">Ver evolução da tribo</InteractiveButton>
               </div>
            </div>

            <BottomSheet isOpen={activeModal === 'leaderboard'} onClose={() => setActiveModal(null)} title="Classificação Radiante">
               <div className="space-y-6 pb-12">
                  <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="text-2xl font-black text-indigo-200">#{leaderboard?.me.rankPosition || '--'}</div>
                        <DynamicAvatar user={user} size="md" />
                        <div>
                           <h4 className="font-bold text-nature-900 text-sm">Você</h4>
                           <p className="text-[10px] font-bold text-indigo-500 uppercase">{leaderboard?.me.rankName || user.plantStage} • Nível {leaderboard?.me.rankLevel || (Math.floor((user.plantXp || 0) / 20) + 1)}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="block text-xl font-black text-nature-900">{leaderboard?.me.karma ?? user.karma}</span>
                        <span className="text-[9px] font-bold text-nature-400 uppercase">Karma</span>
                     </div>
                  </div>

                  <div className="bg-white border border-nature-100 rounded-3xl p-5 space-y-4">
                     <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-nature-900">Challenges do Dia</h4>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                           {leaderboard?.me.challenges.completed ?? 0}/{leaderboard?.me.challenges.total ?? 0}
                        </span>
                     </div>
                     {leaderboardLoading && <p className="text-[11px] text-nature-400">Carregando desafios...</p>}
                     {(leaderboard?.me.challenges.items || []).slice(0, 5).map((challenge) => (
                        <div key={challenge.id} className="flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-5 h-5 rounded-full ${challenge.completed ? 'bg-emerald-500' : 'bg-nature-100'}`}></div>
                              <span className="text-xs text-nature-700 truncate">{challenge.label}</span>
                           </div>
                           <span className="text-[10px] font-bold text-nature-400">+{challenge.reward}</span>
                        </div>
                     ))}
                  </div>

                  <div className="bg-white border border-nature-100 rounded-3xl p-5 space-y-3">
                     <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-nature-900">Ranking da Tribo</h4>
                        {leaderboardLoading && <span className="text-[10px] text-nature-400">Carregando...</span>}
                     </div>
                     {(leaderboard?.leaderboard || []).slice(0, 8).map((entry, index) => (
                        <div key={entry.userId} className="flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 text-[10px] font-black text-indigo-300">#{index + 1}</span>
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-nature-100">
                                 {entry.avatar ? <img src={entry.avatar} alt="" className="w-full h-full object-cover" /> : null}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-xs font-bold text-nature-900 truncate">{entry.name}</p>
                                 <p className="text-[10px] text-nature-400 uppercase">{entry.rankName}</p>
                              </div>
                           </div>
                           <span className="text-xs font-black text-nature-800">{entry.karma}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </BottomSheet>
         </div>
      </PortalView >
   );
};
