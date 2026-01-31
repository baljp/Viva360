
import React, { useEffect } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Sparkles, CalendarCheck, Home, History, CheckCircle2 } from 'lucide-react';
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
       {/* Background Atmosphere */}
       <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[50%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse"></div>

       <div className="relative z-10 text-white text-center space-y-10 max-w-md w-full">
          <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex items-center justify-center mx-auto shadow-2xl skew-y-3 animate-float">
             <CheckCircle2 size={64} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
          </div>
          
          <div className="space-y-2">
              <h1 className="text-5xl font-serif italic text-white leading-tight">Troca Honrada.</h1>
              <p className="text-emerald-300/80 font-bold uppercase tracking-[0.3em] text-[10px]">Portal de Cura Ativado</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 text-left space-y-4 shadow-xl">
              <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CalendarCheck size={24} />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Ritual Agendado</p>
                      <h4 className="font-bold text-white text-lg capitalize">{dateStr}</h4>
                  </div>
              </div>
              <p className="text-emerald-100/60 text-xs italic leading-relaxed">
                  "Seu compromisso com o despertar foi registrado na trama do tempo. Prepare-se com presença."
              </p>
          </div>

          <div className="flex flex-col gap-4 w-full pt-4">
              <button 
                onClick={() => {
                    reset();
                    go('DASHBOARD');
                }} 
                className="w-full py-5 bg-white text-nature-950 rounded-[2rem] font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                 <Home size={18} /> Voltar ao Core
              </button>
              <button 
                onClick={() => go('PAYMENT_HISTORY')} 
                className="w-full py-5 bg-white/10 text-white rounded-[2rem] border border-white/10 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all backdrop-blur-sm"
              >
                 <History size={18} /> Ver Meus Rituais
              </button>
          </div>
       </div>
    </div>
  );
}
