
import React, { useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { CreditCard, Lock, ShieldCheck, Wallet, Copy, CheckCircle2, QrCode } from 'lucide-react';

export default function Checkout() {
  const { go, back, notify } = useBuscadorFlow();
  const [method, setMethod] = useState<'card' | 'pix'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPixQR, setShowPixQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const pixKey = "00020126360014br.gov.bcb.pix0114viva360espiritualidade5204000053039865406150.005802BR5915VIVA360_ALQUIMIA6009SAO_PAULO62070503***6304ABCD";

  const handleFinalize = async () => {
    if (method === 'pix' && !showPixQR) {
        setShowPixQR(true);
        return;
    }

    setIsProcessing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    go('PAYMENT_SUCCESS');
  };

  const copyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    notify('Chave Copiada', 'Cole no app do seu banco para pagar.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
       <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative">
          
          <div className="p-8 pb-4">
             <header className="flex justify-between items-start mb-4">
                 <div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Pagamento Seguro</p>
                    <h1 className="text-3xl font-serif italic text-slate-900">Troca de Energia</h1>
                 </div>
                 <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                    <ShieldCheck size={24} />
                 </div>
             </header>
             <p className="text-4xl font-bold text-slate-900 mt-2">R$ 150,00</p>
          </div>

          {!showPixQR ? (
            <div className="px-8 space-y-4 mb-8">
                <div 
                    onClick={() => setMethod('card')}
                    className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${method === 'card' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
                >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${method === 'card' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <CreditCard size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">Cartão de Crédito</p>
                        <p className="text-[10px] text-slate-400 font-medium">Até 3x sem juros</p>
                    </div>
                    {method === 'card' && <CheckCircle2 className="text-emerald-500" size={20} />}
                </div>

                <div 
                    onClick={() => setMethod('pix')}
                    className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${method === 'pix' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
                >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${method === 'pix' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <Wallet size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">PIX</p>
                        <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Aprovação Imediata</p>
                    </div>
                    {method === 'pix' && <CheckCircle2 className="text-emerald-500" size={20} />}
                </div>
            </div>
          ) : (
            <div className="px-8 mb-8 animate-in zoom-in-95 duration-300">
                <div className="bg-slate-50 rounded-[2rem] p-6 text-center border border-slate-100">
                    <div className="w-48 h-48 bg-white mx-auto mb-6 rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-center relative overflow-hidden group">
                        <QrCode size={140} className="text-slate-900" />
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-900">Escaneie para Pagar</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mb-4 leading-relaxed px-4">Copie o código abaixo para pagar via Pix "Copia e Cola" no app do seu banco.</p>
                    <button 
                        onClick={copyPix}
                        className="w-full py-3 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all group"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{copied ? 'Copiado!' : 'Copiar Código Pix'}</span>
                        {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400 group-hover:text-slate-600" />}
                    </button>
                </div>
            </div>
          )}

          <div className="px-8 mb-6 flex items-center justify-center gap-2 text-slate-400">
             <Lock size={12} />
             <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Pagamento Criptografado</span>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
             <button 
                onClick={showPixQR ? () => setShowPixQR(false) : back} 
                className="flex-1 py-4 rounded-xl text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-all outline-none"
             >
                {showPixQR ? 'Voltar' : 'Cancelar'}
             </button>
             <button 
                disabled={isProcessing}
                onClick={handleFinalize} 
                className={`flex-[2] py-4 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
             >
                {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>{showPixQR ? 'Confirmar Pagamento' : 'Finalizar Troca'}</>
                )}
             </button>
          </div>
       </div>
    </div>
  );
}
