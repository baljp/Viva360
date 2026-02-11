import React, { useState } from 'react';
import { User } from '../../types';
import { Calendar, Plus, Clock, MapPin, Users, Edit3, Trash2, Eye, ChevronRight, Search, Filter } from 'lucide-react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { ZenToast, BottomSheet } from '../../components/Common';

interface SpaceEvent {
    id: string;
    title: string;
    date: string;
    time: string;
    room: string;
    capacity: number;
    enrolled: number;
    guardian: string;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    type: 'workshop' | 'retreat' | 'circle' | 'meditation';
    image: string;
}

export const SpaceEventsManager: React.FC<{ user: User }> = ({ user }) => {
    const { go, back } = useSantuarioFlow();
    const [toast, setToast] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
    const [selectedEvent, setSelectedEvent] = useState<SpaceEvent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [events] = useState<SpaceEvent[]>([
        { id: 'e1', title: 'Workshop Despertar Interior', date: '2026-02-15', time: '09:00', room: 'Sala Shanti', capacity: 15, enrolled: 12, guardian: 'Ana Luz', status: 'upcoming', type: 'workshop', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400' },
        { id: 'e2', title: 'Círculo de Cura Lunar', date: '2026-02-20', time: '19:00', room: 'Altar Zen', capacity: 20, enrolled: 18, guardian: 'Mariana Serenidade', status: 'upcoming', type: 'circle', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400' },
        { id: 'e3', title: 'Meditação Matinal', date: '2026-02-08', time: '06:30', room: 'Altar Zen', capacity: 30, enrolled: 22, guardian: 'Carlos Paz', status: 'completed', type: 'meditation', image: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?q=80&w=400' },
        { id: 'e4', title: 'Retiro Silêncio Sagrado', date: '2026-03-01', time: '08:00', room: 'Espaço Completo', capacity: 10, enrolled: 7, guardian: 'Ana Luz', status: 'upcoming', type: 'retreat', image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=400' },
    ]);

    const filtered = events.filter(e => filter === 'all' || e.status === filter);

    React.useEffect(() => { const t = setTimeout(() => setIsLoading(false), 600); return () => clearTimeout(t); }, []);

    const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
        upcoming: { label: 'Próximo', color: 'text-indigo-700', bg: 'bg-indigo-50' },
        ongoing: { label: 'Em Andamento', color: 'text-emerald-700', bg: 'bg-emerald-50' },
        completed: { label: 'Concluído', color: 'text-nature-500', bg: 'bg-nature-50' },
        cancelled: { label: 'Cancelado', color: 'text-rose-700', bg: 'bg-rose-50' },
    };

    const typeCfg: Record<string, string> = {
        workshop: '🎨 Workshop', retreat: '🏔️ Retiro', circle: '🌙 Círculo', meditation: '🧘 Meditação',
    };

    return (
        <div className="min-h-screen bg-[#f8faf9] pb-32">
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            <header className="bg-gradient-to-br from-indigo-900 to-purple-900 px-6 pt-14 pb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <button onClick={back} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white mb-6 active:scale-95">←</button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-serif italic text-white">Eventos</h1>
                        <p className="text-indigo-200/70 text-xs font-bold uppercase tracking-widest mt-1">Ritmos do Calendário Sagrado</p>
                    </div>
                    <button onClick={() => go('EVENT_CREATE')} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-95 transition-all"><Plus size={22} /></button>
                </div>
            </header>

            {/* Filters */}
            <div className="px-4 -mt-4 mb-4">
                <div className="flex p-1 bg-white rounded-2xl border border-nature-100 shadow-sm">
                    {(['all', 'upcoming', 'completed'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-nature-900 text-white shadow-md' : 'text-nature-400'}`}>
                            {f === 'all' ? 'Todos' : f === 'upcoming' ? 'Próximos' : 'Concluídos'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-nature-100 text-center">
                        <span className="text-xl font-bold text-nature-900">{events.filter(e => e.status === 'upcoming').length}</span>
                        <p className="text-[9px] font-bold text-nature-400 uppercase mt-1">Próximos</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-nature-100 text-center">
                        <span className="text-xl font-bold text-nature-900">{events.reduce((a, e) => a + e.enrolled, 0)}</span>
                        <p className="text-[9px] font-bold text-nature-400 uppercase mt-1">Inscritos</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-nature-100 text-center">
                        <span className="text-xl font-bold text-emerald-600">{Math.round(events.reduce((a, e) => a + (e.enrolled/e.capacity), 0) / events.length * 100)}%</span>
                        <p className="text-[9px] font-bold text-nature-400 uppercase mt-1">Ocupação</p>
                    </div>
                </div>

                {/* Event Cards */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="bg-white rounded-[2.5rem] overflow-hidden border border-nature-100 shadow-sm animate-pulse">
                                <div className="h-32 bg-nature-100"></div>
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-nature-100 rounded w-3/4"></div>
                                    <div className="h-3 bg-nature-100 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.map(ev => {
                    const cfg = statusCfg[ev.status];
                    const pct = Math.round((ev.enrolled / ev.capacity) * 100);
                    return (
                        <div key={ev.id} onClick={() => setSelectedEvent(ev)} className="bg-white rounded-[2.5rem] overflow-hidden border border-nature-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
                            <div className="relative h-32">
                                <img src={ev.image} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-white/90 text-nature-700">{typeCfg[ev.type]}</span>
                                </div>
                                <div className="absolute bottom-3 left-4">
                                    <h3 className="text-white font-bold text-sm">{ev.title}</h3>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-nature-500 text-xs">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(ev.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                        <span className="flex items-center gap-1"><Clock size={12} /> {ev.time}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {ev.room}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-nature-400" />
                                        <span className="text-xs text-nature-600 font-bold">{ev.enrolled}/{ev.capacity}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-nature-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-nature-500">{pct}%</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-nature-400">Guardião: <span className="font-bold text-nature-600">{ev.guardian}</span></p>
                            </div>
                        </div>
                    );
                })}

                {!isLoading && filtered.length === 0 && (
                    <div className="text-center py-16">
                        <Calendar size={48} className="text-nature-200 mx-auto mb-4" />
                        <p className="text-nature-400 text-sm font-bold">Nenhum evento nesta categoria</p>
                    </div>
                )}
            </div>

            {/* Event Detail Sheet */}
            <BottomSheet isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title || ''}>
                {selectedEvent && (
                    <div className="space-y-6 pb-12">
                        <img src={selectedEvent.image} className="w-full h-40 object-cover rounded-2xl" />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-nature-50 p-4 rounded-2xl"><p className="text-[9px] font-bold text-nature-400 uppercase">Data</p><p className="font-bold text-nature-900 text-sm">{new Date(selectedEvent.date).toLocaleDateString('pt-BR')}</p></div>
                            <div className="bg-nature-50 p-4 rounded-2xl"><p className="text-[9px] font-bold text-nature-400 uppercase">Horário</p><p className="font-bold text-nature-900 text-sm">{selectedEvent.time}</p></div>
                            <div className="bg-nature-50 p-4 rounded-2xl"><p className="text-[9px] font-bold text-nature-400 uppercase">Local</p><p className="font-bold text-nature-900 text-sm">{selectedEvent.room}</p></div>
                            <div className="bg-nature-50 p-4 rounded-2xl"><p className="text-[9px] font-bold text-nature-400 uppercase">Vagas</p><p className="font-bold text-nature-900 text-sm">{selectedEvent.enrolled}/{selectedEvent.capacity}</p></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setSelectedEvent(null); setToast({ title: 'Evento Editado', message: 'Alterações salvas.', type: 'success' }); }} className="flex-1 py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs active:scale-95 flex items-center justify-center gap-2"><Edit3 size={14} /> Editar</button>
                            <button onClick={() => { setSelectedEvent(null); setToast({ title: 'Evento Cancelado', message: 'Os inscritos serão notificados.', type: 'warning' }); }} className="py-4 px-6 bg-rose-50 text-rose-600 rounded-2xl font-bold uppercase tracking-widest text-xs border border-rose-100 active:scale-95"><Trash2 size={14} /></button>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </div>
    );
};
