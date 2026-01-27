
import React from 'react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { ChevronLeft, Search, Filter, Flower, ChevronRight } from 'lucide-react';

export default function PatientsList() {
  const { go } = useGuardiaoFlow();

  // Mock Data
  const patients = [
      { id: 1, name: 'Ana Silva', sessions: 12, mood: 'Vibrante', progress: 85 },
      { id: 2, name: 'Carlos Luz', sessions: 4, mood: 'Ansioso', progress: 40 },
      { id: 3, name: 'Beatriz Sol', sessions: 28, mood: 'Sereno', progress: 95 },
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col animate-in fade-in duration-500">
       <header className="p-6 flex items-center justify-between sticky top-0 bg-[#fcfdfc]/80 backdrop-blur-md z-10">
           <button onClick={() => go('DASHBOARD')} className="p-3 bg-nature-50 rounded-2xl text-nature-900 border border-nature-100 hover:bg-nature-100 transition-colors">
               <ChevronLeft size={20}/>
           </button>
           <h1 className="text-lg font-serif italic text-nature-900">Meu Jardim</h1>
           <button className="p-3 bg-nature-50 rounded-2xl text-nature-400 border border-nature-100"><Filter size={20}/></button>
       </header>

       <div className="px-6 mb-6">
           <div className="bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-3 shadow-sm">
               <Search size={20} className="text-nature-300" />
               <input type="text" placeholder="Buscar alma..." className="flex-1 bg-transparent border-none outline-none text-nature-900 placeholder:text-nature-300" />
           </div>
       </div>

       <div className="flex-1 px-6 space-y-4 pb-24">
           {patients.map(p => (
               <div key={p.id} onClick={() => go('PATIENT_PROFILE')} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group">
                   <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-nature-50 rounded-2xl flex items-center justify-center text-nature-400 relative">
                           <Flower size={24} />
                           <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></div>
                       </div>
                       <div>
                           <h4 className="font-bold text-nature-900">{p.name}</h4>
                           <p className="text-[10px] text-nature-400 font-bold uppercase tracking-wide mt-1">{p.sessions} Sessões • {p.mood}</p>
                       </div>
                   </div>
                   <div className="flex items-center gap-3">
                       <div className="text-right">
                           <span className="text-xs font-bold text-emerald-600">{p.progress}%</span>
                           <div className="w-12 h-1 bg-nature-100 rounded-full mt-1 overflow-hidden">
                               <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.progress}%` }}></div>
                           </div>
                       </div>
                       <ChevronRight size={16} className="text-nature-300 group-hover:text-nature-900 transition-colors"/>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
}
