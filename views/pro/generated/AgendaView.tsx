import React, { useMemo, useState } from 'react';
import { useGuardiaoFlow } from '../../../src/flow/useGuardiaoFlow';
import { Video, MoreHorizontal, Loader2, Smartphone } from 'lucide-react';
import { PortalView } from '../../../components/Common';
import { api } from '../../../services/api';

type RawAppointment = {
  id?: string | number;
  date?: string;
  start_time?: string;
  time?: string;
  clientName?: string;
  client_name?: string;
  client?: string;
  serviceName?: string;
  service_name?: string;
  type?: string;
  status?: string;
};

type AgendaAppointment = RawAppointment & {
  id: string | number;
  dateKey: string;
  time: string;
  client: string;
  serviceName: string;
  status: string;
};

export default function AgendaView() {
  const { go, back, selectAppointment, notify, state } = useGuardiaoFlow();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const toLocalDateKey = (input: string | Date) => {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return String(input).slice(0, 10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const weekDays = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(base);
      date.setHours(0, 0, 0, 0);
      date.setDate(base.getDate() + index);
      return date;
    });
  }, []);

  const selectedDay = weekDays[Math.min(selectedDayIndex, weekDays.length - 1)] || new Date();
  const selectedDayKey = toLocalDateKey(selectedDay);

  const appointments: AgendaAppointment[] = (Array.isArray(state?.data?.appointments) ? state.data.appointments as RawAppointment[] : [])
    .map((apt) => ({
      ...apt,
      id: apt.id ?? `${selectedDayKey}-${Math.random().toString(36).slice(2, 8)}`,
      dateKey: toLocalDateKey(apt.date || apt.start_time || new Date()),
      time: String(apt.time || new Date(apt.date || apt.start_time || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
      client: String(apt.clientName || apt.client_name || apt.client || 'Buscador'),
      serviceName: String(apt.serviceName || apt.service_name || apt.type || 'Atendimento'),
      status: String(apt.status || 'pending').toLowerCase(),
    }))
    .filter((apt) => apt.dateKey === selectedDayKey)
    .sort((a, b) => a.time.localeCompare(b.time));

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
    <PortalView title="Agenda de Luz" subtitle="SEUS RITUAIS" onBack={back} heroImage="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800">
       <div className="space-y-6 px-2">
           {/* Date Selector */}
           <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
               {weekDays.map((day, i) => (
                   <button key={day.toISOString()} onClick={() => setSelectedDayIndex(i)} className={`flex flex-col items-center justify-center min-w-[3.5rem] aspect-[3/4] rounded-2xl border transition-all ${i === selectedDayIndex ? 'bg-nature-900 text-white border-nature-900 shadow-xl' : 'bg-white text-nature-400 border-nature-100 hover:border-nature-300'}`}>
                       <span className="text-[10px] font-bold uppercase">{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()}</span>
                       <span className="text-lg font-bold">{day.getDate()}</span>
                   </button>
               ))}
           </div>

           <button
             onClick={handleSyncCalendar}
             className="w-full py-3 bg-white border border-nature-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-nature-500 flex items-center justify-center gap-2"
           >
             {syncing ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
             Sincronizar Agenda no Dispositivo
           </button>

           <div className="space-y-4">
               <h3 className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.2em] px-2">Rituais de Hoje</h3>
               {appointments.length === 0 ? (
                   <div className="bg-white p-6 rounded-[2rem] border border-nature-100 text-center text-[11px] text-nature-400">
                       Nenhum ritual para {selectedDay.toLocaleDateString('pt-BR')}.
                   </div>
               ) : appointments.map((apt) => (
                   <div key={apt.id} className="bg-white p-5 rounded-[2rem] border border-nature-100 flex items-center justify-between shadow-sm group hover:shadow-md transition-all cursor-pointer" onClick={() => go('PATIENT_PROFILE')}>
                       <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs ${apt.status === 'confirmed' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'}`}>
                               {apt.time}
                           </div>
                           <div>
                               <h4 className="text-sm font-bold text-nature-900">{apt.client}</h4>
                               <p className="text-[10px] text-nature-400 font-bold uppercase tracking-wide">{apt.serviceName}</p>
                           </div>
                       </div>
                       {apt.status === 'confirmed' ? (
                           <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    selectAppointment(apt as unknown as import('../../../types').Appointment);
                                    go('VIDEO_PREP'); 
                                }} 
                                className="p-3 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-colors"
                            >
                               <Video size={16}/>
                           </button>
                       ) : (
                           <button onClick={(e) => { e.stopPropagation(); selectAppointment(apt as unknown as import('../../../types').Appointment); go('AGENDA_CONFIRM'); }} className="p-3 bg-nature-50 text-nature-400 rounded-xl">
                               <MoreHorizontal size={16}/>
                           </button>
                       )}
                   </div>
               ))}
           </div>
       </div>
    </PortalView>
  );
}
