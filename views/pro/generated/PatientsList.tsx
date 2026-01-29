import React from 'react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { ChevronLeft, Search, Filter, Flower, ChevronRight, Activity, Zap, Sprout } from 'lucide-react';
import { PortalView } from '../../../components/Common';

export default function PatientsList() {
  const { go, back } = useGuardiaoFlow();

  // Mock Data (matches "Meu Jardim" concept)
  const patients = [
      { id: 1, name: 'Ana Silva', sessions: 12, mood: 'Vibrante', progress: 85, nextSession: '14/Mai' },
      { id: 2, name: 'Carlos Luz', sessions: 4, mood: 'Ansioso', progress: 40, nextSession: '18/Mai' },
      { id: 3, name: 'Beatriz Sol', sessions: 28, mood: 'Sereno', progress: 95, nextSession: '15/Mai' },
      { id: 4, name: 'João Terra', sessions: 1, mood: 'Reflexivo', progress: 15, nextSession: '20/Mai' },
  ];

  return (
    <PortalView title="Meu Jardim" subtitle="ALMAS EM JORNADA" onBack={() => go('DASHBOARD')} heroImage="https://images.unsplash.com/photo-1598155523122-38423bb4d6c1?q=80&w=800">
       
       <div className="px-2 mb-8 animate-in slide-in-from-bottom-4 duration-700">
           <div className="bg-nature-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
               <div className="flex justify-between items-end relative z-10">
                   <div>
                       <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-1">Métrica Viva</p>
                       <h3 className="text-3xl font-serif italic mb-1">32 <span className="text-lg opacity-60 not-italic sans-serif">Almas</span></h3>
                       <div className="flex items-center gap-2 mt-2">
                            <Activity size={14} className="text-emerald-400"/>
                            <span className="text-[10px] uppercase font-bold tracking-wider">Vitalidade Média: 78%</span>
                       </div>
                   </div>
                   <div className="text-right">
                       <Sprout size={32} className="text-emerald-400 mb-2 ml-auto" />
                       <span className="text-[9px] font-bold uppercase tracking-wider block">Evolução Coletiva</span>
                       <span className="text-emerald-400 font-bold text-sm">Em Crescimento</span>
                   </div>
               </div>
           </div>
       </div>

       <div className="px-2 mb-6">
           <div className="bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-3 shadow-sm hover:border-emerald-200 transition-colors">
               <Search size={20} className="text-nature-300" />
               <input type="text" placeholder="Buscar alma no jardim..." className="flex-1 bg-transparent border-none outline-none text-nature-900 placeholder:text-nature-300 font-medium" />
           </div>
       </div>

       <div className="space-y-4 pb-24 px-2">
           <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest pl-2">Florescimento Recente</h4>
           {patients.map((p, i) => (
               <div key={p.id} onClick={() => go('PATIENT_PROFILE')} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 flex items-center justify-between shadow-sm hover:shadow-lg transition-all cursor-pointer group animate-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                   <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-nature-50 rounded-2xl flex items-center justify-center text-nature-400 relative group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                           <Flower size={24} />
                           <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${p.progress > 80 ? 'bg-emerald-500' : (p.progress > 40 ? 'bg-amber-400' : 'bg-rose-400')}`}></div>
                       </div>
                       <div>
                           <h4 className="font-bold text-nature-900 group-hover:text-emerald-800 transition-colors">{p.name}</h4>
                           <div className="flex items-center gap-2 mt-1">
                               <span className="px-2 py-0.5 bg-nature-50 rounded-md text-[8px] font-bold uppercase tracking-wide text-nature-500">{p.mood}</span>
                               <span className="text-[9px] text-nature-300 font-bold">• {p.nextSession}</span>
                           </div>
                       </div>
                   </div>
                   <div className="flex items-center gap-3">
                       <div className="text-right">
                           <div className="w-12 h-1 bg-nature-100 rounded-full mt-1 overflow-hidden">
                               <div className={`h-full rounded-full ${p.progress > 80 ? 'bg-emerald-500' : (p.progress > 40 ? 'bg-amber-400' : 'bg-rose-400')}`} style={{ width: `${p.progress}%` }}></div>
                           </div>
                       </div>
                       <ChevronRight size={16} className="text-nature-300 group-hover:text-nature-900 transition-colors"/>
                   </div>
               </div>
           ))}
       </div>
    </PortalView>
  );
}
