
import React from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { MessageSquare, Heart, Send } from 'lucide-react';

export default function TribeInteraction() {
  const { go, back } = useBuscadorFlow();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white p-6 shadow-sm flex items-center gap-4 z-10">
           <button onClick={back} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600">←</button>
           <div>
               <h1 className="font-bold text-slate-900">Círculo de Cura</h1>
               <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 12 Guardiões Online</p>
           </div>
       </header>

       <div className="flex-1 p-6 overflow-y-auto space-y-6">
           <div className="flex gap-4">
               <div className="w-10 h-10 bg-indigo-100 rounded-full flex-shrink-0"></div>
               <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                   <p className="text-sm text-slate-600">Alguém sentiu a energia do portal de hoje? Foi intenso! ✨</p>
                   <div className="flex gap-2 mt-2">
                       <button className="px-2 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 flex items-center gap-1 hover:text-rose-500"><Heart size={10}/> 5</button>
                   </div>
               </div>
           </div>
           
           <div className="flex gap-4 flex-row-reverse">
               <div className="w-10 h-10 bg-emerald-100 rounded-full flex-shrink-0"></div>
               <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[80%] text-white">
                   <p className="text-sm">Sim! A meditação guiada ajudou muito a ancorar.</p>
               </div>
           </div>
       </div>

       <div className="p-4 bg-white border-t border-slate-100 pb-8">
           <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
               <input type="text" placeholder="Compartilhe sua luz..." className="flex-1 bg-transparent border-none outline-none px-4 text-sm" />
               <button className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"><Send size={18}/></button>
           </div>
       </div>
    </div>
  );
}
