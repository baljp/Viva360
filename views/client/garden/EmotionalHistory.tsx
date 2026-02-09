import React from 'react';
import { User } from '../../../types';
import { PortalView } from '../../../components/Common';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { api } from '../../../services/api';
import { gardenService } from '../../../services/gardenService';
import { Calendar as CalendarIcon, Filter, Search } from 'lucide-react';
import { SoulCard } from '../../../src/components/SoulCard';

export const EmotionalHistory: React.FC<{ user: User }> = ({ user }) => {
    const { go } = useBuscadorFlow();
    const [snaps, setSnaps] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [query, setQuery] = React.useState('');
    const [sortMode, setSortMode] = React.useState<'newest' | 'oldest'>('newest');

    React.useEffect(() => {
        api.metamorphosis.getEvolution().then(res => {
            const entries = res.entries || [];
            // Map common fields and ensure valid dates
            const mapped = entries.map((e: any) => ({
                ...e,
                image: e.image || e.photoThumb || '',
                date: e.timestamp || e.date || new Date().toISOString()
            }));
            setSnaps(mapped);
            setIsLoading(false);
        }).catch(err => {
            console.error("Evolution History Error:", err);
            setIsLoading(false);
        });
    }, []);

    const filteredSnaps = React.useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const list = snaps.filter((snap) => {
            if (!normalizedQuery) return true;
            const text = `${snap.note || ''} ${snap.mood || ''} ${snap.timeSlot || ''}`.toLowerCase();
            return text.includes(normalizedQuery);
        });

        return list.sort((left, right) => {
            const leftDate = new Date(left.date).getTime();
            const rightDate = new Date(right.date).getTime();
            return sortMode === 'newest' ? rightDate - leftDate : leftDate - rightDate;
        });
    }, [snaps, query, sortMode]);

    const handleToggleSort = () => {
        setSortMode((current) => (current === 'newest' ? 'oldest' : 'newest'));
    };

    return (
        <PortalView title="Histórico" subtitle="MEMÓRIAS DO SER" onBack={() => go('EVOLUTION')} heroImage="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800">
            <div className="flex flex-col h-full bg-nature-50/20 px-6 pt-8 pb-32">
                
                {/* Search & Filter Bar */}
                <div className="flex gap-3 mb-8">
                    <div className="flex-1 bg-white px-5 py-4 rounded-2xl border border-white shadow-sm flex items-center gap-3">
                        <Search size={18} className="text-nature-400" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} type="text" placeholder="Buscar sentimento..." className="bg-transparent border-none text-sm focus:ring-0 placeholder:text-nature-300 w-full" />
                    </div>
                    <button onClick={handleToggleSort} className="w-14 h-14 bg-white rounded-2xl border border-white shadow-sm flex items-center justify-center text-nature-600 active:scale-95 transition-all" title={sortMode === 'newest' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}>
                        <Filter size={20} />
                    </button>
                </div>

                <div className="relative">
                    {/* Visual Vertical Line */}
                    <div className="absolute left-7 top-0 bottom-0 w-[1px] bg-nature-200 z-0" />

                    <div className="space-y-10 relative z-10">
                        {filteredSnaps.map((snap, idx) => {
                            const date = new Date(snap.date);
                            const isValid = !isNaN(date.getTime());
                            const day = isValid ? date.getDate() : '--';
                            const month = isValid ? date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase() : '---';
                            
                            return (
                                <div key={snap.id} className="flex gap-6 group">
                                    {/* Date Column */}
                                    <div className="flex-none flex flex-col items-center">
                                        <div className="w-14 h-14 rounded-2xl bg-white border border-nature-100 shadow-sm flex flex-col items-center justify-center group-hover:bg-nature-900 group-hover:text-white transition-all duration-500">
                                            <span className="text-lg font-black leading-none">{day}</span>
                                            <span className="text-[8px] font-black tracking-widest leading-none mt-1 opacity-60">{month}</span>
                                        </div>
                                    </div>

                                    {/* Card Column */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest">{snap.timeSlot || 'Ritual'}</p>
                                        </div>
                                        <SoulCard snap={snap} />
                                    </div>
                                </div>
                            );
                        })}

                        {!isLoading && filteredSnaps.length === 0 && (
                            <div className="py-32 text-center">
                                <div className="w-20 h-20 bg-nature-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 opacity-50">📅</div>
                                <h4 className="font-serif italic text-lg text-nature-400">Silêncio Interior</h4>
                                <p className="text-xs text-nature-300 font-medium px-12 mt-2">{query ? 'Nenhum registro encontrado para o filtro informado.' : 'Sua jornada de memórias aparecerá aqui conforme você realizar seus rituais.'}</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </PortalView>
    );
};
