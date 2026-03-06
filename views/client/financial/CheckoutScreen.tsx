
import React, { useState, useEffect } from 'react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
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
  const [providerPending, setProviderPending] = useState<null | {
    transactionId: string;
    provider: string;
    method: 'card' | 'pix';
    url?: string | null;
  }>(null);

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

  const checkoutAmount = isHealingCircleCheckout && postCheckout.amount > 0 ? postCheckout.amount : 150.0;
  const checkoutDescription = isHealingCircleCheckout && postCheckout.description
    ? postCheckout.description
    : 'Troca Energética - Viva360';

  const openProviderWindow = (url?: string | null) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePayment = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const contextType = isHealingCircleCheckout ? 'TRIBO' : (method === 'direct' ? 'TRIBO' : 'BAZAR');
      const contextRef = isHealingCircleCheckout
        ? `healing_circle:${postCheckout.contextId || ''}`.replace(/:$/, '')
        : (method === 'direct' ? 'tribe-direct-flow' : 'bazar-checkout-flow');
      const providerId = state.selectedProfessionalId || undefined;

      if (providerPending) {
        const response = await api.payment.getCheckoutStatus(providerPending.transactionId);
        if (response?.code === 'CHECKOUT_CONFIRMED') {
          const confirmationCode = String(response?.confirmation?.confirmationId || '').slice(0, 8).toUpperCase();
          setSuccessMessage(
            confirmationCode
              ? `Sua semente foi plantada com sucesso. Protocolo ${confirmationCode}.`
              : 'Sua semente foi plantada com sucesso. A abundância retorna a você.'
          );
          setProviderPending(null);
          setShowPixQR(false);
          setShowSuccess(true);
          return;
        }
        if (response?.code === 'CHECKOUT_PROVIDER_PENDING') {
          setErrorMessage('Pagamento ainda pendente no provedor. Finalize a cobrança e valide novamente.');
          if (response?.providerAction?.url) openProviderWindow(String(response.providerAction.url));
          return;
        }
        throw new Error(response?.message || 'O provedor ainda não confirmou o pagamento.');
      }

      const response = await api.payment.checkout(checkoutAmount, checkoutDescription, providerId, {
        contextType,
        contextRef,
        paymentMethod: method,
        items: [{ id: 'checkout-guided-service', price: checkoutAmount, type: 'service' }],
      });

      if (response?.code === 'CHECKOUT_PROVIDER_PENDING') {
        const transactionId = String(response?.transaction?.id || '').trim();
        if (!transactionId) {
          throw new Error('Checkout iniciado sem transação rastreável.');
        }
        const providerMethod: 'card' | 'pix' = method === 'pix' ? 'pix' : 'card';
        setProviderPending({
          transactionId,
          provider: String(response?.providerAction?.provider || 'stripe'),
          method: providerMethod,
          url: response?.providerAction?.url || null,
        });
        setShowPixQR(method === 'pix');
        setSuccessMessage('Pagamento iniciado no provedor. Finalize a cobrança e volte para validar.');
        openProviderWindow(response?.providerAction?.url ? String(response.providerAction.url) : null);
        return;
      }

      const confirmationCode = String(response?.confirmation?.confirmationId || '').slice(0, 8).toUpperCase();
      if (response?.code !== 'CHECKOUT_CONFIRMED') {
        throw new Error(response?.message || 'Checkout não confirmado pela API.');
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
            <span className="text-2xl text-nature-400 not-italic mr-1">R$</span>{checkoutAmount.toFixed(2).replace('.', ',')}
          </h2>
        </div>

        {!showPixQR ? (
          <div className="space-y-4 px-2">
            {[
              { id: 'card', icon: CreditCard, label: 'Cartão de Crédito', sub: 'Até 3x sem juros', color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
              { id: 'pix', icon: Smartphone, label: 'PIX Instantâneo', sub: 'Até 10% de cashback', color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
              { id: 'direct', icon: MessageCircle, label: 'Direto com Guardião', sub: 'Combinar via Voucher', color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' }
            ].map((m: { id: string; label: string; icon: React.ElementType; color: string; sub: string; border: string }) => (
              <div
                key={m.id}
                onClick={() => setMethod(m.id as 'card' | 'pix' | 'direct')}
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
            <div className="w-64 min-h-64 bg-white p-6 rounded-[2.5rem] shadow-elegant border-4 border-nature-900 mb-8 flex flex-col items-center justify-center gap-4">
              <QrCode size={128} className="text-nature-900" />
              <p className="text-xs text-nature-600 leading-relaxed">
                O PIX agora é criado no provedor real. Abra a cobrança para concluir o pagamento.
              </p>
              <button
                onClick={() => openProviderWindow(providerPending?.url)}
                className="px-5 py-3 rounded-full bg-nature-900 text-white text-[10px] font-black uppercase tracking-widest"
              >
                Abrir cobrança PIX
              </button>
            </div>
            <h3 className="text-2xl font-serif italic text-nature-900 mb-2">Escaneie para Vibrar</h3>
            <p className="text-xs text-nature-500 max-w-xs leading-relaxed">Depois de pagar no provedor, volte aqui para validar a confirmação 2xx no backend.</p>
            <button onClick={() => {
              setShowPixQR(false);
            }} className="flex items-center gap-2 mt-8 px-6 py-3 bg-nature-50 rounded-full text-[10px] font-black text-nature-500 uppercase tracking-widest hover:bg-nature-100 hover:text-nature-700 transition-all active:scale-95">
              Voltar aos Métodos
            </button>
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
            {loading ? <Loader2 size={24} className="animate-spin text-primary-400" /> : <Lock size={20} className="text-primary-400" />}
            <span className="ml-2">
              {loading
                ? 'Sincronizando...'
                : providerPending
                  ? 'Validar pagamento'
                  : method === 'direct'
                    ? 'Gerar Voucher'
                    : method === 'pix'
                      ? 'Criar cobrança Pix'
                      : 'Ir para o provedor'}
            </span>
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
