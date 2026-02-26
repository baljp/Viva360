import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Users, MapPin, Loader2, Smartphone } from 'lucide-react';
import { ViewState, Professional } from '../../types';
import { PortalView } from '../../components/Common';
import { api } from '../../services/api';

type SpaceCalendarFlow = {
    go: (state: string) => void;
};

type SpaceEventApiRow = {
    id?: string | number;
    start_time?: string;
    startTime?: string;
    date?: string;
    title?: string;
    type?: string;
    details?: string;
};

type CalendarEvent = {
    id: string;
    time: string;
    client: string;
    proId: string | null;
    proName: string;
    status: 'confirmed' | 'pending';
    room: string;
    startDate: Date;
    duration?: string;
};

interface SpaceCalendarProps {
    team: Professional[];
    setView: (v: ViewState) => void;
    flow: SpaceCalendarFlow;
}

export const SpaceCalendar: React.FC<SpaceCalendarProps> = ({ team, setView, flow }) => {
     const [filterPro, setFilterPro] = useState<string>('all');
     const [loading, setLoading] = useState(true);
     const [syncing, setSyncing] = useState(false);
     const [events, setEvents] = useState<CalendarEvent[]>([]);

     useEffect(() => {
        let mounted = true;
        const loadEvents = async () => {
            setLoading(true);
            try {
                const rows = await api.spaces.getEvents();
                if (!mounted) return;
                const normalized: CalendarEvent[] = (Array.isArray(rows) ? (rows as SpaceEventApiRow[]) : []).map((event) => {
                    const startDate = new Date(event.start_time || event.startTime || event.date || Date.now());
                    const time = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return {
                        id: String(event.id || `evt_${Math.random()}`),
                        time,
                        client: String(event.title || 'Evento'),
                        proId: null,
                        proName: 'Equipe Viva360',
                        duration: event.duration ? `${event.duration} min` : undefined,
                        status: String(event.type || '').includes('block') ? 'confirmed' : 'pending',
                        room: String(event.details || 'Agenda do Santuário'),
                        startDate,
                    };
                });
                setEvents(normalized);
            } catch {
                if (!mounted) return;
                setEvents([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadEvents();
        return () => { mounted = false; };
     }, []);

     const filteredApps = useMemo(() => {
        if (filterPro === 'all') return events;
        return events.filter((event) => !event.proId || event.proId === filterPro);
     }, [events, filterPro]);

     const cycleFilter = () => {
         const ids = ['all', ...team.map((member) => member.id)];
         const currentIndex = ids.indexOf(filterPro);
         const nextIndex = currentIndex >= 0 && currentIndex < ids.length - 1 ? currentIndex + 1 : 0;
         setFilterPro(ids[nextIndex] || 'all');
     };

     const handleSyncCalendar = async () => {
        if (syncing) return;
        setSyncing(true);
        try {
            const sync = await api.spaces.syncCalendar();
            const icsContent = String(sync?.data || '').trim();
            if (!icsContent) return;
            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = String(sync?.filename || 'viva360-calendar.ics');
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } finally {
            setSyncing(false);
        }
     };

     return (
        <PortalView 
            title="Agenda do Santuário" 
            subtitle="VISÃO UNIFICADA" 
            onBack={() => flow.go('EXEC_DASHBOARD')}
            footer={
                <div className="flex gap-2">
                     <button onClick={() => flow.go('AGENDA_EDIT')} className="flex-1 py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px]">Novo Agendamento</button>
                     <button onClick={handleSyncCalendar} className="p-4 bg-white border border-nature-100 rounded-2xl text-nature-400" title="Sincronizar calendário">{syncing ? <Loader2 size={20} className="animate-spin" /> : <Smartphone size={20} />}</button>
                     <button onClick={cycleFilter} className="p-4 bg-white border border-nature-100 rounded-2xl text-nature-400"><Filter size={20}/></button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-3xl border border-nature-100 shadow-sm">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2 mb-2 block">Filtrar por Guardião</label>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        <button 
                            onClick={() => setFilterPro('all')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${filterPro === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-nature-50 text-nature-500 border-nature-100'}`}
                        >
                            Todos
                        </button>
                        {team.map((t) => (
                             <button 
                                key={t.id}
                                onClick={() => setFilterPro(t.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${filterPro === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-nature-50 text-nature-500 border-nature-100'}`}
                            >
                                {t.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Hoje, {new Date().toLocaleDateString('pt-BR')}</h4>
                    {loading ? (
                        <div className="p-10 text-center opacity-50 flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" /> Carregando agenda...
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="p-10 text-center opacity-50">Nenhum agendamento encontrado para este filtro.</div>
                    ) : filteredApps.map((app) => (
                        <div key={app.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 flex gap-4 items-center shadow-sm relative overflow-hidden group">
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500"></div>
                             <div className="pl-4">
                                <p className="text-xl font-serif italic text-nature-900">{app.time}</p>
                                <p className="text-[9px] font-bold uppercase text-nature-300">{app.duration || '—'}</p>
                             </div>
                             <div className="flex-1 border-l border-nature-100 pl-4 bg-nature-50/50 rounded-r-2xl py-2">
                                 <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-nature-900 text-sm">{app.client}</h4>
                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg ${app.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{app.status}</span>
                                </div>
                                <p 
                                    className="text-[10px] text-nature-500 mt-1 flex items-center gap-1 cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        flow.go('PRO_PROFILE');
                                    }}
                                >
                                    <Users size={10}/> {app.proName}
                                </p>
                                <p className="text-[10px] text-indigo-500 mt-0.5 flex items-center gap-1 font-bold"><MapPin size={10}/> {app.room}</p>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </PortalView>
     );
}
