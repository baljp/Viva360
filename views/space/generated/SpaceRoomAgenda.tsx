import React, { useEffect, useState } from 'react';
import { useSantuarioFlow } from '../../../src/flow/useSantuarioFlow';
import { PortalView } from '../../../components/Common';
import { Calendar, Clock, User, Plus, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { api } from '../../../services/api';

type RoomEvent = {
    id: string | number;
    time: string;
    title: string;
    host: string;
    type: string;
    endTime?: string;
};

const normalizeEvents = (raw: unknown[], roomId: string | null): RoomEvent[] => {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter((e: unknown) => { const ev = e as Record<string, unknown>; return !roomId || !ev.roomId || String(ev.roomId) === String(roomId); })
        .map((e: unknown) => { const ev = e as Record<string, unknown>; return {
            id: (ev.id as string | number) || Math.random(),
            time: String(ev.start_time || ev.startTime || ev.time || '—'),
            endTime: String(ev.end_time || ev.endTime || ''),
            title: String(ev.title || ev.name || ev.service_name || 'Evento'),
            host: String(ev.host || ev.organizer || ev.professional_name || ev.guardian || 'Santuário'),
            type: String(ev.type || ev.eventType || 'Ritual'),
        }; })
        .sort((a, b) => a.time.localeCompare(b.time));
};

export default function SpaceRoomAgenda() {
    const { state, back, go, notify } = useSantuarioFlow();
    const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    const selected = state.data.rooms?.find(r => r.id === state.selectedRoomId) ?? null;
    const roomName = (selected as { name?: string; imageUrl?: string } | null)?.name || 'Altar';
    const hero = (selected as { name?: string; imageUrl?: string } | null)?.imageUrl || 'https://images.unsplash.com/photo-1596131397935-33ec8a7e0892?q=80&w=600';
    const [events, setEvents] = useState<RoomEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                if (!state.selectedRoomId) return;
                const data = await api.spaces.getRoomAgenda(state.selectedRoomId);
                if (!cancelled) setEvents(normalizeEvents(Array.isArray(data) ? data : [], state.selectedRoomId));
            } catch {
                if (!cancelled) { notify('Aviso', 'Não foi possível carregar a agenda deste altar.', 'warning'); setEvents([]); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [state.selectedRoomId]);

    return (
        <PortalView title="Agenda do Altar" subtitle="FLUXO DE ENERGIA" onBack={back} heroImage={hero}>
            <div className="space-y-6 px-2">
                <div className="bg-nature-900 text-white p-6 rounded-[2.5rem] relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
                    <h3 className="font-serif italic text-2xl relative z-10">{roomName}</h3>
                    <p className="text-white/50 text-xs mt-1 relative z-10 flex items-center gap-1.5"><Calendar size={11} /> {todayLabel}</p>
                </div>

                <button onClick={() => go('EVENT_CREATE')} className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-indigo-700">
                    <Plus size={16} /> Criar Evento neste Altar
                </button>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-1">Rituais do Dia</h4>
                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin text-nature-300" /></div>
                    ) : events.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] border border-dashed border-nature-200 p-10 text-center space-y-4">
                            <Sparkles size={28} className="mx-auto text-nature-300" />
                            <p className="text-xs text-nature-400 italic">Nenhum ritual agendado para hoje.</p>
                            <button onClick={() => go('EVENT_CREATE')} className="px-6 py-3 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all">Criar Primeiro Ritual</button>
                        </div>
                    ) : events.map((evt) => (
                        <div key={evt.id} onClick={() => go('EVENTS_MANAGE')} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all cursor-pointer">
                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-nature-50 rounded-2xl shrink-0 group-hover:bg-indigo-50 transition-colors">
                                <Clock size={14} className="mb-0.5 opacity-50" />
                                <span className="text-[10px] font-bold text-center leading-tight">{evt.time.slice(0, 5)}</span>
                                {evt.endTime && <span className="text-[8px] text-nature-300 font-bold">{evt.endTime.slice(0, 5)}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-nature-900 text-sm truncate">{evt.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <User size={10} className="text-nature-400" />
                                    <p className="text-[10px] text-nature-500 uppercase font-bold truncate">{evt.host}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-nature-50 text-nature-400 rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">{evt.type}</span>
                                <ChevronRight size={14} className="text-nature-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={() => go('AGENDA_OVERVIEW')} className="w-full py-4 bg-white border border-nature-100 rounded-[2rem] text-xs font-bold text-nature-500 uppercase tracking-widest active:scale-95 transition-all hover:border-nature-200">
                    Ver Calendário Completo
                </button>
            </div>
        </PortalView>
    );
}
