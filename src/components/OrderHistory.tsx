import React, { useState, useEffect } from 'react';
import { Package, ChevronRight, ArrowLeft, Clock, CheckCircle, Truck, X, AlertCircle } from 'lucide-react';
import { OrganicSkeleton } from './Common';

interface OrderItem {
  id: string;
  productName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  type: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  shippingAddress?: string;
  trackingCode?: string;
  createdAt: string;
  orderItems: OrderItem[];
}

interface OrderHistoryProps {
  onBack: () => void;
}

const statusConfig: Record<string, { label: string; icon: React.FC<any>; color: string }> = {
  PENDING: { label: 'Pendente', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  PAID: { label: 'Pago', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
  PROCESSING: { label: 'Processando', icon: Package, color: 'text-blue-600 bg-blue-50' },
  SHIPPED: { label: 'Enviado', icon: Truck, color: 'text-indigo-600 bg-indigo-50' },
  DELIVERED: { label: 'Entregue', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  CANCELLED: { label: 'Cancelado', icon: X, color: 'text-rose-600 bg-rose-50' },
};

const OrderHistory: React.FC<OrderHistoryProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        setError('Erro ao carregar pedidos');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (selectedOrder) {
    const status = statusConfig[selectedOrder.status] || statusConfig.PENDING;
    const StatusIcon = status.icon;
    
    return (
      <div className="bg-[#f4f7f5] min-h-screen p-6 animate-in slide-in-from-right">
        <header className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white rounded-full shadow-sm">
            <ArrowLeft size={20} className="text-nature-600" />
          </button>
          <h2 className="text-xl font-serif italic text-nature-900">Pedido #{selectedOrder.id.slice(-6).toUpperCase()}</h2>
        </header>

        <div className={`flex items-center gap-3 p-4 rounded-2xl mb-6 ${status.color}`}>
          <StatusIcon size={24} />
          <div>
            <p className="font-bold">{status.label}</p>
            <p className="text-xs opacity-70">{formatDate(selectedOrder.createdAt)}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <h3 className="text-xs font-bold text-nature-400 uppercase tracking-wider mb-4">Itens</h3>
          <div className="space-y-4">
            {selectedOrder.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-nature-900">{item.productName}</p>
                  <p className="text-xs text-nature-400">Qtd: {item.quantity}</p>
                </div>
                <p className="font-bold text-nature-900">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-nature-400 uppercase tracking-wider mb-4">Resumo</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-nature-500">Subtotal</span>
              <span className="text-nature-900">{formatCurrency(selectedOrder.subtotal)}</span>
            </div>
            {selectedOrder.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-nature-500">Desconto</span>
                <span className="text-emerald-600">-{formatCurrency(selectedOrder.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-2 mt-2">
              <span className="text-nature-900">Total</span>
              <span className="text-primary-700">{formatCurrency(selectedOrder.total)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f7f5] min-h-screen p-6">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft size={20} className="text-nature-600" />
        </button>
        <h2 className="text-xl font-serif italic text-nature-900">Meus Pedidos</h2>
      </header>

      {loading ? (
        <div className="space-y-4">
          <OrganicSkeleton className="h-24 w-full" />
          <OrganicSkeleton className="h-24 w-full" />
          <OrganicSkeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle size={48} className="text-nature-300 mb-4" />
          <p className="text-nature-500">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package size={48} className="text-nature-300 mb-4" />
          <p className="text-nature-500">Nenhum pedido ainda</p>
          <p className="text-xs text-nature-400">Seus pedidos aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;
            
            return (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="w-full bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between text-left hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.color}`}>
                    <StatusIcon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-nature-900">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-nature-400">{formatDate(order.createdAt)} • {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'itens'}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="font-bold text-nature-900">{formatCurrency(order.total)}</p>
                  <ChevronRight size={16} className="text-nature-300" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
