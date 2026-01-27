
import React from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Check, Calendar, Clock, MapPin } from 'lucide-react';

export default function BookingConfirm() {
  const { go, back } = useBuscadorFlow();

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
       <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-emerald-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-16 translate-x-10"></div>
          
          <div className="p-8 text-center pt-12">
             <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={32} />
             </div>
             <h1 className="text-2xl font-serif italic text-emerald-900 mb-2">Quase lá...</h1>
             <p className="text-emerald-600/60 text-sm">Revise os dados da sua sessão antes de confirmar.</p>
          </div>

          <div className="px-8 space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <Calendar className="text-emerald-500" size={20} />
                  <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Data</p>
                      <p className="font-bold text-emerald-900">Quarta, 12 de Maio</p>
                  </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <Clock className="text-emerald-500" size={20} />
                  <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Horário</p>
                      <p className="font-bold text-emerald-900">14:30 - 15:30</p>
                  </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <MapPin className="text-emerald-500" size={20} />
                  <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Local</p>
                      <p className="font-bold text-emerald-900">Santuário Gaia, Sala Ametista</p>
                  </div>
              </div>
          </div>

          <div className="p-6 bg-white/50 backdrop-blur-sm border-t border-emerald-50 flex gap-4">
             <button onClick={back} className="flex-1 py-4 rounded-xl text-emerald-400 font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-50 transition-all">Revisar</button>
             <button onClick={() => go('CHECKOUT')} className="flex-[2] py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">Ir para Pagamento</button>
          </div>
       </div>
    </div>
  );
}
