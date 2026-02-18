import React, { useEffect, useState } from 'react';
import { User, DailyJournalEntry, MoodType } from '../../../types';
import { PortalView } from '../../../components/Common';
import { api } from '../../../services/api';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Book, Lock, TrendingUp, Calendar, Heart, ArrowRight, Video, Plus, Share2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateShareCanvas, shareToSocial } from '../../../src/utils/sharing';

export const SoulJournalView: React.FC<{ user: User }> = ({ user }) => {
    const { go, notify} = useBuscadorFlow();
    const [entries, setEntries] = useState<DailyJournalEntry[]>([]);
    const [stats, setStats] = useState<{ total: number; streak: number } | null>(null);
    const [loadingJournal, setLoadingJournal] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const list = await api.journal.list();
                setEntries(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                setStats({ total: list.length, streak: 0 });
            } catch {
                notify?.('Erro', 'Não foi possível carregar o diário.', 'warning');
            } finally {
                setLoadingJournal(false);
            }
        };
        load();
    }, [user.id]);

    const getMoodColor = (mood: MoodType) => {
        if (mood === 'VIBRANTE') return 'text-amber-500 bg-amber-50 border-amber-200';
        if (mood === 'SERENO' || mood === 'GRATO') return 'text-emerald-500 bg-emerald-50 border-emerald-200';
        if (mood === 'MELANCÓLICO') return 'text-blue-500 bg-blue-50 border-blue-200';
        return 'text-slate-500 bg-slate-50 border-slate-200';
    };

    const getMoodAccent = (mood: MoodType) => {
        if (mood === 'VIBRANTE') return '#f59e0b';
        if (mood === 'SERENO' || mood === 'GRATO') return '#10b981';
        if (mood === 'MELANCÓLICO') return '#3b82f6';
        if (mood === 'ANSIOSO') return '#64748b';
        if (mood === 'FOCADO') return '#6366f1';
        return '#334155';
    };

    const handleShareEntry = async (entry: DailyJournalEntry) => {
        try {
            const sameDaySnap = (user.snaps || []).find((snap) =>
                new Date(snap.date).toDateString() === new Date(entry.createdAt).toDateString()
            );
            const insight = entry.generatedPhrases?.[0] || entry.actionIntent || 'Hoje cuidei da minha jornada interior.';
            const gratitude = entry.generatedPhrases?.[1] || entry.gratitude || '';

            const blob = await generateShareCanvas({
                title: 'Diário da Alma',
                subtitle: `${entry.mood} • ${new Date(entry.createdAt).toLocaleDateString('pt-BR')}`,
                message: gratitude ? `${insight}\n${gratitude}` : insight,
                imageUrl: sameDaySnap?.image,
                accentColor: getMoodAccent(entry.mood),
                footer: 'VIVA360 • DIARIO',
                date: new Date(entry.createdAt).toLocaleDateString('pt-BR'),
                format: 'feed',
                mimeType: 'image/jpeg',
            });

            if (!blob) {
                notify('Compartilhamento', 'Não foi possível gerar o card para compartilhar.', 'error');
                return;
            }

            await shareToSocial(blob, {
                title: 'Diário da Alma • Viva360',
                text: `Espelho da Essência • ${entry.mood}\n${insight}\n\n#Viva360 #DiarioDaAlma`,
                platform: 'generic',
                filename: `viva360-diario-${entry.id}.jpg`,
            });
        } catch (error) {
            notify('Compartilhamento', 'Não foi possível compartilhar agora. Tente novamente.', 'error');
        }
    };

    return (
        <PortalView title="Diário da Alma" subtitle="MEMÓRIA EMOCIONAL" onBack={() => go('DASHBOARD')}>
            <div className="flex flex-col h-full bg-nature-50">
                
                {/* Header Metrics */}
                <div className="px-6 py-6 bg-white border-b border-nature-100 flex justify-between items-center shadow-sm z-10">
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-nature-400">Total</span>
                            <span className="text-2xl font-serif text-nature-900">{stats?.total || 0}</span>
                        </div>
                        <div className="w-px h-10 bg-nature-100" />
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-nature-400">Streak</span>
                            <span className="text-2xl font-serif text-emerald-600">{user.streak || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 relative">
                    {/* Timeline Line */}
                    <div className="absolute left-10 top-0 bottom-0 w-px bg-nature-200" />

                    {loadingJournal ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-nature-400">
                            <Loader2 size={28} className="animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Carregando diário...</span>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-50">
                            <Book size={48} className="text-nature-300" />
                            <p className="font-serif italic text-nature-900">Seu diário ainda está em branco.</p>
                            <p className="text-xs text-nature-500 max-w-xs">Complete rituais diários para preencher sua história automaticamente.</p>
                        </div>
                    ) : (
                        entries.map((entry, idx) => (
                            <motion.div 
                                key={entry.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative ml-10"
                            >
                                {/* Dot on timeline */}
                                <div className={`absolute -left-[45px] top-6 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getMoodColor(entry.mood).split(' ')[0].replace('text-', 'bg-')}`} />

                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-nature-100 space-y-4 relative overflow-hidden group hover:shadow-md transition-all">
                                    
                                    {/* Date & Mood Header */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-nature-900">
                                                {new Date(entry.createdAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </h3>
                                            <span className="text-xs text-nature-400 capitalize">
                                                {new Date(entry.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getMoodColor(entry.mood)}`}>
                                                {entry.mood}
                                            </div>
                                            <button 
                                                onClick={() => { handleShareEntry(entry); }}
                                                className="p-2 text-nature-300 hover:text-nature-600 transition-colors"
                                            >
                                                <Share2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid gap-4 pt-2">
                                    <div className="grid gap-4 pt-2">
                                        {/* Intention / Whisper 1 */}
                                        {(entry.generatedPhrases?.[0] || entry.actionIntent) && (
                                            <div className="bg-nature-50 rounded-2xl p-4 border border-nature-100">
                                                <div className="flex items-center gap-2 mb-2 text-nature-400 text-[10px] uppercase tracking-widest font-bold">
                                                    <TrendingUp size={12} /> {entry.generatedPhrases ? 'Sussurro da Intenção' : 'Intenção do Dia'}
                                                </div>
                                                <p className="text-nature-800 font-serif italic text-lg leading-relaxed">
                                                    "{entry.generatedPhrases ? entry.generatedPhrases[0] : entry.actionIntent}"
                                                </p>
                                            </div>
                                        )}

                                        {/* Gratitude / Whisper 2 */}
                                        {(entry.generatedPhrases?.[1] || entry.gratitude) && (
                                            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                                                <div className="flex items-center gap-2 mb-2 text-emerald-600/60 text-[10px] uppercase tracking-widest font-bold">
                                                    <Heart size={12} /> {entry.generatedPhrases ? 'Eco da Gratidão' : 'Gratidão'}
                                                </div>
                                                <p className="text-nature-800 text-sm leading-relaxed">
                                                    {entry.generatedPhrases ? entry.generatedPhrases[1] : entry.gratitude}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    </div>

                                    {/* Decorative Watermark */}
                                    <div className="absolute -bottom-4 -right-4 text-nature-50 opacity-50 transform rotate-12 pointer-events-none">
                                        <Book size={80} />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                 {/* FAB for manual entry (future) or prompt */}
                 <div className="p-6 bg-white border-t border-nature-100">
                     <p className="text-center text-xs text-nature-400 italic">
                         "Escrever é conversar consigo mesmo em silêncio."
                     </p>
                 </div>
            </div>
        </PortalView>
    );
};
