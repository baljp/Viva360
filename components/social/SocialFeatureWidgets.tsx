
import React, { useState, useEffect, useMemo } from 'react';
import { User, DailyRitualSnap, ConstellationMember, MoodType, ConstellationPact } from '../../types';
import { Sparkles, Heart, Wind, Zap, Users, UserPlus, Search, Droplets, Loader2, Plus, Camera, Calendar, Link, Send, Trophy, Flame, Play, Pause, SkipBack, SkipForward, Maximize2, Clock, CalendarDays, CalendarRange } from 'lucide-react';
import { BottomSheet, DynamicAvatar } from '../Common';
import { api } from '../../services/api';
import { useAppToast } from '../../src/contexts/AppToastContext';
import { captureFrontendError } from '../../lib/frontendLogger';

// --- USER AURA (GAMIFICADA) ---
export const UserAura: React.FC<{ user: User }> = ({ user }) => {
    const karma = user.karma || 0;
    const level = user.prestigeLevel || 1;
    const auraColor = level > 3 ? 'from-indigo-400/40 to-purple-500/40' : 
                      level > 1 ? 'from-amber-400/30 to-orange-500/30' : 
                      'from-primary-300/20 to-emerald-400/20';

    return (
        <div className="relative flex items-center justify-center p-12">
            <div className={`absolute inset-0 bg-gradient-to-br ${auraColor} blur-[100px] rounded-full animate-breathe`}></div>
            <div className="relative z-10">
                <div className="absolute -top-4 -right-4 bg-white p-2 rounded-2xl shadow-xl border border-nature-100 animate-bounce">
                    <Trophy size={20} className="text-amber-500" />
                </div>
                <DynamicAvatar user={user} size="xl" className="border-8 border-white/50 shadow-2xl" />
            </div>
            <div className="absolute -bottom-6 bg-nature-900 px-6 py-2 rounded-2xl text-white text-[10px] font-bold uppercase tracking-[0.3em] shadow-2xl">
                Nível {level} • Aura {karma > 5000 ? 'Radiante' : 'Estável'}
            </div>
        </div>
    );
};

// --- TIMELAPSE VIEWER EVOLUÍDO ---
export const TimelapseViewer: React.FC<{ snaps: DailyRitualSnap[] }> = ({ snaps }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    
    // Filtro e Ordenação Baseada na Granularidade
    const timelineSnaps = useMemo(() => {
        const sorted = [...snaps].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const now = new Date();
        
        if (granularity === 'daily') {
            // Apenas rituais de hoje (ou os últimos 3 rituais do dia mais recente com dados)
            const todayStr = now.toISOString().split('T')[0];
            const todaySnaps = sorted.filter(s => s.date.startsWith(todayStr));
            return todaySnaps.length > 0 ? todaySnaps : sorted.slice(-3);
        }
        
        if (granularity === 'weekly') {
            // Últimos 7 dias
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return sorted.filter(s => new Date(s.date) >= sevenDaysAgo);
        }

        if (granularity === 'monthly') {
            // Últimos 30 dias
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return sorted.filter(s => new Date(s.date) >= thirtyDaysAgo);
        }

        return sorted;
    }, [snaps, granularity]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying && timelineSnaps.length > 0) {
            interval = setInterval(() => {
                setCurrentIndex(prev => {
                    if (prev >= timelineSnaps.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, granularity === 'daily' ? 1200 : 800); // Mais rápido para sequências longas
        }
        return () => clearInterval(interval);
    }, [isPlaying, timelineSnaps.length, granularity]);

    useEffect(() => {
        setCurrentIndex(0); // Reinicia ao mudar filtro
    }, [granularity]);

    if (!snaps || snaps.length === 0) return (
        <div className="aspect-[4/5] bg-nature-50 rounded-[3rem] border-2 border-dashed border-nature-100 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-nature-300 mb-6 shadow-sm relative z-10"><Camera size={32} /></div>
            <h4 className="text-nature-900 font-serif italic text-xl relative z-10">Sua História Visual</h4>
            <p className="text-xs text-nature-400 mt-2 max-w-[200px] leading-relaxed relative z-10">Capture seu primeiro ritual para iniciar sua metamorfose.</p>
        </div>
    );

    const activeSnap = timelineSnaps[currentIndex];

    return (
        <div className="bg-white p-3 rounded-[3.5rem] border border-nature-100 shadow-xl space-y-4">
             {/* Controles de Granularidade */}
             <div className="flex gap-1.5 p-1 bg-nature-50 rounded-2xl mx-3 mt-2">
                 {[
                     { id: 'daily', label: 'Dia', icon: Clock },
                     { id: 'weekly', label: 'Semana', icon: CalendarDays },
                     { id: 'monthly', label: 'Mês', icon: CalendarRange }
                 ].map(btn => (
                     <button 
                        key={btn.id} 
                        onClick={() => setGranularity(btn.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${granularity === btn.id ? 'bg-white text-nature-900 shadow-sm' : 'text-nature-400'}`}
                     >
                         <btn.icon size={12} /> {btn.label}
                     </button>
                 ))}
             </div>

             <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden bg-nature-900 group shadow-inner">
                {activeSnap ? (
                    <>
                        <img 
                            src={activeSnap.imageUrl} 
                            className="w-full h-full object-cover transition-all duration-500 ease-in-out scale-105 group-hover:scale-100" 
                            alt="Snap Evolution" 
                            key={activeSnap.id}
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-nature-900 via-nature-900/10 to-transparent opacity-90"></div>
                        
                        <div className="absolute top-0 left-0 w-full p-6 pt-8 flex justify-between items-start z-10">
                             <div className="inline-flex flex-col items-center bg-nature-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-white shadow-lg min-w-[50px]">
                                 <span className="text-xl font-bold leading-none">{new Date(activeSnap.date).getDate()}</span>
                                 <span className="text-[9px] font-bold uppercase tracking-widest">{new Date(activeSnap.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                {activeSnap.timeSlot && (
                                    <span className="px-4 py-1.5 bg-primary-500/80 backdrop-blur-md rounded-full text-[9px] font-bold text-white uppercase tracking-widest shadow-lg">
                                        {activeSnap.timeSlot === 'morning' ? 'Despertar' : activeSnap.timeSlot === 'afternoon' ? 'Sol Pleno' : 'Recolher'}
                                    </span>
                                )}
                                {activeSnap.mood && (
                                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-[9px] font-bold text-white uppercase tracking-widest shadow-lg">
                                        {activeSnap.mood}
                                    </span>
                                )}
                             </div>
                        </div>

                        <div className="absolute bottom-0 left-0 w-full p-8 pb-10 z-10">
                             <div className="space-y-4">
                                {activeSnap.note && (
                                    <div className="bg-nature-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 border-l-4 border-l-primary-400">
                                        <p className="text-white/90 text-xs italic font-serif leading-relaxed line-clamp-2">"{activeSnap.note}"</p>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-1.5 h-1">
                                    {timelineSnaps.map((_, idx) => (
                                        <div key={idx} className="h-full flex-1 bg-white/20 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full bg-primary-400 shadow-[0_0_8px_rgba(117,159,144,0.8)] transition-all duration-300 ${idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full' : 'w-0'}`}
                                            ></div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/50 p-8 text-center space-y-4">
                        <Calendar size={48} />
                        <p className="text-sm italic">Nenhum registro para este período.</p>
                    </div>
                )}
                
                {timelineSnaps.length > 0 && (
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 z-20 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                        <button 
                            onClick={() => { 
                                if (!isPlaying && currentIndex === timelineSnaps.length - 1) setCurrentIndex(0);
                                setIsPlaying(!isPlaying); 
                            }} 
                            className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-nature-900 transition-all shadow-2xl active:scale-90"
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>
                    </div>
                )}
             </div>
        </div>
    );
};


// --- GUARDIAN PROGRESSION (PRO) ---
export const GuardianProgression: React.FC<{ karma: number }> = ({ karma }) => {
    const level = Math.floor(karma / 1000) + 1;
    const progress = (karma % 1000) / 10;
    return (
        <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm space-y-6">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Patamar do Guardião</p>
                    <h3 className="text-2xl font-serif italic text-nature-900">Mestre de Luz</h3>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-primary-600 font-bold text-xl">{karma} <Sparkles size={16}/></div>
                    <p className="text-[9px] text-nature-400 uppercase font-bold tracking-tighter">Próximo Nível: {level + 1}</p>
                </div>
            </div>
            <div className="h-3 w-full bg-nature-50 rounded-full border border-nature-100 overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-primary-400 to-indigo-500 shadow-lg" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};

// --- PACT WIDGET (GAMIFICAÇÃO DE RETENÇÃO) ---
const PactWidget: React.FC<{ pact: ConstellationPact, userAvatar: string, onSendLight: () => void }> = ({ pact, userAvatar, onSendLight }) => {
    const myPercent = Math.min((pact.myProgress / pact.target) * 100, 100);
    const partnerPercent = Math.min((pact.partnerProgress / pact.target) * 100, 100);

    return (
        <div className="bg-nature-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-2xl group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-2xl"><Flame size={20} className="text-amber-400" /></div>
                        <div>
                           <h3 className="font-serif italic text-xl leading-none">{pact.missionLabel}</h3>
                           <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-nature-400 mt-2">Pacto Sagrado Ativo</p>
                        </div>
                    </div>
                    <button onClick={onSendLight} className="p-4 bg-white text-nature-900 rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl"><Zap size={20} fill="currentColor" /></button>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <img src={userAvatar} className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg" alt="Você" />
                        <span className="text-[10px] font-bold uppercase">Você</span>
                    </div>
                    <div className="flex-1 flex gap-2 h-20 items-end justify-center px-4">
                        <div className="w-4 bg-white/5 rounded-full h-full relative overflow-hidden border border-white/10"><div className="absolute bottom-0 w-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-1000" style={{ height: `${myPercent}%` }}></div></div>
                        <div className="w-4 bg-white/5 rounded-full h-full relative overflow-hidden border border-white/10"><div className="absolute bottom-0 w-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all duration-1000" style={{ height: `${partnerPercent}%` }}></div></div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <img src={pact.partnerAvatar} className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg" alt={pact.partnerName || 'Parceiro'} />
                        <span className="text-[10px] font-bold uppercase truncate w-16 text-center">{pact.partnerName.split(' ')[0]}</span>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Recompensa: <span className="text-primary-400">+{pact.rewardKarma} Karma</span></p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white uppercase">{pact.myProgress + pact.partnerProgress} / {pact.target * 2}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CONSTELLATION ORBIT ---
export const ConstellationOrbit: React.FC<{ user: User, onUpdateUser: (u: User) => void, onInvite?: () => void }> = ({ user, onUpdateUser, onInvite }) => {
    const [selectedMember, setSelectedMember] = useState<ConstellationMember | null>(null);
    const [members, setMembers] = useState<ConstellationMember[]>(user?.constellation ?? []);
    const [membersLoading, setMembersLoading] = useState(true);
    const { showToast } = useAppToast();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await api.tribe.getMembers();
                if (!cancelled) setMembers(data);
            } catch {
                // fallback to user.constellation se API falhar
                if (!cancelled && user.constellation?.length) setMembers(user.constellation);
            } finally {
                if (!cancelled) setMembersLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [user.id]);

    const handleSendVibe = (reward: number) => {
        onUpdateUser({ ...user, karma: (user.karma || 0) + reward });
        showToast({ title: "Sincronia!", message: `Energia enviada. Você recebeu +${reward} Karma.` });
        setSelectedMember(null);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-[3.5rem] border border-nature-100 shadow-sm overflow-hidden">
                <h3 className="font-bold text-nature-900 text-sm flex items-center gap-2 mb-6 px-2"><Users size={18} className="text-primary-600" /> Minha Tribo</h3>
                <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex flex-col items-center gap-3 shrink-0"><div className="w-16 h-16 rounded-full border-4 border-primary-500 p-1"><img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="Você" /></div><span className="text-[10px] font-bold text-nature-900">Você</span></div>
                    {membersLoading
                        ? [1,2,3,4].map(i => (
                            <div key={i} className="flex flex-col items-center gap-3 shrink-0 animate-pulse">
                                <div className="w-16 h-16 rounded-full bg-nature-100" />
                                <div className="w-10 h-2 bg-nature-100 rounded-full" />
                            </div>
                        ))
                        : members.length === 0
                        ? <p className="text-[10px] text-nature-400 italic py-4 px-2">Nenhum membro ainda. Convide alguém!</p>
                        : members.map(member => (
                            <button key={member.id} onClick={() => setSelectedMember(member)} className="flex flex-col items-center gap-3 shrink-0 group">
                                <div className={`w-16 h-16 rounded-full border-4 p-1 transition-all group-hover:scale-110 ${member.needsWatering ? 'border-amber-400 animate-pulse' : 'border-nature-50'}`}><img src={member.avatar} className="w-full h-full rounded-full object-cover" alt={member.name} /></div>
                                <span className="text-[10px] font-medium text-nature-500">{member.name.split(' ')[0]}</span>
                            </button>
                        ))
                    }
                    <button onClick={() => onInvite ? onInvite() : showToast({ title: "Convite aberto", message: "Fluxo de convite da tribo será iniciado." })} className="w-16 h-16 rounded-full border-4 border-dashed border-nature-100 flex items-center justify-center text-nature-200 shrink-0 hover:bg-nature-50 transition-colors"><Plus size={24} /></button>
                </div>
            </div>
            {user.activePact && <PactWidget pact={user.activePact} userAvatar={user.avatar} onSendLight={() => handleSendVibe(20)} />}
            <BottomSheet isOpen={!!selectedMember} onClose={() => setSelectedMember(null)} title="Enviar Boas Vibrações">
                <div className="text-center space-y-8 pb-8">
                    <DynamicAvatar user={selectedMember || {}} size="xl" className="mx-auto" />
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Amor', icon: Heart, reward: 10, color: 'text-rose-500' },
                            { label: 'Força', icon: Zap, reward: 15, color: 'text-amber-500' },
                            { label: 'Calma', icon: Wind, reward: 10, color: 'text-sky-500' },
                            { label: 'Regar', icon: Droplets, reward: 25, color: 'text-blue-500' }
                        ].map(v => (
                            <button key={v.label} onClick={() => handleSendVibe(v.reward)} className="p-6 bg-nature-50 rounded-3xl flex flex-col items-center gap-2 hover:bg-white border border-transparent hover:border-nature-100 transition-all active:scale-95 group">
                                <v.icon size={32} className={`${v.color} group-hover:scale-110 transition-transform`} />
                                <span className="font-bold text-xs">{v.label}</span>
                                <span className="text-[9px] text-nature-400">+{v.reward} Karma</span>
                            </button>
                        ))}
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
};

// --- GLOBAL MANDALA (SYNC) ---
export const GlobalMandala: React.FC<{ user: User, onUpdateUser: (u: User) => void }> = ({ user, onUpdateUser }) => {
    const [liveUsers, setLiveUsers] = useState<number | null>(null);
    const [isBreathing, setIsBreathing] = useState(false);
    const [hasSynced, setHasSynced] = useState(false);

    // ✅ Presença real via API com polling a cada 60s
    useEffect(() => {
        let cancelled = false;
        const fetchPresence = async () => {
            try {
                const data = await api.tribe.getPresence();
                if (!cancelled) setLiveUsers(data.count);
            } catch {
                // silently ignore — mantém null (exibe '---')
            }
        };
        fetchPresence();
        const interval = setInterval(fetchPresence, 60_000);
        return () => { cancelled = true; clearInterval(interval); };
    }, []);

    const handleSync = async () => {
        if (hasSynced) return;
        setIsBreathing(true);
        try {
            const res = await api.tribe.syncVibration(user.id);
            if (res.success) {
                onUpdateUser({ ...user, karma: (user.karma || 0) + res.reward });
                setHasSynced(true);
                if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
            }
        } catch (e) {
            captureFrontendError(e, { component: 'SocialFeatureWidgets', op: 'syncVibration' });
        }
    };

    const stopSync = () => {
        setIsBreathing(false);
    };

    return (
        <div className="flex flex-col items-center gap-6 py-10">
            <button 
                onMouseDown={handleSync} 
                onMouseUp={stopSync} 
                onTouchStart={handleSync}
                onTouchEnd={stopSync}
                disabled={hasSynced}
                className={`relative w-48 h-48 flex items-center justify-center transition-transform active:scale-95 touch-none ${hasSynced ? 'opacity-80' : ''}`}
            >
                <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${hasSynced ? 'bg-emerald-200/40' : (isBreathing ? 'bg-primary-300/60 animate-breathe' : 'bg-primary-200/40 animate-ping-slow')}`}></div>
                <div className={`absolute inset-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border ${hasSynced ? 'border-emerald-200' : 'border-white/50'} z-10`}>
                    {hasSynced ? <Heart size={40} className="text-emerald-500 fill-current" /> : <Sparkles size={40} className="text-primary-500" />}
                </div>
                {isBreathing && !hasSynced && <div className="absolute -top-12 bg-nature-900 text-white px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest animate-bounce">Sincronizando Respiro...</div>}
                {hasSynced && <div className="absolute -top-12 bg-emerald-600 text-white px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest animate-in fade-in zoom-in">Sincronizado! +10 Karma</div>}
            </button>
            <div className="text-center space-y-1">
                 <p className="text-[10px] font-bold text-nature-500 uppercase tracking-[0.3em]">{liveUsers !== null ? liveUsers : '---'} ALMAS EM SINTONIA AGORA</p>
                 <p className="text-[11px] text-nature-400 italic">Pressione e segure para unir sua energia</p>
            </div>
        </div>
    );
};
