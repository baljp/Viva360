import React, { useEffect, useState } from 'react';
import { useSantuarioFlow } from '../../src/flow/useSantuarioFlow';
import { PortalView } from '../../components/Common';
import { Plus, Edit3, Image as ImageIcon, ChevronRight, Calendar, Settings, Clock, Users, Sun, PenTool, CheckCircle, AlertTriangle, Hammer } from 'lucide-react';
import { SpaceRoom, RoomAllocationDTO } from '../../types';
import { TEST_ROOMS } from '../../src/data/test';

// Shape of TEST_ROOMS entries (dev-only fallback)
interface TestRoom {
  id: string;
  name: string;
  capacity: number;
  current: number;
  status: 'Livre' | 'Ocupado' | 'Manutenção';
  dailyOccupancy: number;
  nextUse?: string | null;
  currentEvent?: string;
  returnDate?: string;
  image?: string;
}

// Extended view model — adds display-only fields on top of RoomAllocationDTO
interface RoomViewDTO extends RoomAllocationDTO {
  image?: string;
  dailyOccupancy?: number;
  nextUse?: string;
  returnDate?: string;
}

// Shape of calendar events from state.data.events
interface CalendarEventLike {
  id?: string;
  roomId?: string;
  title?: string;
  start?: string;
  end?: string;
  date?: string;
  [key: string]: unknown;
}

export const SpaceRooms: React.FC<{ refreshData?: () => void }> = ({ refreshData }) => {
    const { state, go, selectRoom, notify } = useSantuarioFlow();

    useEffect(() => {
        // Best-effort refresh when the screen mounts (e.g. after editing a room).
        refreshData?.();
    }, [refreshData]);

    // Fallback visual apenas em ambiente dev (sufixo [Demo] indica dado não-real)
    const fallbackRooms: RoomViewDTO[] = import.meta.env.VITE_MOCK_ENABLED === 'true'
        ? (TEST_ROOMS as TestRoom[]).map(r => ({
            roomId: String(r.id),
            roomName: String(r.name),
            status: (r.status as RoomAllocationDTO['status']) ?? 'Livre',
            capacity: Number(r.capacity || 1),
            image: r.image,
            dailyOccupancy: r.dailyOccupancy,
            nextUse: r.nextUse ?? undefined,
            returnDate: r.returnDate,
            currentEvent: r.currentEvent,
        }))
        : [];

    const rooms: RoomViewDTO[] = (Array.isArray(state.data.rooms) && state.data.rooms.length > 0)
        ? state.data.rooms.map((r: SpaceRoom): RoomViewDTO => ({
            roomId: r.id,
            roomName: r.name,
            capacity: r.capacity || 1,
            // Normalize backend status to UI labels.
            status: String(r.status || '').toLowerCase() === 'occupied'
                ? 'Ocupado'
                : String(r.status || '').toLowerCase() === 'maintenance'
                    ? 'Manutenção'
                    : 'Livre',
            currentEvent: r.currentOccupant || undefined,
            image: r.imageUrl || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=600',
        }))
        : fallbackRooms;

    // C5-FIX: Timeline derived from real events in context (populated by SpaceCalendar via api.spaces.getEvents)
    const todayKey = new Date().toISOString().slice(0, 10);
    const stateData = state.data as { events?: CalendarEventLike[] };
    const rawEvents: CalendarEventLike[] = Array.isArray(stateData?.events) ? stateData.events : [];
    const timeline = rawEvents
        .filter((e: CalendarEventLike) => {
            const d = (e.start_time as string | undefined) || (e.startTime as string | undefined) || String(e.date || '');
            return String(d).slice(0, 10) === todayKey;
        })
        .slice(0, 5)
        .map((e: CalendarEventLike) => ({
            time: String((e.start_time as string | undefined) || (e.startTime as string | undefined) || (e.time as string | undefined) || '—').slice(11, 16) || '—',
            room: String((e.room_name as string | undefined) || (e.roomName as string | undefined) || rooms.find((r) => r.roomId === e.roomId)?.roomName || 'Altar'),
            event: String(e.title || e.name || (e.service_name as string | undefined) || 'Evento'),
        }));

    const handleAction = (action: string) => {
        notify('Ação Iniciada', `Processando: ${action}`, 'info');
    };

    return (
        <PortalView title="Mundo Físico" subtitle="GESTÃO DE ESPAÇOS" onBack={() => go('EXEC_DASHBOARD')} heroImage="https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800">

            <div className="space-y-6">

                {/* 1. HEADER EXECUTIVO */}
                <div className="bg-nature-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-2xl -mt-6 z-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-nature-700 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-serif italic mb-2">Altares Sagrados</h3>
                        <p className="text-nature-200 text-xs mb-6 max-w-xs">Gerencie a energia e ocupação dos seus espaços de cura.</p>

                        <div className="flex flex-wrap gap-4">
                            {[
                                { label: 'Ativos', val: 4, icon: Sun, color: 'text-amber-400' },
                                { label: 'Livres', val: 2, icon: CheckCircle, color: 'text-emerald-400' },
                                { label: 'Em uso', val: 1, icon: Users, color: 'text-rose-400' },
                                { label: 'Manutenção', val: 1, icon: Hammer, color: 'text-nature-400' },
                            ].map(s => (
                                <div key={s.label} className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                                    <s.icon size={14} className={s.color} />
                                    <div className="flex flex-col leading-none">
                                        <span className="text-lg font-bold">{s.val}</span>
                                        <span className="text-[9px] uppercase font-bold text-white/60">{s.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. CARDS DOS ALTARES */}
                <div className="space-y-4">
                    {rooms.map(room => (
                        <div key={room.roomId} className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden p-1">
                            <div className="flex gap-4 p-4 items-start">
                                <div className="w-20 h-20 rounded-2xl bg-nature-100 overflow-hidden shrink-0">
                                    <img src={room.image} className="w-full h-full object-cover" alt={room.roomName || 'Altar'} />
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-serif italic text-lg text-nature-900 leading-tight">{room.roomName}</h4>
                                            <p className="text-[9px] uppercase font-bold text-nature-400 tracking-widest mt-0.5">Capacidade: {room.capacity} Almas</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border ${room.status === 'Livre' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            room.status === 'Ocupado' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-stone-50 text-stone-600 border-stone-100'
                                            }`}>
                                            {room.status === 'Livre' ? `🟢 ${room.status}` :
                                                room.status === 'Ocupado' ? `🟠 ${room.status}` :
                                                    `🔧 ${room.status}`}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <div className="p-2 bg-nature-50 rounded-xl">
                                            <p className="text-[9px] font-bold text-nature-400 uppercase">Ocupação Hoje</p>
                                            <p className="text-xs font-bold text-nature-900">{room.dailyOccupancy || 0}%</p>
                                        </div>
                                        <div className="p-2 bg-nature-50 rounded-xl">
                                            <p className="text-[9px] font-bold text-nature-400 uppercase">
                                                {room.status === 'Livre' ? 'Próximo Uso' : room.status === 'Ocupado' ? 'Evento Atual' : 'Retorno'}
                                            </p>
                                            <p className="text-xs font-bold text-nature-900 truncate">
                                                {room.status === 'Livre' ? (room.nextUse || '—') : room.status === 'Ocupado' ? (room.currentEvent || 'Em andamento') : (room.returnDate || '—')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1 px-4 pb-4">
                                <button
                                    onClick={() => { selectRoom(String(room.roomId)); go('ROOM_AGENDA'); }}
                                    className="py-2.5 bg-white border border-nature-100 rounded-xl text-[10px] font-bold text-nature-600 uppercase hover:bg-nature-50 transition-colors"
                                >
                                    {room.status === 'Ocupado' ? 'Ver Evento' : 'Ver Agenda'}
                                </button>
                                <button
                                    onClick={() => { selectRoom(String(room.roomId)); go('ROOM_EDIT'); }}
                                    className="py-2.5 bg-nature-900 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-black transition-colors"
                                >
                                    Editar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. AGENDA DOS ALTARES (HOJE) */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={14} /> Agenda Hoje</h4>
                        <button onClick={() => go('AGENDA_OVERVIEW')} className="text-[10px] font-bold text-indigo-600 hover:underline">Ver Semanal</button>
                    </div>
                    <div className="space-y-3">
                        {timeline.length === 0 ? (
                            <p className="text-center text-xs text-nature-300 italic py-4">Sem eventos programados para hoje. Crie um evento para começar.</p>
                        ) : timeline.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-nature-50/50 rounded-xl">
                                <div className="px-2 py-1 bg-white rounded-lg text-[9px] font-bold text-nature-500 shadow-sm font-mono whitespace-nowrap">{item.time}</div>
                                <div className="w-px h-6 bg-nature-200"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-nature-900 truncate">{item.room}</p>
                                    <p className="text-[9px] text-nature-500 truncate">{item.event}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. CAPACIDADE & OTIMIZAÇÃO */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={14} /> Capacidade do Santuário</h4>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center">
                            <span className="block text-xl font-bold text-nature-900">120h</span>
                            <span className="text-[9px] font-bold text-nature-400 uppercase">Total/Sem</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-indigo-600">89h</span>
                            <span className="text-[9px] font-bold text-indigo-400 uppercase">Ocupadas</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-emerald-600">31h</span>
                            <span className="text-[9px] font-bold text-emerald-400 uppercase">Livres</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-2xl border border-amber-100">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0 text-amber-600"><AlertTriangle size={16} /></div>
                        <p className="text-[10px] text-nature-600 leading-tight"><strong>Sugestão:</strong> Abrir 2 novos horários noturnos para aumentar fluxo.</p>
                    </div>
                </div>

                {/* 5. EVENTOS COLETIVOS */}
                <div className="bg-indigo-900 p-6 rounded-[2.5rem] text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-30"></div>
                    <h4 className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10"><Users size={14} /> Eventos Coletivos</h4>
                    <p className="text-xs text-indigo-100 mb-4 opacity-80 relative z-10">Crie retiros, aulas em grupo e rituais coletivos.</p>
                    <div className="flex gap-2 relative z-10">
                        <button onClick={() => go('EVENT_CREATE')} className="flex-1 py-3 bg-white text-indigo-900 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <Plus size={14} /> Criar Evento
                        </button>
                        <button onClick={() => go('RETREATS_MANAGE')} className="px-4 py-3 bg-indigo-800 text-indigo-100 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all border border-indigo-700">
                            Retiros
                        </button>
                    </div>
                </div>

                {/* 6. CONSECRATE ALTAR */}
                <button
                    onClick={() => go('ROOM_CREATE')}
                    className="w-full py-5 bg-gradient-to-r from-amber-200 to-amber-100 text-amber-900 rounded-[2.5rem] font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm border border-amber-200 active:scale-[0.98] transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center"><Plus size={16} /></div>
                    Consagrar Novo Altar
                </button>
            </div>
        </PortalView>
    );
};
