import React, { useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { PortalView } from '../../../components/Common';
import { Sparkles, TrendingUp, Gift, ShoppingBag, Users, Zap, History, Lock, ArrowRight, Award, Star } from 'lucide-react';
import { User } from '../../../types';
import { getUserRank, getRankProgress, CLIENT_RANKS, CLIENT_ACHIEVEMENTS, checkAchievements, getUnlockedCount } from '../../../utils/gamification';

export default function KarmaWallet({ user }: { user: User }) {
    const { back, go } = useBuscadorFlow();
    const [activeTab, setActiveTab] = useState<'history' | 'earn' | 'rewards'>('history');

    const currentKarma = user.karma || 0;
    const rank = getUserRank(currentKarma, CLIENT_RANKS);
    const progress = getRankProgress(currentKarma, CLIENT_RANKS);
    const nextRank = CLIENT_RANKS.find(r => r.level === rank.level + 1);
    const achievements = checkAchievements(user, CLIENT_ACHIEVEMENTS);
    const unlockedCount = getUnlockedCount(achievements);

    return (
        <PortalView 
            title="Karma & Energia" 
            subtitle="SUA CARTEIRA" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800"
        >
            <div className="px-4 pb-24 space-y-6">
                
                {/* Balance Card */}
                <div className="bg-nature-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-[80px] -mr-32 -mt-32 opacity-20"></div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 mb-4">
                            <Sparkles size={12} className="text-amber-400" />
                            <span>Nível {rank.level}: {rank.name}</span>
                        </div>

                        <div className="text-6xl font-serif italic mb-2 tracking-tighter text-amber-50 drop-shadow-lg">
                            {currentKarma}
                        </div>
                        <p className="text-[10px] font-bold text-nature-300 uppercase tracking-[0.3em]">Saldo de Karma</p>

                        {/* Progress Bar */}
                        <div className="mt-8">
                            <div className="flex justify-between text-[9px] font-bold uppercase text-nature-400 mb-2">
                                <span>{rank.name}</span>
                                <span>{nextRank ? nextRank.name : 'Árvore Mestre'}</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>
                            {nextRank && (
                                <p className="text-[9px] text-nature-400 mt-2 text-right">Faltam {nextRank.min - currentKarma} para evoluir</p>
                            )}
                        </div>

                        {/* Achievements Summary */}
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <Award size={14} className="text-amber-400"/>
                            <span className="text-[10px] font-bold text-amber-200/80 uppercase tracking-widest">{unlockedCount}/{achievements.length} conquistas</span>
                            <button onClick={() => go('EVOLUTION_ACHIEVEMENTS')} className="text-[9px] font-bold text-amber-400 underline uppercase tracking-widest">Ver todas</button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="p-1 bg-white rounded-2xl flex gap-1 border border-nature-100 shadow-sm">
                    {[
                        { id: 'history', label: 'Extrato', icon: History },
                        { id: 'earn', label: 'Ganhar', icon: TrendingUp },
                        { id: 'rewards', label: 'Trocar', icon: Gift }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${activeTab === tab.id ? 'bg-nature-50 text-nature-900 ring-1 ring-nature-200' : 'text-nature-400 hover:bg-nature-50'}`}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'text-indigo-600' : 'text-nature-300'} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="animate-in slide-in-from-bottom duration-300">
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {[
                                { id: 1, action: 'Check-in Diário', amount: +5, date: 'Hoje, 08:00', type: 'earn' },
                                { id: 2, action: 'Ritual Matinal', amount: +10, date: 'Hoje, 08:15', type: 'earn' },
                                { id: 3, action: 'Missão: Oráculo', amount: +15, date: 'Hoje, 09:30', type: 'earn' },
                                { id: 4, action: 'Regar planta de Luna', amount: +25, date: 'Ontem', type: 'earn' },
                                { id: 5, action: 'Referência (Convite)', amount: +50, date: 'Ontem', type: 'earn' },
                                { id: 6, action: 'Cupom Bazar 10%', amount: -100, date: '3 dias atrás', type: 'spend' },
                                { id: 7, action: 'Sessão com Guardião', amount: -200, date: '5 dias atrás', type: 'spend' },
                            ].map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-[2rem] border border-nature-100 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.type === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {item.type === 'earn' ? <TrendingUp size={18}/> : <ShoppingBag size={18}/>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-nature-900">{item.action}</h4>
                                            <p className="text-[10px] text-nature-400 uppercase font-bold">{item.date}</p>
                                        </div>
                                    </div>
                                    <span className={`font-mono font-bold ${item.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {item.amount > 0 ? '+' : ''}{item.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'earn' && (
                        <div className="space-y-3">
                            <div onClick={() => go('CLIENT_QUESTS')} className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 rounded-[2rem] text-white shadow-lg flex items-center justify-between group active:scale-95 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Star size={24}/></div>
                                    <div>
                                        <h4 className="font-bold text-sm">Missões do Dia</h4>
                                        <p className="text-[10px] uppercase font-bold opacity-80">Até +50 Karma/dia</p>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="opacity-70"/>
                            </div>

                            <div onClick={() => go('METAMORPHOSIS_CHECKIN')} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500"><Zap size={24}/></div>
                                    <div>
                                        <h4 className="font-bold text-sm text-nature-900">Check-in Diário</h4>
                                        <p className="text-[10px] text-indigo-500 uppercase font-bold">+5 Karma</p>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="text-nature-300"/>
                            </div>

                            <div onClick={() => go('TRIBE_INVITE')} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><Users size={24}/></div>
                                    <div>
                                        <h4 className="font-bold text-sm text-nature-900">Convidar Amigos</h4>
                                        <p className="text-[10px] text-emerald-500 uppercase font-bold">+50 Karma por convite</p>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="text-nature-300"/>
                            </div>

                            <div onClick={() => go('TRIBE_DASH')} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500"><Gift size={24}/></div>
                                    <div>
                                        <h4 className="font-bold text-sm text-nature-900">Regar Plantas da Tribo</h4>
                                        <p className="text-[10px] text-rose-500 uppercase font-bold">+25 Karma por rega</p>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="text-nature-300"/>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rewards' && (
                        <div className="space-y-3">
                            <div onClick={() => go('MARKETPLACE')} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden group cursor-pointer">
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Cupom de Desconto</p>
                                        <h3 className="font-serif text-2xl italic">10% OFF no Bazar</h3>
                                        <p className="text-xs font-bold mt-2 bg-white/20 inline-block px-3 py-1 rounded-lg">Custo: 100 Karma</p>
                                    </div>
                                    <ShoppingBag size={40} className="opacity-50 group-hover:scale-110 transition-transform"/>
                                </div>
                            </div>

                             <div className="bg-nature-100 p-6 rounded-[2.5rem] opacity-70 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-nature-200 rounded-2xl flex items-center justify-center text-nature-500"><Lock size={20}/></div>
                                    <div>
                                        <h4 className="font-bold text-sm text-nature-500">Mentoria Exclusiva</h4>
                                        <p className="text-[10px] text-nature-400 uppercase font-bold">Nível Broto Necessário</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

            </div>
        </PortalView>
    );    
}
