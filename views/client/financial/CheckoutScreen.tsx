
import React, { useState, useEffect } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { CreditCard, Lock, ShieldCheck, Wallet, Loader2, CheckCircle, Smartphone, MessageCircle, ArrowRight, QrCode, Sparkles } from 'lucide-react';
import { api } from '../../../services/api';
import { PortalView } from '../../../components/Common';
import { MicroInteraction } from '../../../components/MicroInteraction';

export default function CheckoutScreen() {
  const { go, jump, back, reset, state, selectTribeRoomContext } = useBuscadorFlow();
  const [method, setMethod] = useState<'card' | 'pix' | 'direct'>('card');
  const [loading, setLoading] = useState(false);
  const [showPixQR, setShowPixQR] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Sua semente foi plantada com sucesso. A abundância retorna a você.');
  const [errorMessage, setErrorMessage] = useState('');

  const postCheckout = (() => {
    try {
      const intent = localStorage.getItem('viva360.post_checkout.intent');
      const contextId = localStorage.getItem('viva360.post_checkout.contextId');
      const amount = Number(localStorage.getItem('viva360.post_checkout.amount') || '0');
      const description = String(localStorage.getItem('viva360.post_checkout.description') || '').trim();
      return {
        intent: intent || null,
        contextId: contextId || null,
        amount: Number.isFinite(amount) ? amount : 0,
        description: description || null,
      };
    } catch {
      return { intent: null, contextId: null, amount: 0, description: null };
    }
  })();

  const isHealingCircleCheckout =
    postCheckout.intent === 'healing_circle' || state.tribeRoomContext?.type === 'healing_circle';

  const handlePayment = async () => {
    if (method === 'pix' && !showPixQR) {
        setShowPixQR(true);
        return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
        const amount = isHealingCircleCheckout && postCheckout.amount > 0 ? postCheckout.amount : 150.0;
        const description = isHealingCircleCheckout && postCheckout.description
          ? postCheckout.description
          : 'Troca Energética - Viva360';
        const contextType = isHealingCircleCheckout ? 'TRIBO' : (method === 'direct' ? 'TRIBO' : 'BAZAR');
        const contextRef = isHealingCircleCheckout
          ? `healing_circle:${postCheckout.contextId || ''}`.replace(/:$/, '')
          : (method === 'direct' ? 'tribe-direct-flow' : 'bazar-checkout-flow');

        // MOD-01: Use real provider ID from flow state instead of hardcoded 'pro_001'
        const providerId = state.selectedProfessionalId || undefined;

        const response = await api.payment.checkout(amount, description, providerId, {
          contextType,
          contextRef,
          items: [{ id: 'checkout-guided-service', price: amount, type: 'service' }],
        });

        const confirmationCode = String(response?.confirmation?.confirmationId || '').slice(0, 8).toUpperCase();
        if (response?.code !== 'CHECKOUT_CONFIRMED') {
            throw new Error('Checkout não confirmado pela API.');
        }

        setSuccessMessage(
            confirmationCode
                ? `Sua semente foi plantada com sucesso. Protocolo ${confirmationCode}.`
                : 'Sua semente foi plantada com sucesso. A abundância retorna a você.'
        );
        
        setShowSuccess(true);
    } catch (error: any) {
        setErrorMessage(error?.message || 'Não foi possível concluir sua oferenda agora.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <PortalView 
        title="Energia de Troca" 
        subtitle="FINALIZAR OFERENDA" 
        onBack={back}
        onClose={reset}
    >
      {showSuccess && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center pointer-events-none">
              <MicroInteraction 
                title="Troca Concluída" 
                message={successMessage}
                onClose={() => {
                    setShowSuccess(false);
                    if (isHealingCircleCheckout) {
                      // Clear intent and go straight to the circle room after checkout.
                      try {
                        localStorage.removeItem('viva360.post_checkout.intent');
                        localStorage.removeItem('viva360.post_checkout.contextId');
                        localStorage.removeItem('viva360.post_checkout.amount');
                        localStorage.removeItem('viva360.post_checkout.description');
                      } catch {
                        // ignore
                      }

                      if (!state.tribeRoomContext || state.tribeRoomContext.type !== 'healing_circle') {
                        selectTribeRoomContext({ type: 'healing_circle', contextId: postCheckout.contextId || undefined });
                      }
                      jump('TRIBE_INTERACTION');
                      return;
                    }

                    go('PAYMENT_SUCCESS');
                }} 
              />
          </div>
      )}

      <div className="flex flex-col animate-in fade-in duration-500 pb-20">
         <div className="text-center py-6 mb-4">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Total a Integralizar</p>
            <h2 className="text-5xl font-serif italic text-nature-900 group">
                <span className="text-2xl text-nature-400 not-italic mr-1">R$</span>150,00
            </h2>
         </div>

         {!showPixQR ? (
            <div className="space-y-4 px-2">
                {[
                    { id: 'card', icon: CreditCard, label: 'Cartão de Crédito', sub: 'Até 3x sem juros', color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
                    { id: 'pix', icon: Smartphone, label: 'PIX Instantâneo', sub: 'Até 10% de cashback', color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
                    { id: 'direct', icon: MessageCircle, label: 'Direto com Guardião', sub: 'Combinar via Voucher', color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' }
                ].map((m: any) => (
                    <div 
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`flex items-center gap-4 p-5 rounded-[2.5rem] border-2 transition-all cursor-pointer group ${method === m.id ? 'border-nature-900 bg-white shadow-xl scale-[1.02]' : 'border-nature-50 bg-nature-50/30 grayscale hover:grayscale-0'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${m.color}`}>
                            <m.icon size={28} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-nature-900 text-sm tracking-tight">{m.label}</p>
                            <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">{m.sub}</p>
                        </div>
                        {method === m.id && (
                            <div className="w-8 h-8 bg-nature-900 rounded-full flex items-center justify-center text-white animate-in zoom-in duration-300">
                                <CheckCircle size={16} />
                            </div>
                        )}
                    </div>
                ))}

                {method === 'card' && (
                    <div className="mt-6 p-8 bg-white rounded-[2.5rem] border border-nature-100 shadow-sm animate-in slide-in-from-top duration-500 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-nature-400 uppercase tracking-widest px-2">Número do Cartão</label>
                            <div className="h-14 bg-nature-50 rounded-2xl border border-nature-100 flex items-center px-4 text-sm text-nature-400 font-mono tracking-widest">•••• •••• •••• 4242</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-nature-400 uppercase tracking-widest px-2">Validade</label>
                                <div className="h-14 bg-nature-50 rounded-2xl border border-nature-100 flex items-center px-4 text-sm text-nature-400">12/30</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-nature-400 uppercase tracking-widest px-2">CVV</label>
                                <div className="h-14 bg-nature-50 rounded-2xl border border-nature-100 flex items-center px-4 text-sm text-nature-400">•••</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
         ) : (
            <div className="px-4 py-8 flex flex-col items-center text-center animate-in zoom-in duration-500">
                <div className="w-64 h-64 bg-white p-4 rounded-[2.5rem] shadow-elegant border-4 border-nature-900 mb-8 relative group">
                    <QrCode size={224} className="text-nature-900" />
                    <div className="absolute inset-0 bg-nature-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2.5rem]">
                        <p className="text-[10px] font-black text-nature-900 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-nature-200">Copiar Código</p>
                    </div>
                </div>
                <h3 className="text-2xl font-serif italic text-nature-900 mb-2">Escaneie para Vibrar</h3>
                <p className="text-xs text-nature-500 max-w-xs leading-relaxed">O Pix é processado instantaneamente e sua semente será plantada agora.</p>
                <button onClick={() => setShowPixQR(false)} className="mt-8 text-[10px] font-black text-nature-400 uppercase tracking-widest hover:text-nature-600 transition-colors">Voltar aos Métodos</button>
            </div>
         )}

         <div className="mt-12 px-2 pb-12">
            <div className="flex items-center justify-center gap-3 text-nature-300 mb-8">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fluxo Criptografado & Seguro</span>
            </div>

            <button 
                onClick={handlePayment} 
                disabled={loading} 
                className="btn-primary w-full h-16 rounded-[2.5rem]"
            >
                {loading ? <Loader2 size={24} className="animate-spin text-primary-400"/> : <Lock size={20} className="text-primary-400"/>} 
                <span className="ml-2">{loading ? 'Sincronizando...' : method === 'direct' ? 'Gerar Voucher' : showPixQR ? 'Já Realizei o Pix' : 'Concluir Oferenda'}</span>
            </button>
            {errorMessage && (
                <p className="text-center text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-4">
                    {errorMessage}
                </p>
            )}
            <p className="text-center text-[9px] text-nature-400 uppercase tracking-widest mt-8 cursor-pointer hover:text-nature-600 transition-colors font-bold" onClick={back}>Mudar de ideia</p>
         </div>
      </div>
    </PortalView>
  );
}
