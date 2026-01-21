import React, { useState } from 'react';
import { ChevronLeft, CreditCard, QrCode, Wallet, Check, ShoppingBag, Tag, Clock, MapPin, Shield, ChevronRight, X, Truck } from 'lucide-react';
import { Card } from './Common';

interface CartItem {
  id: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE' | 'SOUL_PILL';
  price: number;
  quantity: number;
  image?: string;
  // For services
  date?: string;
  time?: string;
  professional?: string;
}

interface CheckoutFlowProps {
  items: CartItem[];
  userBalance: number;
  onClose: () => void;
  onComplete: (orderData: any) => void;
}

type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BALANCE';
type CheckoutStep = 'review' | 'payment' | 'confirmation';

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  items,
  userBalance,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<CheckoutStep>('review');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedCoupon?.discount || 0;
  const shipping = items.some(i => i.type === 'PRODUCT') ? 15.90 : 0;
  const total = subtotal - discount + shipping;

  const hasServices = items.some(i => i.type === 'SERVICE');
  const hasProducts = items.some(i => i.type === 'PRODUCT');

  const applyCoupon = () => {
    // Mock coupon validation
    if (couponCode.toUpperCase() === 'VIVA10') {
      setAppliedCoupon({ code: 'VIVA10', discount: subtotal * 0.1 });
    } else if (couponCode.toUpperCase() === 'PRIMEIRA') {
      setAppliedCoupon({ code: 'PRIMEIRA', discount: 20 });
    }
  };

  const processPayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setOrderComplete(true);
    setStep('confirmation');
    onComplete({
      items,
      paymentMethod,
      total,
      discount,
      coupon: appliedCoupon?.code,
    });
  };

  // Step: Order Review
  const renderReview = () => (
    <>
      <div className="flex-1 overflow-y-auto p-6 pb-48">
        {/* Items */}
        <div className="space-y-4 mb-6">
          {items.map(item => (
            <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-nature-100">
              <div className="w-16 h-16 bg-nature-100 rounded-xl overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={24} className="text-nature-300" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-nature-900">{item.name}</h4>
                <p className="text-[10px] text-nature-400 uppercase tracking-widest">
                  {item.type === 'SERVICE' ? 'Serviço' : item.type === 'SOUL_PILL' ? 'Farmácia da Alma' : 'Produto'}
                </p>
                
                {item.type === 'SERVICE' && item.date && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-nature-500">
                    <Clock size={12} />
                    <span>{item.date} às {item.time}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-nature-400">Qtd: {item.quantity}</span>
                  <span className="font-bold text-primary-700">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <Tag size={18} className="text-nature-400" />
            {appliedCoupon ? (
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-600">{appliedCoupon.code}</p>
                  <p className="text-xs text-nature-400">-R$ {appliedCoupon.discount.toFixed(2)}</p>
                </div>
                <button onClick={() => setAppliedCoupon(null)} className="p-2 text-nature-400">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Código do cupom"
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                <button
                  onClick={applyCoupon}
                  disabled={!couponCode}
                  className="text-primary-600 font-bold text-sm disabled:opacity-50"
                >
                  Aplicar
                </button>
              </>
            )}
          </div>
        </Card>

        {/* Shipping (for products) */}
        {hasProducts && (
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <Truck size={18} className="text-nature-400" />
              <div className="flex-1">
                <p className="font-bold text-nature-900">Entrega Padrão</p>
                <p className="text-xs text-nature-400">5-7 dias úteis</p>
              </div>
              <span className="font-bold text-nature-900">R$ {shipping.toFixed(2)}</span>
            </div>
          </Card>
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-nature-400 mb-6">
          <Shield size={14} />
          <span>Pagamento 100% seguro</span>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-nature-100 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-nature-500">Subtotal</span>
            <span className="text-nature-900">R$ {subtotal.toFixed(2)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600">Desconto</span>
              <span className="text-emerald-600">-R$ {discount.toFixed(2)}</span>
            </div>
          )}
          {hasProducts && (
            <div className="flex justify-between text-sm">
              <span className="text-nature-500">Frete</span>
              <span className="text-nature-900">R$ {shipping.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg pt-2 border-t border-nature-100">
            <span className="font-bold text-nature-900">Total</span>
            <span className="font-bold text-primary-700">R$ {total.toFixed(2)}</span>
          </div>
        </div>
        
        <button
          onClick={() => setStep('payment')}
          className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs"
        >
          Escolher Pagamento
        </button>
      </div>
    </>
  );

  // Step: Payment Selection
  const renderPayment = () => (
    <>
      <div className="flex-1 overflow-y-auto p-6 pb-48">
        <h3 className="text-lg font-serif italic text-nature-900 mb-6">Como deseja pagar?</h3>

        <div className="space-y-4">
          {/* PIX */}
          <button
            onClick={() => setPaymentMethod('PIX')}
            className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              paymentMethod === 'PIX'
                ? 'border-primary-500 bg-primary-50'
                : 'border-nature-200 bg-white'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              paymentMethod === 'PIX' ? 'bg-primary-500 text-white' : 'bg-nature-100 text-nature-600'
            }`}>
              <QrCode size={24} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-nature-900">PIX</p>
              <p className="text-xs text-nature-400">Aprovação instantânea</p>
            </div>
            {paymentMethod === 'PIX' && <Check size={20} className="text-primary-500" />}
          </button>

          {/* Credit Card */}
          <button
            onClick={() => setPaymentMethod('CREDIT_CARD')}
            className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              paymentMethod === 'CREDIT_CARD'
                ? 'border-primary-500 bg-primary-50'
                : 'border-nature-200 bg-white'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              paymentMethod === 'CREDIT_CARD' ? 'bg-primary-500 text-white' : 'bg-nature-100 text-nature-600'
            }`}>
              <CreditCard size={24} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-nature-900">Cartão de Crédito</p>
              <p className="text-xs text-nature-400">Parcele em até 12x</p>
            </div>
            {paymentMethod === 'CREDIT_CARD' && <Check size={20} className="text-primary-500" />}
          </button>

          {/* Balance */}
          <button
            onClick={() => userBalance >= total && setPaymentMethod('BALANCE')}
            disabled={userBalance < total}
            className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              paymentMethod === 'BALANCE'
                ? 'border-primary-500 bg-primary-50'
                : userBalance < total
                  ? 'border-nature-100 bg-nature-50 opacity-50'
                  : 'border-nature-200 bg-white'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              paymentMethod === 'BALANCE' ? 'bg-primary-500 text-white' : 'bg-nature-100 text-nature-600'
            }`}>
              <Wallet size={24} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-nature-900">Saldo Viva360</p>
              <p className="text-xs text-nature-400">
                Disponível: R$ {userBalance.toFixed(2)}
                {userBalance < total && ' (insuficiente)'}
              </p>
            </div>
            {paymentMethod === 'BALANCE' && <Check size={20} className="text-primary-500" />}
          </button>
        </div>

        {/* Credit card form */}
        {paymentMethod === 'CREDIT_CARD' && (
          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Número do cartão"
              className="w-full p-4 bg-white border border-nature-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200"
            />
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="MM/AA"
                className="flex-1 p-4 bg-white border border-nature-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200"
              />
              <input
                type="text"
                placeholder="CVV"
                className="w-24 p-4 bg-white border border-nature-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <input
              type="text"
              placeholder="Nome no cartão"
              className="w-full p-4 bg-white border border-nature-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        )}

        {/* PIX QR Code */}
        {paymentMethod === 'PIX' && (
          <div className="mt-6 text-center">
            <div className="w-48 h-48 bg-white border-2 border-nature-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode size={120} className="text-nature-900" />
            </div>
            <p className="text-sm text-nature-500">Escaneie o QR Code ou copie o código PIX</p>
            <button className="mt-3 px-6 py-2 bg-nature-100 rounded-full text-sm font-bold text-nature-600">
              Copiar código
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-nature-100 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-between mb-4">
          <span className="font-bold text-nature-900">Total</span>
          <span className="font-bold text-primary-700 text-lg">R$ {total.toFixed(2)}</span>
        </div>
        
        <button
          onClick={processPayment}
          disabled={!paymentMethod || isProcessing}
          className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processando...
            </>
          ) : (
            'Finalizar Compra'
          )}
        </button>
      </div>
    </>
  );

  // Step: Confirmation
  const renderConfirmation = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
        <Check size={48} className="text-emerald-600" />
      </div>
      
      <h2 className="text-2xl font-serif italic text-nature-900 mb-2">Pedido Confirmado!</h2>
      <p className="text-nature-500 mb-8">Obrigado por escolher o Viva360 💜</p>

      <Card className="w-full p-5 mb-6 text-left">
        <p className="text-[10px] text-nature-400 uppercase tracking-widest mb-2">Número do Pedido</p>
        <p className="font-mono font-bold text-nature-900 text-lg">#VV{Date.now().toString().slice(-6)}</p>
      </Card>

      {hasServices && (
        <Card className="w-full p-5 mb-6 text-left">
          <p className="text-[10px] text-nature-400 uppercase tracking-widest mb-3">Próximo Passo</p>
          <p className="text-sm text-nature-600">Você receberá uma confirmação por email com os detalhes da sua sessão.</p>
        </Card>
      )}

      {hasProducts && (
        <Card className="w-full p-5 mb-6 text-left">
          <p className="text-[10px] text-nature-400 uppercase tracking-widest mb-3">Acompanhe seu Pedido</p>
          <p className="text-sm text-nature-600">Enviaremos atualizações sobre o envio por email e notificações no app.</p>
        </Card>
      )}

      <button
        onClick={onClose}
        className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs"
      >
        Voltar ao Início
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      {step !== 'confirmation' && (
        <header className="flex items-center gap-4 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 shadow-sm">
          <button 
            onClick={() => step === 'payment' ? setStep('review') : onClose()} 
            className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h2 className="text-xl font-serif italic text-nature-900">
              {step === 'review' ? 'Resumo do Pedido' : 'Pagamento'}
            </h2>
            <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
        </header>
      )}

      {/* Progress indicators */}
      {step !== 'confirmation' && (
        <div className="flex justify-center gap-2 py-4 bg-white border-b border-nature-100">
          {['review', 'payment', 'confirmation'].map((s, i) => (
            <div 
              key={s}
              className={`w-3 h-3 rounded-full transition-all ${
                s === step ? 'bg-primary-500 w-8' : 
                ['review', 'payment'].indexOf(step) > i ? 'bg-primary-200' : 'bg-nature-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative">
        {step === 'review' && renderReview()}
        {step === 'payment' && renderPayment()}
        {step === 'confirmation' && renderConfirmation()}
      </div>
    </div>
  );
};

export default CheckoutFlow;
