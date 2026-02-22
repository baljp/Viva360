
import React, { useState, useMemo } from 'react';
import { ShoppingBag, X, Trash2, ChevronRight, CreditCard, QrCode, Lock, CheckCircle, Sparkles, Heart, RefreshCw, Package, Cloud, ChevronLeft, ShieldCheck } from 'lucide-react';
import { CartItem, Product, ViewState } from '../types';
import { useLocation } from 'react-router-dom';

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
          <button onClick={onClose} aria-label="Fechar carrinho" className="p-3 bg-nature-50 rounded-2xl text-nature-300 active:scale-90 transition-all"><X size={20}/></button>
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
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-nature-400 px-2 flex items-center gap-2 flex-wrap"><Package size={12}/> Entrega Física</h4>
                        {physicalItems.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-3xl border border-nature-100/80 flex items-center gap-4 shadow-sm group">
                                <img src={item.image} className="w-16 h-16 rounded-2xl object-cover shrink-0" alt={item.name || 'Item'} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-nature-900 text-xs truncate break-words line-clamp-2 leading-tight">{item.name}</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">R$ {(item.price || 0).toFixed(2)}</p>
                                </div>
                                <button onClick={() => onRemove(item.id)} aria-label="Remover item" className="p-2 text-rose-300 hover:text-rose-500 transition-colors shrink-0"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                )}

                {digitalItems.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-nature-400 px-2 flex items-center gap-2 flex-wrap"><Cloud size={12}/> Acesso Imediato</h4>
                        {digitalItems.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-3xl border border-nature-100/80 flex items-center gap-4 shadow-sm group">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden relative shrink-0">
                                    <img src={item.image} className="w-full h-full object-cover opacity-80" alt={item.name || 'Item'} />
                                    <div className="absolute inset-0 bg-indigo-900/10"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-nature-900 text-xs truncate break-words line-clamp-2 leading-tight">{item.name}</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">R$ {(item.price || 0).toFixed(2)}</p>
                                </div>
                                <button onClick={() => onRemove(item.id)} aria-label="Remover item" className="p-2 text-rose-300 hover:text-rose-500 transition-colors shrink-0"><Trash2 size={16}/></button>
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

// --- CHECKOUT FLOW (WIZARD) ---
export const CheckoutScreen: React.FC<{ 
  total: number; 
  onSuccess: () => void; 
  onCancel: () => void;
  items: CartItem[]; 
}> = ({ total, onSuccess, onCancel, items = [] }) => {
  const [step, setStep] = useState<'cart' | 'address' | 'payment' | 'review' | 'processing' | 'success' | 'error'>('cart');
  const [address, setAddress] = useState({ street: '', number: '', zip: '', city: '' });
  const [method, setMethod] = useState<'pix' | 'card'>('pix');
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'confirmed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Check if we need shipping address (only for physical items)
  const hasPhysical = items.some(i => i.type === 'physical');
  const steps = hasPhysical ? ['Resumo', 'Endereço', 'Pagamento', 'Confirmação'] : ['Resumo', 'Pagamento', 'Confirmação'];

  const nextStep = () => {
      if (step === 'cart') return setStep(hasPhysical ? 'address' : 'payment');
      if (step === 'address') return setStep('payment');
      if (step === 'payment' && !hasPhysical && method === 'pix') return handlePay();
      if (step === 'payment') return setStep('review');
      if (step === 'review') handlePay();
  };

  const handlePay = () => {
    setStep('processing');
    setProcessingState('processing');
    setErrorMsg('');
    setTimeout(() => {
        try {
            setProcessingState('confirmed');
            setStep('success');
            setTimeout(onSuccess, 3000);
        } catch (err: any) {
            setErrorMsg(err?.message || 'Não foi possível processar sua oferenda.');
            setStep('error');
        }
    }, 3000);
  };

  if (step === 'success') return <SuccessScreen onHome={onSuccess} />;

  if (step === 'error') return (
    <div className="fixed inset-0 h-full w-full flex flex-col items-center justify-center text-center p-8 bg-rose-50 animate-in fade-in z-[400]">
      <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-8">
        <X size={48} />
      </div>
      <h2 className="text-2xl font-serif italic text-nature-900 mb-3">Algo saiu do fluxo</h2>
      <p className="text-sm text-nature-500 max-w-xs mb-2">{errorMsg}</p>
      <p className="text-[10px] text-nature-400 uppercase tracking-widest mb-10">Tente novamente ou mude o método</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={() => setStep('payment')} className="w-full py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all">
          Tentar Novamente
        </button>
        <button onClick={onCancel} className="w-full py-4 bg-white text-nature-400 border border-nature-100 rounded-2xl font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all">
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 h-full w-full flex flex-col animate-in fade-in bg-[#f8fafc] z-[400]">
      {/* HEADER WITH PROGRESS */}
      <header className="flex flex-col px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
            <button onClick={onCancel} className="p-2 -ml-2 text-nature-400 hover:text-nature-900"><ChevronLeft/></button>
            <h2 className="text-sm font-bold uppercase tracking-widest text-nature-900">Checkout</h2>
            <div className="w-8"></div>
        </div>
        
        {/* PROGRESS STEPS */}
        <div className="flex justify-between items-center relative px-2">
            <div className="absolute top-[6px] left-0 w-full h-0.5 bg-nature-100 -z-10"></div>
            {steps.map((label, idx) => {
                // Determine active state index based on presence of physical step
                const currentIdx = step === 'cart' ? 0 : 
                                   step === 'address' ? 1 : 
                                   step === 'payment' ? (hasPhysical ? 2 : 1) : 
                                   step === 'review' ? (hasPhysical ? 3 : 2) : 4;
                
                const isActive = currentIdx === idx;
                const isPast = currentIdx > idx;
                
                return (
                    <div key={label} className="flex flex-col items-center gap-2 bg-[#f8fafc] px-2 min-w-[60px]">
                        <div className={`w-3 h-3 rounded-full transition-all duration-500 border-2 ${isActive ? 'bg-primary-600 border-primary-600 scale-125' : isPast ? 'bg-emerald-400 border-emerald-400' : 'bg-white border-nature-200'}`}></div>
                        <span className={`text-[9px] font-bold uppercase tracking-tight text-center ${isActive ? 'text-primary-600' : isPast ? 'text-emerald-500' : 'text-nature-300'}`}>{label}</span>
                    </div>
                );
            })}
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {step === 'cart' && (
            <div className="space-y-6 animate-in slide-in-from-right">
                <h3 className="text-2xl font-serif italic text-nature-900">Revise sua Jornada</h3>
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-nature-100 space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex gap-4 items-center">
                            <img src={item.image} className="w-16 h-16 rounded-2xl object-cover bg-nature-50 shrink-0" alt={item.name || 'Item'} />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-nature-900 break-words line-clamp-2 leading-snug">{item.name}</h4>
                                <p className="text-[10px] text-nature-400 uppercase font-bold tracking-tighter sm:tracking-widest">{item.type === 'physical' ? 'Entrega Física' : 'Digital / Serviço'}</p>
                            </div>
                            <span className="font-bold text-nature-900 whitespace-nowrap text-sm">R$ {item.price}</span>
                        </div>
                    ))}
                    <div className="border-t border-nature-100 pt-4 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-nature-400">Total</span>
                        <span className="text-xl font-serif italic text-nature-900">R$ {total.toFixed(2)}</span>
                    </div>
                </div>
                {hasPhysical && (
                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4 items-start">
                        <Package className="text-amber-500 shrink-0" size={20}/>
                        <p className="text-xs text-amber-800 leading-relaxed">Você possui itens físicos na sacola. Será necessário informar um endereço de entrega na próxima etapa.</p>
                    </div>
                )}
            </div>
        )}

        {step === 'address' && (
            <div className="space-y-6 animate-in slide-in-from-right">
                <h3 className="text-2xl font-serif italic text-nature-900">Onde entregamos?</h3>
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-nature-100 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Logradouro</label>
                        <input value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full p-4 bg-nature-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-nature-900" placeholder="Rua das Flores"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Número</label>
                            <input value={address.number} onChange={e => setAddress({...address, number: e.target.value})} className="w-full p-4 bg-nature-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-nature-900" placeholder="123"/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">CEP</label>
                            <input value={address.zip} onChange={e => setAddress({...address, zip: e.target.value})} className="w-full p-4 bg-nature-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-nature-900" placeholder="00000-000"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Cidade</label>
                        <input value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full p-4 bg-nature-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-nature-900" placeholder="São Paulo, SP"/>
                    </div>
                </div>
            </div>
        )}

        {step === 'payment' && (
             <div className="space-y-6 animate-in slide-in-from-right">
                <h3 className="text-2xl font-serif italic text-nature-900">Troca Energética</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setMethod('pix')} className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${method === 'pix' ? 'bg-nature-900 text-white border-nature-900 shadow-xl' : 'bg-white text-nature-300 border-nature-100'}`}>
                    <QrCode size={24}/>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pix</span>
                  </button>
                  <button onClick={() => setMethod('card')} className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${method === 'card' ? 'bg-nature-900 text-white border-nature-900 shadow-xl' : 'bg-white text-nature-300 border-nature-100'}`}>
                    <CreditCard size={24}/>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Cartão</span>
                  </button>
                </div>

                {method === 'pix' ? (
                     <div className="bg-white p-8 rounded-[2.5rem] border border-nature-100 shadow-sm text-center">
                         <div className="w-48 h-48 bg-nature-50 mx-auto rounded-2xl mb-4 flex items-center justify-center">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=viva360-pix-simulado" className="w-40 h-40 mix-blend-multiply opacity-80" alt="QR Code Pix" />
                         </div>
                         <p className="text-xs text-nature-500 max-w-[200px] mx-auto">O código expira em 30 minutos. A liberação é imediata.</p>
                     </div>
                ) : (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-4">
                         <input className="w-full p-4 bg-nature-50 rounded-2xl outline-none" placeholder="Número do Cartão"/>
                         <div className="grid grid-cols-2 gap-4">
                            <input className="w-full p-4 bg-nature-50 rounded-2xl outline-none" placeholder="MM/AA"/>
                            <input className="w-full p-4 bg-nature-50 rounded-2xl outline-none" placeholder="CVC"/>
                         </div>
                         <input className="w-full p-4 bg-nature-50 rounded-2xl outline-none" placeholder="Nome Impresso"/>
                    </div>
                )}
             </div>
        )}

        {step === 'processing' && (
            <div className="flex flex-col items-center justify-center h-full pt-20 space-y-6 animate-in fade-in">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-nature-100"></div>
                    <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500 animate-pulse" size={24} />
                </div>
                <h3 className="text-xl font-serif italic text-nature-900">Processando Troca...</h3>
                <p className="text-sm text-nature-400">Verificando disponibilidade cósmica</p>
            </div>
        )}

        {step === 'review' && (
            <div className="space-y-6 animate-in slide-in-from-right">
                <h3 className="text-2xl font-serif italic text-nature-900">Confirmar Pedido</h3>
                
                <div className="bg-nature-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400 mb-1">Valor Total</p>
                                <h2 className="text-4xl font-serif italic">R$ {total.toFixed(2)}</h2>
                            </div>
                            <ShieldCheck size={32} className="text-emerald-400"/>
                        </div>
                        <div className="h-px w-full bg-white/10"></div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-nature-200">
                             <div>
                                <p className="font-bold uppercase text-primary-400 text-[9px] mb-1">Método</p>
                                <p>{method === 'pix' ? 'Transferência PIX' : 'Cartão de Crédito'}</p>
                             </div>
                             {hasPhysical && (
                                 <div>
                                    <p className="font-bold uppercase text-primary-400 text-[9px] mb-1">Entrega em</p>
                                    <p className="line-clamp-1">{address.street}, {address.number}</p>
                                    <p>{address.city}</p>
                                 </div>
                             )}
                             {!hasPhysical && (
                                 <div>
                                    <p className="font-bold uppercase text-primary-400 text-[9px] mb-1">Entrega</p>
                                    <p>Digital / Instantânea</p>
                                 </div>
                             )}
                        </div>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl"></div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                    <CheckCircle className="text-emerald-600 shrink-0" size={20}/>
                    <p className="text-xs text-emerald-800 leading-relaxed">Ao confirmar, você concorda com nossa política de trocas conscientes e garante que seu endereço energético está alinhado para receber.</p>
                </div>
            </div>
        )}
      </div>

      {/* FOOTER ACTION */}
      {step !== 'processing' && (
        <div className="p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-white border-t border-nature-100 absolute bottom-0 w-full z-20">
            <button 
                onClick={nextStep}
                disabled={step === 'address' && (!address.street || !address.number)}
                className="w-full py-5 bg-nature-900 text-white rounded-3xl font-bold uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
            >
                {step === 'review'
                  ? 'Finalizar Alquimia'
                  : (step === 'payment' && !hasPhysical && method === 'pix')
                    ? 'Pagar Agora'
                    : 'Continuar'} <ChevronRight size={16}/>
            </button>
        </div>
      )}
    </div>
  );
};

export const SuccessScreen: React.FC<{ onHome: () => void }> = ({ onHome }) => {
  const location = useLocation();
  const confirmation = (location.state as any)?.confirmation || null;
  const transactionId = String((location.state as any)?.transactionId || '');
  const protocol = String(confirmation?.confirmationId || '').slice(0, 8).toUpperCase();

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
      {(protocol || transactionId) && (
        <p className="text-[10px] text-nature-400 uppercase tracking-widest mb-10 font-bold">
          {protocol ? `Protocolo ${protocol}` : ''}
          {protocol && transactionId ? ' • ' : ''}
          {transactionId ? `Transação ${transactionId.slice(0, 8).toUpperCase()}` : ''}
        </p>
      )}
      
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
