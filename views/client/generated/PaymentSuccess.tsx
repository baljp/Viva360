
import React, { useEffect } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Sparkles, CalendarCheck, Home, History, CheckCircle2, X } from 'lucide-react';

import confetti from 'canvas-confetti';

export default function PaymentSuccess() {
  const { go, reset } = useBuscadorFlow();

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10b981', '#fbbf24', '#34d399']
    });
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="min-h-screen bg-nature-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 relative overflow-hidden">
       {/* Background Atmosphere - Stronger for better contrast */}
       <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[50%] bg-emerald-900/40 rounded-full blur-[120px] animate-pulse"></div>
       <div className="absolute inset-0 bg-black/60 z-0"></div>

       {/* Close Button */}
       <button 
         onClick={() => {
             reset();
             go('DASHBOARD');
         }}
         className="absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/60 hover:text-white hover:bg-white/20 active:scale-90 transition-all z-50 shadow-xl"
       >
          <X size={24} />
       </button>


       <div className="relative z-10 text-white text-center space-y-10 max-w-md w-full">
          <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex items-center justify-center mx-auto shadow-2xl skew-y-3 animate-float">
             <CheckCircle2 size={64} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
          </div>
          
          <div className="space-y-2">
              <h1 className="text-5xl font-serif italic text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">Troca Honrada.</h1>
              <p className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-[10px] drop-shadow-md">Portal de Cura Ativado</p>
          </div>



          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-black/10 border-top-[4px] border-t-emerald-500 text-left space-y-4 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-700 shadow-inner">
                      <CalendarCheck size={28} />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-nature-900/60 uppercase tracking-widest">Ritual Agendado</p>
                      <h4 className="font-bold text-nature-900 text-xl capitalize">{dateStr}</h4>
                  </div>
              </div>
              <p className="text-nature-900/90 text-sm font-medium italic leading-relaxed line-clamp-3">
                  "Seu compromisso com o despertar foi registrado na trama do tempo. Prepare-se com presença."
              </p>
          </div>



          <div className="flex flex-col gap-4 w-full pt-4">
              <button 
                onClick={() => {
                    reset();
                    go('DASHBOARD');
                }} 
                className="w-full py-5 bg-white text-nature-950 rounded-[2rem] font-bold uppercase text-[10px] tracking-[0.3em] shadow-[0_15px_30px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-nature-50"
              >
                 <Home size={18} /> Voltar ao Core
              </button>
              <button 
                onClick={() => go('PAYMENT_HISTORY')} 
                className="w-full py-5 bg-white/10 text-white rounded-[2rem] border border-white/20 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all backdrop-blur-md shadow-xl hover:bg-white/20"
              >
                 <History size={18} /> Ver Meus Rituais
              </button>
          </div>

       </div>
    </div>
  );
}
