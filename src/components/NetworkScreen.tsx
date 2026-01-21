import React, { useState, useEffect } from 'react';
import { ChevronLeft, Users, MessageCircle, Share2, Repeat, Gift, Plus, Check, X, ChevronRight, Star, MapPin, Sparkles, Filter } from 'lucide-react';
import { User } from '../types';
import { Card, DynamicAvatar } from './Common';

interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    specialty: string[];
    rating: number;
    location?: string;
  };
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
}

interface SwapRequest {
  id: string;
  requester: {
    id: string;
    name: string;
    avatar?: string;
  };
  offerService: string;
  requestService: string;
  offerHours: number;
  requestHours: number;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED';
}

interface NetworkScreenProps {
  user: User;
  onClose: () => void;
  onConnect: (userId: string, message?: string) => void;
  onAcceptConnection: (connectionId: string) => void;
  onOpenChat: (userId: string) => void;
}

export const NetworkScreen: React.FC<NetworkScreenProps> = ({
  user,
  onClose,
  onConnect,
  onAcceptConnection,
  onOpenChat,
}) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'connections' | 'swaps' | 'discover'>('connections');
  const [isLoading, setIsLoading] = useState(true);
  const [showConnect, setShowConnect] = useState<string | null>(null);
  const [connectMessage, setConnectMessage] = useState('');

  // Mock data
  useEffect(() => {
    const mockConnections: Connection[] = [
      {
        id: '1',
        user: { id: '1', name: 'Luna Chen', specialty: ['Yoga', 'Meditação'], rating: 4.9, location: 'São Paulo' },
        status: 'ACCEPTED',
        createdAt: '2024-01-10',
      },
      {
        id: '2',
        user: { id: '2', name: 'Marco Silva', specialty: ['Reiki', 'Terapia Holística'], rating: 4.8, location: 'Rio de Janeiro' },
        status: 'ACCEPTED',
        createdAt: '2024-01-15',
      },
      {
        id: '3',
        user: { id: '3', name: 'Sofia Ramalho', specialty: ['Yoga', 'Ayurveda'], rating: 4.7, location: 'Belo Horizonte' },
        status: 'PENDING',
        createdAt: '2024-01-20',
      },
    ];

    const mockSwaps: SwapRequest[] = [
      {
        id: '1',
        requester: { id: '1', name: 'Luna Chen' },
        offerService: 'Sessão de Yoga',
        requestService: 'Sessão de Reiki',
        offerHours: 1,
        requestHours: 1,
        status: 'PENDING',
      },
      {
        id: '2',
        requester: { id: '2', name: 'Marco Silva' },
        offerService: 'Massagem Ayurvédica',
        requestService: 'Meditação Guiada',
        offerHours: 1.5,
        requestHours: 1,
        status: 'ACCEPTED',
      },
    ];

    setConnections(mockConnections);
    setSwapRequests(mockSwaps);
    setIsLoading(false);
  }, []);

  // Discover - professionals to connect
  const discoverPros = [
    { id: '10', name: 'Ana Castelo', specialty: ['Astrologia', 'Tarot'], rating: 4.9, location: 'Curitiba' },
    { id: '11', name: 'João Luz', specialty: ['Acupuntura'], rating: 4.8, location: 'Salvador' },
    { id: '12', name: 'Maria Flor', specialty: ['Aromaterapia', 'Massagem'], rating: 4.7, location: 'Fortaleza' },
  ];

  const acceptedConnections = connections.filter(c => c.status === 'ACCEPTED');
  const pendingConnections = connections.filter(c => c.status === 'PENDING');

  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 shadow-sm">
        <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h2 className="text-xl font-serif italic text-nature-900">Rede Alquímica</h2>
          <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">CONEXÕES PROFISSIONAIS</p>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="flex gap-4 px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-nature-100">
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-indigo-700">{acceptedConnections.length}</p>
          <p className="text-[10px] text-indigo-600/70 uppercase tracking-widest">Conexões</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-purple-700">{swapRequests.filter(s => s.status === 'COMPLETED').length}</p>
          <p className="text-[10px] text-purple-600/70 uppercase tracking-widest">Trocas</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-amber-700">{pendingConnections.length}</p>
          <p className="text-[10px] text-amber-600/70 uppercase tracking-widest">Pendentes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-6 py-4 bg-white border-b border-nature-100">
        {[
          { id: 'connections', label: 'Conexões', icon: Users },
          { id: 'swaps', label: 'Trocas', icon: Repeat },
          { id: 'discover', label: 'Descobrir', icon: Sparkles },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-nature-900 text-white'
                : 'bg-nature-50 text-nature-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {activeTab === 'connections' && (
          <div className="space-y-6">
            {/* Pending */}
            {pendingConnections.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-3">Solicitações Pendentes</h3>
                <div className="space-y-3">
                  {pendingConnections.map(conn => (
                    <Card key={conn.id} className="p-4 border-amber-200 bg-amber-50/50">
                      <div className="flex items-center gap-4">
                        <DynamicAvatar user={conn.user} size="md" />
                        <div className="flex-1">
                          <h4 className="font-bold text-nature-900">{conn.user.name}</h4>
                          <p className="text-[10px] text-nature-400">{conn.user.specialty.join(' • ')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAcceptConnection(conn.id)}
                            className="p-2 bg-emerald-500 text-white rounded-xl"
                          >
                            <Check size={18} />
                          </button>
                          <button className="p-2 bg-nature-100 text-nature-400 rounded-xl">
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted */}
            <div>
              <h3 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-3">Suas Conexões</h3>
              <div className="space-y-3">
                {acceptedConnections.map(conn => (
                  <Card key={conn.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <DynamicAvatar user={conn.user} size="md" />
                      <div className="flex-1">
                        <h4 className="font-bold text-nature-900">{conn.user.name}</h4>
                        <p className="text-[10px] text-nature-400">{conn.user.specialty.join(' • ')}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-amber-500">
                            <Star size={12} fill="currentColor" />
                            {conn.user.rating}
                          </span>
                          {conn.user.location && (
                            <span className="flex items-center gap-1 text-xs text-nature-400">
                              <MapPin size={12} />
                              {conn.user.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onOpenChat(conn.user.id)}
                          className="p-2 bg-primary-50 text-primary-600 rounded-xl"
                        >
                          <MessageCircle size={18} />
                        </button>
                        <button className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Repeat size={18} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'swaps' && (
          <div className="space-y-4">
            <button className="w-full p-4 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl flex items-center justify-center gap-2 text-indigo-600 font-bold">
              <Plus size={20} />
              Propor Nova Troca
            </button>

            {swapRequests.map(swap => (
              <Card key={swap.id} className="p-5">
                <div className="flex items-start gap-4">
                  <DynamicAvatar user={swap.requester} size="md" />
                  <div className="flex-1">
                    <h4 className="font-bold text-nature-900">{swap.requester.name}</h4>
                    
                    <div className="mt-3 p-3 bg-nature-50 rounded-xl">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-center">
                          <p className="text-[10px] text-nature-400 uppercase">Oferece</p>
                          <p className="font-medium text-nature-900">{swap.offerService}</p>
                          <p className="text-xs text-nature-400">{swap.offerHours}h</p>
                        </div>
                        <Repeat size={20} className="text-nature-300" />
                        <div className="text-center">
                          <p className="text-[10px] text-nature-400 uppercase">Solicita</p>
                          <p className="font-medium text-nature-900">{swap.requestService}</p>
                          <p className="text-xs text-nature-400">{swap.requestHours}h</p>
                        </div>
                      </div>
                    </div>

                    {swap.status === 'PENDING' && (
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold">
                          Aceitar
                        </button>
                        <button className="flex-1 py-2 bg-nature-100 text-nature-600 rounded-xl text-xs font-bold">
                          Recusar
                        </button>
                      </div>
                    )}

                    {swap.status === 'ACCEPTED' && (
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mt-3">✓ Troca Aceita</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
              {['Todas', 'Yoga', 'Reiki', 'Meditação', 'Terapia'].map(filter => (
                <button
                  key={filter}
                  className="px-4 py-2 bg-white border border-nature-200 rounded-full text-xs font-bold text-nature-600 whitespace-nowrap"
                >
                  {filter}
                </button>
              ))}
            </div>

            {discoverPros.map(pro => (
              <Card key={pro.id} className="p-5">
                <div className="flex items-center gap-4">
                  <DynamicAvatar user={pro} size="lg" />
                  <div className="flex-1">
                    <h4 className="font-bold text-nature-900">{pro.name}</h4>
                    <p className="text-[10px] text-nature-400">{pro.specialty.join(' • ')}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <Star size={12} fill="currentColor" />
                        {pro.rating}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-nature-400">
                        <MapPin size={12} />
                        {pro.location}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConnect(pro.id)}
                    className="p-3 bg-primary-500 text-white rounded-xl"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showConnect && (
        <div className="fixed inset-0 z-[300] flex items-end animate-in fade-in">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowConnect(null)} />
          <div className="relative w-full bg-white rounded-t-[2rem] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom">
            <div className="w-12 h-1 bg-nature-200 rounded-full mx-auto mb-6" />
            
            <h3 className="text-xl font-serif italic text-nature-900 text-center mb-6">Enviar Convite</h3>

            <textarea
              value={connectMessage}
              onChange={(e) => setConnectMessage(e.target.value)}
              placeholder="Escreva uma mensagem personalizada (opcional)..."
              className="w-full p-4 bg-nature-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-200 resize-none h-24"
            />

            <button
              onClick={() => { onConnect(showConnect, connectMessage); setShowConnect(null); }}
              className="w-full mt-4 py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs"
            >
              Enviar Convite de Conexão
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkScreen;
