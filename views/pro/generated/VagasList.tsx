
import React from 'react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { ChevronLeft, Briefcase, MapPin, Building, Search } from 'lucide-react';

export default function VagasList() {
  const { go } = useGuardiaoFlow();

  const vacancies = [
      { id: 1, title: 'Terapeuta Holístico Senior', space: 'Santuário Gaia', location: 'São Paulo, SP', type: 'Presencial', salary: 'R$ 4k - 6k' },
      { id: 2, title: 'Instrutor de Yoga', space: 'Zen Space', location: 'Remoto', type: 'Híbrido', salary: 'R$ 120/h' },
      { id: 3, title: 'Psicólogo Transpessoal', space: 'Casa Alma', location: 'Rio de Janeiro', type: 'Presencial', salary: 'A combinar' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col animate-in fade-in duration-500">
       <header className="p-6 flex items-center justify-between sticky top-0 bg-[#fcfdfc]/80 backdrop-blur-md z-10">
           <button onClick={() => go('DASHBOARD')} className="p-3 bg-nature-50 rounded-2xl text-nature-900 border border-nature-100 hover:bg-nature-100 transition-colors">
               <ChevronLeft size={20}/>
           </button>
           <h1 className="text-lg font-serif italic text-nature-900">Mural de Oportunidades</h1>
           <div className="w-10"></div>
       </header>

       <div className="px-6 mb-6">
           <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl mb-6">
                <Briefcase className="absolute -right-4 -bottom-4 text-indigo-500/20 w-32 h-32 rotate-12" />
                <h2 className="text-2xl font-serif italic relative z-10">Expanda seu Dom</h2>
                <p className="text-indigo-200 text-xs mt-2 relative z-10 max-w-[80%]">Conecte-se com Santuários que buscam sua medicina única.</p>
           </div>
           
           <div className="bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-3 shadow-sm">
               <Search size={20} className="text-nature-300" />
               <input type="text" placeholder="Cargo, cidade ou terapia..." className="flex-1 bg-transparent border-none outline-none text-nature-900 placeholder:text-nature-300" />
           </div>
       </div>

       <div className="flex-1 px-6 space-y-4 pb-24">
           {vacancies.map(v => (
               <div key={v.id} onClick={() => alert(`Detalhes da Vaga: ${v.title}\n\nEm breve: Tela detalhada com requisitos e aplicação.`)} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-4">
                   <div className="flex justify-between items-start">
                       <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Building size={18}/></div>
                           <div>
                               <h4 className="font-bold text-nature-900 text-sm">{v.space}</h4>
                               <p className="text-[9px] text-nature-400 font-bold uppercase flex items-center gap-1"><MapPin size={10}/> {v.location}</p>
                           </div>
                       </div>
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase">{v.type}</span>
                   </div>
                   
                   <div>
                       <h3 className="font-bold text-lg text-nature-900">{v.title}</h3>
                       <p className="text-sm text-nature-500 mt-1">Estimativa: <span className="text-nature-900 font-bold">{v.salary}</span></p>
                   </div>

                   <button className="w-full py-3 border border-nature-200 rounded-xl text-nature-400 text-[10px] font-bold uppercase tracking-widest group-hover:bg-nature-900 group-hover:text-white group-hover:border-nature-900 transition-all">Ver Detalhes</button>
               </div>
           ))}
       </div>
    </div>
  );
}
