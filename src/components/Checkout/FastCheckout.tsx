
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
    await new Promise(resolve => setTimeout(resolve, 800));
    setStep('success');
    setTimeout(onSuccess, 1000);
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-nano-950/90 backdrop-blur-sm animate-in fade-in">
        <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-[bounce_0.5s_ease-out]">
                <Check size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Complete!</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-nano-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <NanoCard className="w-full max-w-md bg-nano-900 border-banana-400/20 shadow-2xl relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-banana-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <button onClick={onCancel} className="absolute top-4 right-4 text-nano-400 hover:text-white">
          <X size={24} />
        </button>

        <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-banana-400/10 rounded-lg text-banana-400">
                    <Zap size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Fast Checkout</h2>
            </div>
            <p className="text-nano-400 text-sm">Review your total and confirm instantly.</p>
        </div>

        <div className="py-6 border-y border-white/5 space-y-4">
            <div className="flex justify-between items-end">
                <span className="text-nano-300">Total Amount</span>
                <span className="text-3xl font-bold text-banana-400">R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <CreditCard className="text-nano-300" size={20} />
                <div className="flex-1">
                    <p className="text-white text-sm font-medium">Mastercard •••• 4242</p>
                    <p className="text-nano-500 text-xs">Primary Method</p>
                </div>
                <button className="text-banana-400 text-xs font-bold hover:underline">CHANGE</button>
            </div>
        </div>

        <div className="mt-8">
            <NanoButton 
                onClick={handlePay} 
                disabled={step === 'paying'}
                className="w-full py-4 text-lg shadow-[0_0_30px_rgba(250,204,21,0.2)]"
            >
                {step === 'paying' ? 'Processing...' : 'Pay Instantly'}
            </NanoButton>
            <p className="text-center text-nano-600 text-xs mt-3 flex items-center justify-center gap-1">
                <Zap size={12} /> Powered by NanoPay
            </p>
        </div>
      </NanoCard>
    </div>
  );
};
