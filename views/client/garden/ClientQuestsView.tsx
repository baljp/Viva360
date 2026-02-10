import React, { useState, useEffect } from 'react';
import { User, DailyQuest } from '../../../types';
import { PortalView, ZenToast } from '../../../components/Common';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { api } from '../../../services/api';
import { CheckCheck, Activity, Flame, Gift, Sparkles, TrendingUp, Star, Zap } from 'lucide-react';

const DEFAULT_QUESTS: DailyQuest[] = [
    { id: 'checkin', label: 'Check-in Matinal', description: 'Registre como você está hoje', reward: 5, isCompleted: false },
    { id: 'ritual', label: 'Regar o Jardim', description: 'Complete seu ritual diário', reward: 10, isCompleted: false },
    { id: 'oracle', label: 'Consultar o Oráculo', description: 'Receba a mensagem do dia', reward: 5, isCompleted: false },
    { id: 'journal', label: 'Escrita da Alma', description: 'Escreva no seu diário', reward: 8, isCompleted: false },
    { id: 'tribe', label: 'Conexão Tribal', description: 'Interaja com alguém da tribo', reward: 15, isCompleted: false },
];

export const ClientQuestsView: React.FC<{ user: User, updateUser: (u: User) => void }> = ({ user, updateUser }) => {
    const { go, back } = useBuscadorFlow();
    const [quests, setQuests] = useState<DailyQuest[]>(user.dailyQuests?.length ? user.dailyQuests : DEFAULT_QUESTS);
    const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
    const [animatingId, setAnimatingId] = useState<string | null>(null);

    const completedCount = quests.filter(q => q.isCompleted).length;
    const totalReward = quests.reduce((sum, q) => sum + q.reward, 0);
    const earnedReward = quests.filter(q => q.isCompleted).reduce((sum, q) => sum + q.reward, 0);
    const progress = quests.length > 0 ? (completedCount / quests.length) * 100 : 0;
    const allComplete = completedCount === quests.length;

    const handleComplete = async (questId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (!quest || quest.isCompleted) return;

        setAnimatingId(questId);
        
        // Route to the appropriate screen for the quest
        const routeMap: Record<string, string> = {
            checkin: 'METAMORPHOSIS_CHECKIN',
            ritual: 'GARDEN_VIEW',
            oracle: 'ORACLE_PORTAL',
            journal: 'CLIENT_JOURNAL',
            tribe: 'TRIBE_DASH',
        };

        const route = routeMap[questId];
        if (route) {
            // Mark as complete
            const updated = quests.map(q => q.id === questId ? { ...q, isCompleted: true } : q);
            setQuests(updated);

            const karmaGain = quest.reward;
            const updatedUser = {
                ...user,
                karma: (user.karma || 0) + karmaGain,
                dailyQuests: updated,
            };
            updateUser(updatedUser);

            setToast({ title: `+${karmaGain} Karma`, message: `${quest.label} concluída!` });

            setTimeout(() => {
                setAnimatingId(null);
                go(route as any);
            }, 1200);
        }
    };

    return (
        <PortalView title="Missões do Dia" subtitle="JORNADA DIÁRIA" onBack={back}>
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            <div className="px-4 pb-32 space-y-6">

                {/* Progress Hero */}
                <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">Progresso de Hoje</p>
                                <h3 className="text-4xl font-serif italic mt-1">{completedCount}/{quests.length}</h3>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur rounded-full">
                                <Flame size={14} className="text-amber-200" />
                                <span className="text-sm font-bold">{user.streak || 0} dias</span>
                            </div>
                        </div>

                        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-white transition-all duration-1000 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-amber-100">
                            <span>{earnedReward} Karma ganhos</span>
                            <span>{totalReward - earnedReward} restantes</span>
                        </div>
                    </div>
                </div>

                {allComplete && (
                    <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-[2.5rem] text-center animate-in zoom-in duration-500">
                        <Star size={32} className="text-amber-500 mx-auto mb-3 fill-amber-500" />
                        <h4 className="font-bold text-emerald-900 text-lg">Dia Perfeito!</h4>
                        <p className="text-xs text-emerald-600 mt-1">Todas as missões concluídas. +{totalReward} Karma total.</p>
                        <button onClick={() => go('KARMA_WALLET')} className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all">
                            Ver meu Karma
                        </button>
                    </div>
                )}

                {/* Quest List */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-nature-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                        <Activity size={14} /> Missões Ativas
                    </h4>
                    {quests.map(q => (
                        <button
                            key={q.id}
                            onClick={() => handleComplete(q.id)}
                            disabled={q.isCompleted}
                            className={`w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-500 group ${
                                animatingId === q.id ? 'bg-emerald-50 border-emerald-300 scale-[1.02] shadow-lg' :
                                q.isCompleted ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : 
                                'bg-white border-nature-100 hover:border-amber-200 hover:shadow-md active:scale-[0.98]'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                    q.isCompleted ? 'bg-emerald-500 text-white' : 'bg-nature-50 text-nature-400 group-hover:bg-amber-50 group-hover:text-amber-500'
                                }`}>
                                    {q.isCompleted ? <CheckCheck size={24}/> : <Activity size={24}/>}
                                </div>
                                <div className="text-left">
                                    <h5 className="text-sm font-bold text-nature-900">{q.label}</h5>
                                    <p className="text-[10px] text-nature-400 mt-0.5">{q.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${q.isCompleted ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    +{q.reward}
                                </span>
                                <Sparkles size={14} className={q.isCompleted ? 'text-emerald-400' : 'text-amber-400'} />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Bonus Section */}
                <div className="bg-indigo-900 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                            <Gift size={28} className="text-indigo-300" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">Bônus Semanal</h4>
                            <p className="text-[10px] text-indigo-300 uppercase tracking-widest mt-0.5">Complete 5 dias seguidos: +100 Karma</p>
                        </div>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(d => (
                                <div key={d} className={`w-3 h-3 rounded-full ${d <= (user.streak || 0) % 7 ? 'bg-amber-400' : 'bg-white/20'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PortalView>
    );
};
