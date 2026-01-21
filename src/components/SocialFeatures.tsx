
import React, { useState, useEffect } from 'react';
/**
 * FIX: Removed non-existent ConstellationInvite from imports.
 */
import { User, DailyRitualSnap, ConstellationMember, MoodType, ConstellationPact } from '../types';
import { Sparkles, Heart, Wind, Zap, Users, UserPlus, Search, Droplets, Loader2, Plus, Camera, Calendar, Link, Send, Trophy, Flame } from 'lucide-react';
import { BottomSheet, ZenToast, DynamicAvatar } from './Common';
import { api } from '../services/api';

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

// --- SOUL JOURNEY PLAYER ---
export const SoulJourneyPlayer: React.FC<{ snaps: DailyRitualSnap[], period: string, setPeriod: (p: any) => void }> = ({ snaps, period, setPeriod }) => {
    return (
        <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="font-serif italic text-xl text-nature-900 leading-none">Minha Metamorfose</h3>
                   <p className="text-[10px] text-nature-400 uppercase font-bold tracking-widest mt-2">REGISTRO VISUAL</p>
                </div>
                <div className="flex gap-1 bg-nature-50 p-1.5 rounded-2xl">
                    {['week', 'month'].map((p) => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase transition-all ${period === p ? 'bg-white text-nature-900 shadow-md' : 'text-nature-400'}`}>
                            {p === 'week' ? 'Semana' : 'Mês'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
                {snaps.slice(0, 8).map((snap) => (
                    <div key={snap.id} className="aspect-[3/4] rounded-2xl overflow-hidden bg-nature-50 border border-nature-100 group relative">
                        <img src={snap.imageUrl} className="w-full h-full object-cover transition-all group-hover:scale-110" />
                        <div className="absolute inset-0 bg-nature-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                ))}
                {snaps.length < 8 && Array.from({ length: 8 - snaps.length }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-nature-100 flex items-center justify-center text-nature-200"><Camera size={20} /></div>
                ))}
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
                        <img src={userAvatar} className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg" />
                        <span className="text-[10px] font-bold uppercase">Você</span>
                    </div>
                    <div className="flex-1 flex gap-2 h-20 items-end justify-center px-4">
                        <div className="w-4 bg-white/5 rounded-full h-full relative overflow-hidden border border-white/10"><div className="absolute bottom-0 w-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-1000" style={{ height: `${myPercent}%` }}></div></div>
                        <div className="w-4 bg-white/5 rounded-full h-full relative overflow-hidden border border-white/10"><div className="absolute bottom-0 w-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all duration-1000" style={{ height: `${partnerPercent}%` }}></div></div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <img src={pact.partnerAvatar} className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg" />
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
export const ConstellationOrbit: React.FC<{ user: User, onUpdateUser: (u: User) => void }> = ({ user, onUpdateUser }) => {
    const [selectedMember, setSelectedMember] = useState<ConstellationMember | null>(null);
    const [toast, setToast] = useState<{title: string, msg: string} | null>(null);
    const members = user?.constellation || [];

    const handleSendVibe = (reward: number) => {
        onUpdateUser({ ...user, karma: (user.karma || 0) + reward });
        setToast({ title: "Sincronia!", msg: `Energia enviada. Você recebeu +${reward} Karma.` });
        setSelectedMember(null);
    };

    return (
        <div className="space-y-6">
            {toast && <ZenToast toast={{ title: toast.title, message: toast.msg }} onClose={() => setToast(null)} />}
            <div className="bg-white p-6 rounded-[3.5rem] border border-nature-100 shadow-sm overflow-hidden">
                <h3 className="font-bold text-nature-900 text-sm flex items-center gap-2 mb-6 px-2"><Users size={18} className="text-primary-600" /> Minha Tribo</h3>
                <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex flex-col items-center gap-3 shrink-0"><div className="w-16 h-16 rounded-full border-4 border-primary-500 p-1"><img src={user.avatar} className="w-full h-full rounded-full object-cover" /></div><span className="text-[10px] font-bold text-nature-900">Você</span></div>
                    {members.map(member => (
                        <button key={member.id} onClick={() => setSelectedMember(member)} className="flex flex-col items-center gap-3 shrink-0 group">
                            <div className={`w-16 h-16 rounded-full border-4 p-1 transition-all group-hover:scale-110 ${member.needsWatering ? 'border-amber-400 animate-pulse' : 'border-nature-50'}`}><img src={member.avatar} className="w-full h-full rounded-full object-cover" /></div>
                            <span className="text-[10px] font-medium text-nature-500">{member.name.split(' ')[0]}</span>
                        </button>
                    ))}
                    <button className="w-16 h-16 rounded-full border-4 border-dashed border-nature-100 flex items-center justify-center text-nature-200 shrink-0 hover:bg-nature-50 transition-colors"><Plus size={24} /></button>
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
export const GlobalMandala: React.FC = () => {
    const [liveUsers] = useState(432 + Math.floor(Math.random() * 50));
    const [isBreathing, setIsBreathing] = useState(false);
    return (
        <div className="flex flex-col items-center gap-6 py-10">
            <button 
                onMouseDown={() => setIsBreathing(true)} 
                onMouseUp={() => setIsBreathing(false)} 
                onTouchStart={() => setIsBreathing(true)}
                onTouchEnd={() => setIsBreathing(false)}
                className="relative w-48 h-48 flex items-center justify-center transition-transform active:scale-95 touch-none"
            >
                <div className={`absolute inset-0 bg-primary-200/40 rounded-full ${isBreathing ? 'animate-breathe' : 'animate-ping-slow'}`}></div>
                <div className="absolute inset-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/50 z-10"><Sparkles size={40} className="text-primary-500" /></div>
                {isBreathing && <div className="absolute -top-12 bg-nature-900 text-white px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest animate-bounce">Sincronizando Respiro...</div>}
            </button>
            <div className="text-center space-y-1">
                 <p className="text-[10px] font-bold text-nature-500 uppercase tracking-[0.3em]">{liveUsers} ALMAS EM SINTONIA AGORA</p>
                 <p className="text-[11px] text-nature-400 italic">Pressione e segure para unir sua energia</p>
            </div>
        </div>
    );
};
