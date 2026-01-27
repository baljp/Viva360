
import React from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Users, Share2, Copy } from 'lucide-react';

export default function TribeInvite() {
  const { go, back } = useBuscadorFlow();

  return (
    <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom duration-500">
       <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="bg-indigo-50 p-8 text-center">
             <Users size={48} className="text-indigo-600 mx-auto mb-4" />
             <h1 className="text-2xl font-serif italic text-indigo-900">Expanda sua Tribo</h1>
             <p className="text-indigo-600/70 text-sm mt-2">Convide almas afins para jornada.</p>
          </div>

          <div className="p-8 space-y-6">
             <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seu Link Mágico</label>
                 <div className="flex gap-2">
                     <div className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-600 font-mono text-xs truncate">
                         viva360.app/tribe/u/joao-luz
                     </div>
                     <button className="p-4 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200"><Copy size={18}/></button>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <button className="p-4 bg-[#25D366] text-white rounded-2xl flex flex-col items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                     <Share2 size={24} />
                     <span className="text-[10px] font-bold uppercase">WhatsApp</span>
                 </button>
                 <button className="p-4 bg-indigo-500 text-white rounded-2xl flex flex-col items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                     <Share2 size={24} />
                     <span className="text-[10px] font-bold uppercase">Outros</span>
                 </button>
             </div>
          </div>

          <div className="p-6 border-t border-slate-100 text-center">
             <button onClick={back} className="text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600">Voltar</button>
          </div>
       </div>
    </div>
  );
}
