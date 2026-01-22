
import React, { useState } from 'react';
import { X, CreditCard, Check, Zap } from 'lucide-react';
import { NanoButton, NanoCard } from '../common/NanoComponents';

interface FastCheckoutProps {
  total: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const FastCheckout: React.FC<FastCheckoutProps> = ({ total, onSuccess, onCancel }) => {
  const [step, setStep] = useState<'review' | 'paying' | 'success'>('review');

  const handlePay = async () => {
    setStep('paying');
    // Simulate ultra-fast processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStep('success');
    setTimeout(onSuccess, 2000);
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-nature-900/90 backdrop-blur-md animate-in fade-in">
        <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 animate-[bounce_0.5s_ease-out] shadow-2xl shadow-emerald-500/30">
                <Check size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-serif italic font-medium text-white mb-2">Sincronia Confirmada</h2>
            <p className="text-emerald-200 text-sm font-medium uppercase tracking-widest">Sua troca foi honrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-nature-900/80 backdrop-blur-sm p-4 animate-in fade-in">
      <NanoCard className="w-full max-w-md bg-nature-800 border-primary-500/20 shadow-2xl relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <button onClick={onCancel} className="absolute top-4 right-4 text-nature-400 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-primary-500/10 rounded-xl text-primary-400">
                    <Zap size={20} />
                </div>
                <h2 className="text-2xl font-serif italic font-medium text-white">Checkout Relâmpago</h2>
            </div>
            <p className="text-nature-400 text-sm">Respire fundo e confirme sua troca de energia.</p>
        </div>

        <div className="py-6 border-y border-white/5 space-y-4">
            <div className="flex justify-between items-end">
                <span className="text-nature-300 text-sm uppercase tracking-widest font-bold">Valor Total</span>
                <span className="text-3xl font-serif italic font-medium text-primary-400">R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="p-2 bg-white/10 rounded-xl"><CreditCard className="text-white" size={20} /></div>
                <div className="flex-1">
                    <p className="text-white text-sm font-bold tracking-wide">Mastercard •••• 4242</p>
                    <p className="text-nature-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Método Principal</p>
                </div>
                <button className="text-primary-400 text-[10px] font-bold uppercase tracking-widest hover:text-primary-300">Trocar</button>
            </div>
        </div>

        <div className="mt-8">
            <NanoButton 
                onClick={handlePay} 
                disabled={step === 'paying'}
                className="w-full py-5 text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary-500/10 bg-primary-600 hover:bg-primary-500"
            >
                {step === 'paying' ? 'Processando Energia...' : 'Confirmar Pagamento'}
            </NanoButton>
            <p className="text-center text-nature-500 text-[10px] font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-1.5 opacity-60">
                <Zap size={10} /> Powered by Viva360
            </p>
        </div>
      </NanoCard>
    </div>
  );
};
