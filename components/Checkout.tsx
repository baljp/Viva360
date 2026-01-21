
import React, { useState, useMemo } from 'react';
import { ShoppingBag, X, Trash2, ChevronRight, CreditCard, QrCode, Lock, CheckCircle, Sparkles, Heart, RefreshCw, Package, Cloud } from 'lucide-react';
import { CartItem, Product, ViewState } from '../types';

// --- CART DRAWER ---
export const CartDrawer: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  items: CartItem[]; 
  onRemove: (id: string) => void;
  onProceed: () => void;
}> = ({ isOpen, onClose, items, onRemove, onProceed }) => {
  const total = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);

  const physicalItems = items.filter(i => i.type === 'physical');
  const digitalItems = items.filter(i => i.type !== 'physical');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-primary-50 h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col rounded-l-[3.5rem] border-l border-white/20">
        <header className="p-8 pt-[calc(3rem+env(safe-area-inset-top))] flex justify-between items-center border-b border-nature-100 bg-white/95 backdrop-blur-md rounded-tl-[3.5rem] flex-none">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary-900 text-white rounded-2xl"><ShoppingBag size={20}/></div>
             <h3 className="text-xl font-serif italic text-nature-900">Sua Sacola</h3>
          </div>
          <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-300 active:scale-90 transition-all"><X size={20}/></button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
               <div className="w-20 h-20 bg-nature-100 rounded-full flex items-center justify-center text-nature-300"><Sparkles size={32}/></div>
               <p className="text-sm text-nature-400 font-medium">Sua sacola está vazia.<br/>O que sua alma pede hoje?</p>
            </div>
          ) : (
            <>
                {physicalItems.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-nature-400 px-2 flex items-center gap-2"><Package size={12}/> Entrega Física</h4>
                        {physicalItems.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-3xl border border-nature-100/80 flex items-center gap-4 shadow-sm group">
                                <img src={item.image} className="w-16 h-16 rounded-2xl object-cover" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-nature-900 text-xs truncate">{item.name}</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">R$ {(item.price || 0).toFixed(2)}</p>
                                </div>
                                <button onClick={() => onRemove(item.id)} className="p-4 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                )}

                {digitalItems.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-nature-400 px-2 flex items-center gap-2"><Cloud size={12}/> Acesso Imediato</h4>
                        {digitalItems.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-3xl border border-nature-100/80 flex items-center gap-4 shadow-sm group">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden relative">
                                    <img src={item.image} className="w-full h-full object-cover opacity-80" />
                                    <div className="absolute inset-0 bg-indigo-900/10"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-nature-900 text-xs truncate">{item.name}</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">R$ {(item.price || 0).toFixed(2)}</p>
                                </div>
                                <button onClick={() => onRemove(item.id)} className="p-4 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                )}
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-8 bg-white border-t border-nature-100/80 rounded-bl-[3.5rem] flex-none pb-[calc(3rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.2em]">Subtotal Energizado</span>
              <span className="text-2xl font-serif italic text-nature-900">R$ {(total || 0).toFixed(2)}</span>
            </div>
            <button 
              onClick={onProceed}
              className="w-full py-5 bg-primary-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-primary-900/30 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Caminhar para o Pagamento <ChevronRight size={18}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- CHECKOUT FLOW ---
export const CheckoutScreen: React.FC<{ 
  total: number; 
  onSuccess: () => void; 
  onCancel: () => void;
}> = ({ total, onSuccess, onCancel }) => {
  const [method, setMethod] = useState<'pix' | 'card'>('pix');
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'confirmed'>('idle');

  const handlePay = () => {
    setProcessingState('processing');
    setTimeout(() => {
        setProcessingState('confirmed');
        setTimeout(onSuccess, 1500);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 h-full w-full flex flex-col animate-in fade-in bg-primary-50 z-[400]">
      <header className="flex items-center gap-4 px-6 pt-[calc(3rem+env(safe-area-inset-top))] mb-8 flex-none bg-primary-50/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onCancel} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100/80 text-nature-300 active:scale-90 transition-all"><X size={20}/></button>
        <div>
          <h2 className="text-2xl font-serif italic text-nature-900 leading-tight">Troca Ética</h2>
          <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">Finalização Segura</p>
        </div>
      </header>

      <div className="flex-1 space-y-6 px-6 overflow-y-auto no-scrollbar pb-12">
        <div className="bg-nature-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden transition-all duration-500">
          <Sparkles size={150} className={`absolute -right-10 -bottom-10 opacity-5 ${processingState === 'processing' ? 'animate-spin-slow' : ''}`} />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-400 mb-2">Total da Jornada</p>
          <h3 className="text-5xl font-serif italic text-white leading-none">R$ {(total || 0).toFixed(2)}</h3>
          <div className="mt-8 flex items-center gap-2 text-primary-400 text-[9px] font-bold uppercase tracking-widest">
             <Lock size={12}/> Ambiente Seguro e Energizado
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-4 transition-opacity duration-500 ${processingState !== 'idle' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <button 
            onClick={() => setMethod('pix')}
            className={`p-8 rounded-3xl border flex flex-col items-center gap-4 transition-all active:scale-95 ${method === 'pix' ? 'bg-white border-primary-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]' : 'bg-white/70 border-nature-100/80'}`}
          >
            <QrCode size={32} className={method === 'pix' ? 'text-primary-600' : 'text-nature-300'} />
            <span className="text-[10px] font-bold uppercase tracking-widest">PIX</span>
          </button>
          <button 
            onClick={() => setMethod('card')}
            className={`p-8 rounded-3xl border flex flex-col items-center gap-4 transition-all active:scale-95 ${method === 'card' ? 'bg-white border-primary-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]' : 'bg-white/70 border-nature-100/80'}`}
          >
            <CreditCard size={32} className={method === 'card' ? 'text-primary-600' : 'text-nature-300'} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Cartão</span>
          </button>
        </div>

        <div className={`transition-opacity duration-500 ${processingState !== 'idle' ? 'opacity-50 blur-sm pointer-events-none' : 'opacity-100'}`}>
            {method === 'pix' ? (
            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[3.5rem] border border-nature-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center space-y-6">
                <div className="w-48 h-48 bg-white mx-auto rounded-3xl flex items-center justify-center p-4 border border-nature-100">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=viva360-pix-simulado" className="w-full h-full grayscale" alt="QR PIX" />
                </div>
                <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest leading-relaxed">Escaneie o código acima ou use o <br/><span className="text-primary-600">copia e cola</span></p>
            </div>
            ) : (
            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[3.5rem] border border-nature-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                <div className="w-full h-40 bg-gradient-to-br from-nature-800 to-nature-900 rounded-3xl p-6 text-white flex flex-col justify-between shadow-xl">
                    <div className="flex justify-between items-start">
                        <Sparkles size={24} className="text-amber-400" />
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Visa Gold</span>
                    </div>
                    <div>
                        <p className="text-lg font-mono tracking-[0.2em]">**** **** **** 4242</p>
                        <div className="flex justify-between mt-4">
                        <span className="text-[9px] uppercase font-bold opacity-60">Nome no Cartão</span>
                        <span className="text-[9px] uppercase font-bold opacity-60">12/28</span>
                        </div>
                    </div>
                </div>
                <input placeholder="CVC" className="w-full bg-nature-50 border border-nature-100 rounded-xl p-4 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            )}
        </div>
      </div>

      <div className="p-6 pb-[calc(3rem+env(safe-area-inset-bottom))] bg-white border-t border-nature-100/80 flex-none z-20 shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
        <button 
          onClick={handlePay}
          disabled={processingState !== 'idle'}
          className={`w-full py-6 text-white rounded-3xl font-bold uppercase tracking-widest text-[12px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-100 ${processingState === 'confirmed' ? 'bg-emerald-500' : 'bg-nature-900'}`}
        >
          {processingState === 'idle' && <><CheckCircle size={20}/> Confirmar Troca Ética</>}
          {processingState === 'processing' && <><RefreshCw size={20} className="animate-spin"/> Processando...</>}
          {processingState === 'confirmed' && <><CheckCircle size={20}/> Sucesso!</>}
        </button>
      </div>
    </div>
  );
};

export const SuccessScreen: React.FC<{ onHome: () => void }> = ({ onHome }) => {
  return (
    <div className="fixed inset-0 h-full w-full flex flex-col items-center justify-center text-center p-8 bg-primary-50 animate-in zoom-in duration-700 z-[500]">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-emerald-500/10 blur-[60px] rounded-full animate-pulse"></div>
        <div className="w-32 h-32 bg-white rounded-[3rem] shadow-xl border border-emerald-100 flex items-center justify-center text-emerald-500 relative z-10 animate-float">
          <Heart size={48} fill="currentColor" />
        </div>
        <Sparkles size={32} className="absolute -top-4 -right-4 text-amber-400" style={{animation: 'spin 4s linear infinite'}} />
      </div>
      
      <h2 className="text-4xl font-serif italic text-nature-900 mb-4 leading-tight">A Jornada Começou</h2>
      <p className="text-sm text-nature-500 leading-relaxed max-w-xs mb-12 italic">
        "Sua jornada de cura está confirmada. O universo conspira para que cada pétala deste caminho traga a renovação que você busca."
      </p>
      
      <div className="grid grid-cols-1 w-full gap-4 max-w-xs pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <button 
          onClick={onHome}
          className="w-full py-5 bg-primary-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary-900/30 active:scale-95 transition-all"
        >
          Ver no meu Jardim
        </button>
        <button 
          onClick={onHome}
          className="w-full py-5 bg-white text-nature-400 border border-nature-100/80 rounded-2xl font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all"
        >
          Continuar Explorando
        </button>
      </div>
    </div>
  );
};
