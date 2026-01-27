
import React, { useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { CreditCard, Lock, ShieldCheck, Wallet } from 'lucide-react';

export default function Checkout() {
  const { go, back } = useBuscadorFlow();
  const [method, setMethod] = useState<'card' | 'pix'>('card');

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
       <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative">
          
          <div className="p-8 pb-4">
             <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Pagamento Seguro</p>
             <h1 className="text-3xl font-serif italic text-slate-900">Energia de Troca</h1>
             <p className="text-3xl font-bold text-emerald-600 mt-4">R$ 150,00</p>
          </div>

          <div className="px-8 space-y-4 mb-8">
              <div 
                onClick={() => setMethod('card')}
                className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${method === 'card' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
              >
                  <CreditCard className={method === 'card' ? 'text-emerald-600' : 'text-slate-400'} size={24} />
                  <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">Cartão de Crédito</p>
                      <p className="text-[10px] text-slate-400">Até 3x sem juros</p>
                  </div>
                  {method === 'card' && <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>}
              </div>

              <div 
                onClick={() => setMethod('pix')}
                className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${method === 'pix' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
              >
                  <Wallet className={method === 'pix' ? 'text-emerald-600' : 'text-slate-400'} size={24} />
                  <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">PIX</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase text-emerald-600">-5% de Desconto</p>
                  </div>
                  {method === 'pix' && <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>}
              </div>
          </div>

          <div className="px-8 mb-6 flex items-center justify-center gap-2 text-slate-400">
             <ShieldCheck size={14} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Ambiente Criptografado</span>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
             <button onClick={back} className="flex-1 py-4 rounded-xl text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-all">Cancelar</button>
             <button onClick={() => go('PAYMENT_SUCCESS')} className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2">
                <Lock size={14}/> Finalizar
             </button>
          </div>
       </div>
    </div>
  );
}
