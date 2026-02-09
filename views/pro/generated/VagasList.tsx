
import React, { useState } from 'react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { ChevronLeft, Briefcase, MapPin, Building, Search, X, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { PortalView, ZenToast } from '../../../components/Common';

export default function VagasList() {
  const { go, back } = useGuardiaoFlow();
  const [selectedVacancy, setSelectedVacancy] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);

  const vacancies = [
      { id: 1, title: 'Terapeuta Holístico Senior', space: 'Santuário Gaia', location: 'São Paulo, SP', type: 'Presencial', salary: 'R$ 4k - 6k', description: 'Buscamos um guardião experiente para liderar nossos rituais de lua cheia e atendimentos individuais.' },
      { id: 2, title: 'Instrutor de Yoga', space: 'Zen Space', location: 'Remoto', type: 'Híbrido', salary: 'R$ 120/h', description: 'Aulas online e presenciais. Foco em Hatha e Vinyasa.' },
      { id: 3, title: 'Psicólogo Transpessoal', space: 'Casa Alma', location: 'Rio de Janeiro', type: 'Presencial', salary: 'A combinar', description: 'Atendimento clínico com abordagem integrativa.' },
  ];

  const handleApply = () => {
    setShowToast(true);
    setTimeout(() => {
        setSelectedVacancy(null);
        setShowToast(false);
        // In a real app, call API here
    }, 2000);
  };

  return (
    <PortalView title="Mural de Oportunidades" subtitle="EXPANDA SEU DOM" onBack={() => go('DASHBOARD')} heroImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800">
       {showToast && <ZenToast toast={{ title: 'Aplicação Enviada', message: 'O Espaço receberá sua intenção.' }} onClose={() => setShowToast(false)} />}
       
       <div className="px-2 mb-6">
           <div className="bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-3 shadow-sm">
               <Search size={20} className="text-nature-300" />
               <input type="text" placeholder="Cargo, cidade ou terapia..." className="flex-1 bg-transparent border-none outline-none text-nature-900 placeholder:text-nature-300" />
           </div>
       </div>

       <div className="space-y-4 pb-24 px-2">
           {vacancies.map(v => (
               <div key={v.id} onClick={() => setSelectedVacancy(v)} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-4 relative overflow-hidden">
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

                   <button onClick={(event) => { event.stopPropagation(); setSelectedVacancy(v); }} className="w-full py-3 border border-nature-200 rounded-xl text-nature-400 text-[10px] font-bold uppercase tracking-widest group-hover:bg-nature-900 group-hover:text-white group-hover:border-nature-900 transition-all">Ver Detalhes</button>
               </div>
           ))}
       </div>

       {/* Details Modal */}
       {selectedVacancy && (
         <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-sm" onClick={() => setSelectedVacancy(null)} />
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative animate-in slide-in-from-bottom duration-300 shadow-2xl">
                <button onClick={() => setSelectedVacancy(null)} className="absolute top-6 right-6 p-2 bg-nature-50 rounded-full text-nature-400 hover:bg-nature-100 transition-colors"><X size={20}/></button>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner"><Building size={32}/></div>
                        <div>
                            <h3 className="text-xl font-serif italic text-nature-900">{selectedVacancy.title}</h3>
                            <p className="text-xs font-bold uppercase text-nature-400 tracking-widest">{selectedVacancy.space}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-nature-50 rounded-2xl flex items-center gap-3">
                            <MapPin size={20} className="text-nature-400" />
                            <div><p className="text-[9px] uppercase font-bold text-nature-400">Local</p><p className="text-xs font-bold text-nature-700">{selectedVacancy.location}</p></div>
                        </div>
                        <div className="p-4 bg-nature-50 rounded-2xl flex items-center gap-3">
                            <DollarSign size={20} className="text-emerald-500" />
                            <div><p className="text-[9px] uppercase font-bold text-nature-400">Valor</p><p className="text-xs font-bold text-nature-700">{selectedVacancy.salary}</p></div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-nature-900 text-sm mb-2">Sobre a Oportunidade</h4>
                        <p className="text-nature-600 text-sm leading-relaxed">{selectedVacancy.description}</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setSelectedVacancy(null)} className="flex-1 py-4 border border-nature-100 rounded-2xl font-bold uppercase tracking-widest text-xs text-nature-500">Voltar</button>
                        <button onClick={handleApply} className="flex-[2] py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                            <CheckCircle size={18} /> Aplicar Agora
                        </button>
                    </div>
                </div>
            </div>
         </div>
       )}
    </PortalView>
  );
}
