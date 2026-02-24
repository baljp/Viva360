import React, { useState, useEffect } from 'react';
import { User, DailyQuest, Achievement } from '../../../types';
import { PortalView } from '../../../components/Common';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { api } from '../../../services/api';
import { CheckCheck, Activity, Flame, Gift, Sparkles, TrendingUp, Star, Zap, Award, Lock, Trophy } from 'lucide-react';
import { CLIENT_ACHIEVEMENTS, checkAchievements, getUserRank, CLIENT_RANKS, getRankProgress, getUnlockedCount } from '../../../utils/gamification';

const DEFAULT_QUESTS: DailyQuest[] = [
    { id: 'checkin', label: 'Check-in Matinal', description: 'Registre como você está hoje', reward: 5, isCompleted: false },
    { id: 'ritual', label: 'Regar o Jardim', description: 'Complete seu ritual diário', reward: 10, isCompleted: false },
    { id: 'oracle', label: 'Consultar o Oráculo', description: 'Receba a mensagem do dia', reward: 5, isCompleted: false },
    { id: 'journal', label: 'Escrita da Alma', description: 'Escreva no seu diário', reward: 8, isCompleted: false },
    { id: 'tribe', label: 'Conexão Tribal', description: 'Interaja com alguém da tribo', reward: 15, isCompleted: false },
];

const buildQuestStorageKey = (userId: string, date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `viva360.client.daily_quests.${userId}.${y}-${m}-${d}`;
};

const loadPersistedQuests = (user: User): DailyQuest[] | null => {
    try {
        if (!user?.id) return null;
        const raw = localStorage.getItem(buildQuestStorageKey(user.id));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Array<Partial<DailyQuest> & { id?: string }>;
        if (!Array.isArray(parsed)) return null;
        const byId = new Map(parsed.map((q) => [String(q?.id || ''), q]));
        return DEFAULT_QUESTS.map((q) => {
            const stored = byId.get(q.id);
            return stored ? { ...q, isCompleted: !!stored.isCompleted } : q;
        });
    } catch {
        return null;
    }
};

const persistQuests = (userId: string, quests: DailyQuest[]) => {
    try {
        localStorage.setItem(buildQuestStorageKey(userId), JSON.stringify(quests));
    } catch {
        // non-blocking
    }
};

const mergeQuestsByCompletion = (base: DailyQuest[], incoming: DailyQuest[]) => {
    const incomingById = new Map(incoming.map((q) => [q.id, q]));
    return base.map((quest) => {
        const remote = incomingById.get(quest.id);
        return remote ? { ...quest, isCompleted: quest.isCompleted || !!remote.isCompleted } : quest;
    });
};

export const ClientQuestsView: React.FC<{ user: User, updateUser: (u: User) => void }> = ({ user, updateUser }) => {
    const { go, back, notify} = useBuscadorFlow();
    const [quests, setQuests] = useState<DailyQuest[]>(() =>
        loadPersistedQuests(user) || (user.dailyQuests?.length ? user.dailyQuests : DEFAULT_QUESTS)
    );
    const [animatingId, setAnimatingId] = useState<string | null>(null);
    const [showAchievements, setShowAchievements] = useState(false);
    const [backendSyncLabel, setBackendSyncLabel] = useState<string | null>(
        user.grimoireMeta?.lastSyncedAt ? 'Sincronizado com backend' : null
    );

    const achievements = checkAchievements(user, CLIENT_ACHIEVEMENTS);
    const unlockedCount = getUnlockedCount(achievements);
    const rank = getUserRank(user.karma || 0, CLIENT_RANKS);
    const rankProgress = getRankProgress(user.karma || 0, CLIENT_RANKS);

    const completedCount = quests.filter(q => q.isCompleted).length;
    const totalReward = quests.reduce((sum, q) => sum + q.reward, 0);
    const earnedReward = quests.filter(q => q.isCompleted).reduce((sum, q) => sum + q.reward, 0);
    const progress = quests.length > 0 ? (completedCount / quests.length) * 100 : 0;
    const allComplete = completedCount === quests.length;

    useEffect(() => {
        const persisted = loadPersistedQuests(user);
        if (persisted) {
            setQuests(persisted);
            return;
        }
        if (user.dailyQuests?.length) {
            setQuests(user.dailyQuests);
            return;
        }
        setQuests(DEFAULT_QUESTS);
    }, [user.id]);

    useEffect(() => {
        let cancelled = false;
        const hydrateGamification = async () => {
            const latest = await api.users.getById(user.id);
            if (!latest || cancelled) return;

            const local = loadPersistedQuests(user);
            const serverQuests = Array.isArray(latest.dailyQuests) ? latest.dailyQuests : [];
            const mergedQuests = local
                ? mergeQuestsByCompletion(local, serverQuests)
                : (serverQuests.length ? mergeQuestsByCompletion(DEFAULT_QUESTS, serverQuests) : null);

            const nextAchievements = Array.isArray(latest.achievements) ? latest.achievements : user.achievements;
            if (mergedQuests) {
                setQuests(mergedQuests);
                persistQuests(user.id, mergedQuests);
            }

            updateUser({
                ...user,
                ...latest,
                dailyQuests: mergedQuests || latest.dailyQuests || user.dailyQuests,
                achievements: nextAchievements,
            });

            if (latest.grimoireMeta?.lastSyncedAt) {
                setBackendSyncLabel(`Backend sincronizado em ${new Date(latest.grimoireMeta.lastSyncedAt).toLocaleString('pt-BR')}`);
            } else {
                setBackendSyncLabel('Gamificação local (aguardando sync)');
            }
        };

        hydrateGamification().catch(() => {
            if (!cancelled) setBackendSyncLabel('Gamificação local (offline/degradado)');
        });
        return () => { cancelled = true; };
    }, [user.id]);

    useEffect(() => {
        if (!user?.id) return;
        persistQuests(user.id, quests);
    }, [user?.id, quests]);

    const persistGamificationSnapshot = async (nextUser: User, nextQuests: DailyQuest[], nextAchievements: Achievement[]) => {
        try {
            await api.users.update({
                ...nextUser,
                dailyQuests: nextQuests,
                achievements: nextAchievements,
            } as User);
        } catch {
            // non-blocking: local persistence remains source of UX continuity
        }
    };

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
            const nextAchievements = checkAchievements(updatedUser as User, CLIENT_ACHIEVEMENTS);
            updateUser({ ...(updatedUser as User), achievements: nextAchievements });
            persistQuests(user.id, updated);
            void persistGamificationSnapshot(updatedUser as User, updated, nextAchievements);
            setBackendSyncLabel('Sincronização pendente...');

            notify(`+${karmaGain} Karma`, `${quest.label} concluída!`, 'success');

            setTimeout(() => {
                setAnimatingId(null);
                go(route as any);
            }, 1200);
        }
    };

    return (
        <PortalView title="Missões do Dia" subtitle="JORNADA DIÁRIA" onBack={back}>
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
                        {backendSyncLabel && (
                            <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-amber-100/90">
                                {backendSyncLabel}
                            </p>
                        )}
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

                {/* Rank Badge */}
                <div className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${rank.bg}`}>
                                <Trophy size={22} className={rank.color} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-nature-400 uppercase tracking-[0.2em]">Seu Rank</p>
                                <h4 className={`text-lg font-serif italic ${rank.color}`}>Nível {rank.level}: {rank.name}</h4>
                            </div>
                        </div>
                        <span className="text-2xl font-serif italic text-amber-500">{user.karma || 0}</span>
                    </div>
                    <div className="w-full h-2 bg-nature-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-1000" style={{ width: `${rankProgress}%` }}></div>
                    </div>
                    <p className="text-[9px] text-nature-400 mt-2 text-right font-bold uppercase tracking-widest">
                        {rankProgress < 100 ? `${rankProgress}% para o próximo nível` : 'Nível máximo!'}
                    </p>
                </div>

                {/* Achievements Section */}
                <div className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden">
                    <button onClick={() => setShowAchievements(!showAchievements)} className="w-full p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Award size={20} className="text-amber-500" />
                            <div className="text-left">
                                <h4 className="font-bold text-nature-900">Conquistas</h4>
                                <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">{unlockedCount}/{achievements.length} desbloqueadas</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                                {achievements.filter(a => a.unlockedAt).slice(0, 4).map(a => (
                                    <span key={a.id} className="text-lg">{a.icon}</span>
                                ))}
                            </div>
                            <Zap size={16} className={`transition-transform ${showAchievements ? 'rotate-90' : ''} text-nature-300`} />
                        </div>
                    </button>

                    {showAchievements && (
                        <div className="px-6 pb-6 grid grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-300">
                            {achievements.map(a => (
                                <div key={a.id} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                                    a.unlockedAt 
                                        ? 'bg-amber-50 border-amber-100 shadow-sm' 
                                        : 'bg-nature-50 border-nature-50 opacity-40 grayscale'
                                }`}>
                                    <span className="text-2xl">{a.icon}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-nature-700 text-center leading-tight">{a.label}</span>
                                    <span className="text-[9px] text-nature-400 text-center">{a.description}</span>
                                    {!a.unlockedAt && <Lock size={10} className="text-nature-300" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PortalView>
    );
};
