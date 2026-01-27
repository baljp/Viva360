
import React from 'react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext';
import { ChevronLeft, Flower, Search, Filter } from 'lucide-react';

export default function SpacePatients() {
  const { go } = useSantuarioFlow();

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col animate-in fade-in duration-500">
       <header className="p-6 flex items-center justify-between sticky top-0 bg-[#fcfdfc]/80 backdrop-blur-md z-10">
           <button onClick={() => go('EXEC_DASHBOARD')} className="p-3 bg-nature-50 rounded-2xl text-nature-900 border border-nature-100 hover:bg-nature-100 transition-colors">
               <ChevronLeft size={20}/>
           </button>
           <h1 className="text-lg font-serif italic text-nature-900">Jardim do Santuário</h1>
           <button className="p-3 bg-nature-50 rounded-2xl text-nature-400 border border-nature-100"><Filter size={20}/></button>
       </header>

       <div className="px-6 mb-6">
           <div className="bg-emerald-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl mb-6">
                <Flower className="absolute -right-4 -bottom-4 text-emerald-500/20 w-32 h-32 rotate-12" />
                <h2 className="text-2xl font-serif italic relative z-10">450 Almas</h2>
                <p className="text-emerald-200 text-xs mt-2 relative z-10 max-w-[80%]">Cuidando de vidas e expandindo a consciência.</p>
           </div>
           
           <div className="bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-3 shadow-sm">
               <Search size={20} className="text-nature-300" />
               <input type="text" placeholder="Buscar paciente..." className="flex-1 bg-transparent border-none outline-none text-nature-900 placeholder:text-nature-300" />
           </div>
       </div>

       {/* Placeholder List */}
       <div className="flex-1 px-6 flex items-center justify-center pb-24 opacity-50">
           <p className="text-center italic text-nature-400">Listagem de todos os pacientes do espaço...</p>
       </div>
    </div>
  );
}
