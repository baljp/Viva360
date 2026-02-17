
import React, { useState, useEffect } from 'react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { ChevronLeft, Briefcase, MapPin, Building, Search, X, CheckCircle, Clock, DollarSign, Loader2 } from 'lucide-react';
import { PortalView, ZenToast } from '../../../components/Common';
import { api } from '../../../services/api';

export default function VagasList() {
  const { go, back } = useGuardiaoFlow();
  const [selectedVacancy, setSelectedVacancy] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    api.spaces.getVacancies().then((data: any) => {
      const list = Array.isArray(data) ? data : (data?.vacancies || []);
      setVacancies(list.map((v: any) => ({
        id: v.id,
        title: v.title || v.name || 'Vaga sem título',
        space: v.spaceName || v.space_name || v.space || 'Santuário',
        location: v.location || 'Não informado',
        type: v.type || v.modality || 'Presencial',
        salary: v.salary || v.compensation || 'A combinar',
        description: v.description || '',
        status: v.status || 'OPEN',
      })));
    }).catch(() => {
      // Fallback so UI isn't empty if backend is down
      setVacancies([]);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = vacancies.filter(v =>
    !searchTerm || v.title.toLowerCase().includes(searchTerm.toLowerCase()) || v.space.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApply = async () => {
    if (!selectedVacancy) return;
    setApplying(true);
    try {
      await api.recruitment.apply(String(selectedVacancy.id), 'Tenho interesse nesta oportunidade.');
      setShowToast(true);
      setTimeout(() => {
        setSelectedVacancy(null);
        setShowToast(false);
      }, 2000);
    } catch (err: any) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } finally {
      setApplying(false);
    }
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
