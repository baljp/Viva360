
import React, { useEffect } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Sparkles, CalendarCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PaymentSuccess() {
  const { go } = useBuscadorFlow();

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#fbbf24', '#34d399']
    });
  }, []);

  return (
    <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
       <div className="text-white text-center space-y-8 max-w-md">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto animate-bounce">
             <Sparkles size={48} className="text-amber-300" />
          </div>
          
          <div>
              <h1 className="text-4xl font-serif italic mb-2">Gratidão!</h1>
              <p className="text-emerald-100 text-lg">Sua jornada foi confirmada.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-left">
              <div className="flex items-start gap-4">
                  <CalendarCheck size={32} className="text-white mt-1"/>
                  <div>
                      <h4 className="font-bold text-white text-lg">Quarta, 12 de Maio</h4>
                      <p className="text-emerald-100 text-sm">14:30 • Santuário Gaia</p>
                      <button className="mt-4 px-4 py-2 bg-white text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest">Adicionar à Agenda</button>
                  </div>
              </div>
          </div>

          <button onClick={() => go('DASHBOARD')} className="w-full py-5 bg-white text-emerald-900 rounded-[2rem] font-bold uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform">
             Voltar ao Início
          </button>
       </div>
    </div>
  );
}
