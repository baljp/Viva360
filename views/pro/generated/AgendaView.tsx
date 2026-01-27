
import React from 'react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { ChevronLeft, Calendar as CalendarIcon, Clock, Video, MoreHorizontal } from 'lucide-react';

export default function AgendaView() {
  const { go } = useGuardiaoFlow();

  const appointments = [
      { id: 1, time: '14:00', client: 'Ana Silva', type: 'Reiki à Distância', status: 'confirmed' },
      { id: 2, time: '15:30', client: 'Pedro Santos', type: 'Leitura de Aura', status: 'pending' },
      { id: 3, time: '17:00', client: 'Maria Oliveira', type: 'Mentoria Espiritual', status: 'confirmed' }
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col animate-in fade-in duration-500">
       <header className="p-6 flex items-center justify-between sticky top-0 bg-[#fcfdfc]/80 backdrop-blur-md z-10">
           <button onClick={() => go('DASHBOARD')} className="p-3 bg-nature-50 rounded-2xl text-nature-900 border border-nature-100 hover:bg-nature-100 transition-colors">
               <ChevronLeft size={20}/>
           </button>
           <h1 className="text-lg font-serif italic text-nature-900">Agenda de Luz</h1>
           <button className="p-3 bg-nature-50 rounded-2xl text-nature-400 border border-nature-100"><CalendarIcon size={20}/></button>
       </header>

       <div className="flex-1 px-6 space-y-6 pb-24">
           {/* Date Selector */}
           <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
               {['SEG','TER','QUA','QUI','SEX'].map((d, i) => (
                   <button key={d} className={`flex flex-col items-center justify-center min-w-[3.5rem] aspect-[3/4] rounded-2xl border transition-all ${i === 2 ? 'bg-nature-900 text-white border-nature-900 shadow-xl' : 'bg-white text-nature-400 border-nature-100 hover:border-nature-300'}`}>
                       <span className="text-[10px] font-bold uppercase">{d}</span>
                       <span className="text-lg font-bold">{12 + i}</span>
                   </button>
               ))}
           </div>

           <div className="space-y-4">
               <h3 className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.2em] px-2">Rituais de Hoje</h3>
               {appointments.map(apt => (
                   <div key={apt.id} className="bg-white p-5 rounded-[2rem] border border-nature-100 flex items-center justify-between shadow-sm group hover:shadow-md transition-all cursor-pointer" onClick={() => go('PATIENT_PROFILE')}>
                       <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs ${apt.status === 'confirmed' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'}`}>
                               {apt.time}
                           </div>
                           <div>
                               <h4 className="text-sm font-bold text-nature-900">{apt.client}</h4>
                               <p className="text-[10px] text-nature-400 font-bold uppercase tracking-wide">{apt.type}</p>
                           </div>
                       </div>
                       {apt.status === 'confirmed' ? (
                           <button onClick={(e) => { e.stopPropagation(); alert("Sala de Vídeo (Mock) Iniciada. Em produção, abriria o Jitsi/Zoom."); }} className="p-3 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-colors">
                               <Video size={16}/>
                           </button>
                       ) : (
                           <button className="p-3 bg-nature-50 text-nature-400 rounded-xl">
                               <MoreHorizontal size={16}/>
                           </button>
                       )}
                   </div>
               ))}
           </div>
       </div>
    </div>
  );
}
