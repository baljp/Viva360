
import React, { useState, useEffect } from 'react';
import { ViewState, Professional, User, Product, Appointment } from '../types';
import { api } from '../services/api'; 
import { Search, Compass, ShoppingBag, ChevronLeft, ChevronRight, Wind, X, Moon, Sparkles, Heart, Activity, ShoppingCart, Calendar, MapPin, Star, ShieldCheck, Trophy, Leaf, MessageSquare } from 'lucide-react';
import { DynamicAvatar, SoulGarden, ZenToast, PortalCard, DailyBlessing, Card, MoodTracker } from '../components/Common';
import { RitualWizard } from '../components/RitualWizard';
import { ConstellationOrbit, SoulJourneyPlayer, GlobalMandala } from '../components/SocialFeatures';
import { ImageUploader, SimpleActionModal, ComingSoonModal } from '../components/Modals';
import { MeditationScreen, AchievementsScreen } from '../components/NewScreens';
import SoulPharmacy from '../components/SoulPharmacy';
import TribeScreen from '../components/TribeScreen';
import NetworkScreen from '../components/NetworkScreen';
import CheckoutFlow from '../components/CheckoutFlow';
import ChatScreen from '../components/ChatScreen';
import AdvancedSearchScreen from '../components/AdvancedSearch';
import { NanoDashboard } from './NanoDashboard';

const PortalView: React.FC<{ title: string, subtitle: string, onBack: () => void, children: React.ReactNode }> = ({ title, subtitle, onBack, children }) => (
    <div className="fixed inset-0 z-[150] flex flex-col bg-nature-50/50 backdrop-blur-xl animate-in slide-in-from-right duration-300 selection:bg-primary-500 selection:text-white">
        <header className="flex-none flex items-center gap-4 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white/80 backdrop-blur-md border-b border-white/40 shadow-sm z-10">
            <button onClick={onBack} className="p-3 bg-nature-50 rounded-full text-nature-600 active:scale-95 transition-all hover:bg-nature-100"><ChevronLeft size={22} /></button>
            <div className="space-y-0.5"><h2 className="text-xl font-serif font-medium text-nature-900 leading-none">{title}</h2><p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">{subtitle}</p></div>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar pb-[calc(4rem+env(safe-area-inset-bottom))] pt-6 px-6">{children}</div>
    </div>
);

import { SchedulingModal } from '../components/SchedulingModal';

export const ClientViews: React.FC<{ 
  user: User, view: ViewState, setView: (v: ViewState) => void, updateUser: (u: User) => void, onAddToCart: (p: Product) => void
}> = ({ user, view, setView, updateUser, onAddToCart }) => {
  const [pros, setPros] = useState<Professional[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);
  const [journeyPeriod, setJourneyPeriod] = useState<'week' | 'month'>('week');
  const [showUpload, setShowUpload] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [searchType, setSearchType] = useState<'professionals' | 'products'>('professionals');
  
  // Scheduling State
  const [showScheduler, setShowScheduler] = useState(false);
  const [pendingServiceItem, setPendingServiceItem] = useState<Product | null>(null);

  const handleAvatarUpdate = async (url: string) => {
      const updated = { ...user, avatar: url };
      await api.users.update(updated as User);
      updateUser(updated as User);
      setToast({ title: "Renovação Visual", message: "Sua nova face foi revelada ao mundo." });
  };

  useEffect(() => { 
    api.professionals.list().then(setPros);
    api.marketplace.listAll().then(setProducts);
    setIsLoading(false);
  }, []);

  const handleMoodSelect = async (mood: any) => {
      // Optimistic Update: Update UI immediately
      const previousUser = { ...user };
      const optimisticallyUpdated = { ...user, lastMood: mood };
      
      updateUser(optimisticallyUpdated as User);
      setToast({ title: "Sincronia Energética", message: `Frequência ${mood} ancorada.` });

      try {
        await api.users.update(optimisticallyUpdated as User);
      } catch (error) {
        // Revert on failure
        console.error("Failed to sync mood:", error);
        updateUser(previousUser);
        setToast({ title: "Falha na Sincronia", message: "Não foi possível salvar seu humor. Tente novamente." });
      }
  };

  const handleServiceSelect = (serviceItem: Product) => {
      setPendingServiceItem(serviceItem);
      setShowScheduler(true);
  };

  const handleScheduleConfirm = (date: Date, time: string) => {
      if (pendingServiceItem && selectedPro) {
          onAddToCart({
              ...pendingServiceItem,
              appointmentDetails: {
                  date: date.toISOString(),
                  time: time,
                  professionalId: selectedPro.id,
                  professionalName: selectedPro.name
              }
          } as any); // Cast slightly due to types but runtime works
          
          setShowScheduler(false);
          setPendingServiceItem(null);
          setToast({ title: "Agendamento Iniciado", message: `Sessão agendada para ${date.toLocaleDateString()} às ${time}. Finalize no carrinho.` });
      }
  };

  if (showAdvancedSearch) return (
      <AdvancedSearchScreen 
          searchType={searchType}
          onClose={() => setShowAdvancedSearch(false)}
          onSelectProfessional={(pro) => {
              setSelectedPro(pro);
              setView(ViewState.CLIENT_PRO_DETAILS);
              setShowAdvancedSearch(false);
          }}
      />
  );

  // --- SUB-TELA: DETALHES DO PROFISSIONAL ---
  if (view === ViewState.CLIENT_PRO_DETAILS && selectedPro) return (
    <>
      {showChat && (
        <ChatScreen 
          currentUser={user}
          partner={selectedPro ? { 
            id: selectedPro.userId, // Use userId for chat
            name: selectedPro.name, 
            avatar: selectedPro.avatar 
          } : undefined}
          onClose={() => setShowChat(false)}
        />
      )}

      {showScheduler && pendingServiceItem && (
          <SchedulingModal 
              professional={selectedPro}
              serviceName={pendingServiceItem.name}
              onClose={() => setShowScheduler(false)}
              onConfirm={handleScheduleConfirm}
          />
      )}
      
      <PortalView title={selectedPro.name} subtitle="GUARDIÃO VERIFICADO" onBack={() => setView(ViewState.CLIENT_EXPLORE)}>
        <div className="space-y-8 pb-12">
            <div className="flex flex-col items-center gap-4">
                <DynamicAvatar user={selectedPro} size="xl" className="border-4 border-white shadow-2xl shadow-nature-900/10" />
                <div className="text-center">
                    <h3 className="text-2xl font-serif font-medium text-nature-900">{selectedPro.name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-nature-900">{selectedPro.rating}</span>
                        <span className="text-nature-300">•</span>
                        <span className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">{selectedPro.specialty[0]}</span>
                    </div>
                </div>
                
                <button 
                  onClick={() => setShowChat(true)}
                  className="px-6 py-2 bg-nature-100/50 text-nature-700 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-nature-100 transition-colors border border-nature-200"
                >
                  <MessageSquare size={14} />
                  Enviar Mensagem
                </button>
            </div>

            <Card className="p-8 space-y-4 bg-white/60 backdrop-blur-md border-white/40">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-primary-400"/> Sobre o Guardião</h4>
                <p className="text-sm text-nature-600 leading-relaxed italic font-serif">"{selectedPro.bio}"</p>
            </Card>

            <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Rituais Disponíveis</h4>
                {selectedPro.specialty.map((spec, i) => (
                    <button key={i} onClick={() => {
                        handleServiceSelect({ id: `svc_${selectedPro.id}_${i}`, name: `Ritual: ${spec}`, price: selectedPro.pricePerSession, image: selectedPro.avatar, category: 'Serviço', type: 'service' });
                    }} className="w-full bg-white p-6 rounded-[2rem] border border-nature-100 flex items-center justify-between shadow-sm active:scale-95 transition-all hover:border-primary-200 group">
                        <div className="flex items-center gap-5 text-left">
                            <div className="p-4 bg-primary-50 text-primary-600 rounded-2xl group-hover:bg-primary-100 transition-colors"><Activity size={20} /></div>
                            <div><h5 className="font-bold text-nature-900 text-sm">{spec}</h5><p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest mt-0.5">60 MIN • ONLINE</p></div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-serif font-medium text-primary-700">{selectedPro.pricePerSession} cr</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    </PortalView>
    </>
  );

  if (view === ViewState.CLIENT_SOUL_PHARMACY) return (
      <SoulPharmacy 
          user={user} 
          currentMood={user.lastMood} 
          onClose={() => setView(ViewState.CLIENT_HOME)} 
          onPurchase={(pill) => {
              onAddToCart({ 
                  id: pill.id, 
                  name: pill.title, 
                  price: pill.price, 
                  image: pill.thumbnailUrl || '', 
                  category: 'Farmácia da Alma', 
                  type: 'digital' 
              });
              setToast({ title: "Adicionado à Sacola", message: "Pílula adicionada com sucesso." });
          }} 
      />
  );

  if (view === ViewState.CLIENT_TRIBO) return (
      <TribeScreen 
          user={user} 
          onClose={() => setView(ViewState.CLIENT_HOME)} 
          onSendEnergy={() => setToast({ title: "Energia Enviada", message: "Sua vibração foi compartilhada." })} 
          onOpenChat={() => {}} 
      />
  );

  if (view === ViewState.CLIENT_NETWORK) return (
      <NetworkScreen 
          user={user} 
          onClose={() => setView(ViewState.CLIENT_HOME)} 
          onConnect={() => setToast({ title: "Convite Enviado", message: "Solicitação de conexão enviada." })}
          onAcceptConnection={() => {}}
          onOpenChat={() => {}}
      />
  );

  if (view === ViewState.CLIENT_CHECKOUT) return (
      <CheckoutFlow 
          items={[]} // Should be passed from props or context
          userBalance={user.personalBalance} 
          onClose={() => setView(ViewState.CLIENT_MARKETPLACE)} 
          onComplete={() => {
              setToast({ title: "Compra Realizada", message: "Seu pedido foi processado com sucesso!" });
              setTimeout(() => setView(ViewState.CLIENT_HOME), 2000);
          }} 
      />
  );

  // --- SUB-TELA: DETALHES DO PRODUTO (Mantendo existente) ---
  if (view === ViewState.CLIENT_PRODUCT_DETAILS && selectedProduct) return (
    <PortalView title="O Bazar" subtitle="DETALHES DA FERRAMENTA" onBack={() => setView(ViewState.CLIENT_MARKETPLACE)}>
        <div className="space-y-8">
            <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl shadow-nature-900/10 border-4 border-white">
                <img src={selectedProduct.image} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-3 text-center">
                <span className="px-4 py-1.5 bg-nature-100 text-nature-600 rounded-full text-[10px] font-bold uppercase tracking-widest">{selectedProduct.category}</span>
                <h3 className="text-3xl font-serif font-medium text-nature-900 leading-tight">{selectedProduct.name}</h3>
            </div>
            <p className="text-sm text-nature-500 leading-relaxed font-serif text-center max-w-xs mx-auto">"{selectedProduct.description || "Uma ferramenta sagrada para auxiliar sua jornada de autoconhecimento e equilíbrio."}"</p>
            
            <div className="flex items-center justify-between p-8 bg-white/80 backdrop-blur-md rounded-[3rem] border border-white/50 shadow-lg shadow-nature-900/5 mt-8">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Troca</p>
                    <p className="text-3xl font-serif font-medium text-primary-700">R$ {selectedProduct.price.toFixed(2)}</p>
                </div>
                <button 
                    onClick={() => { onAddToCart(selectedProduct); setView(ViewState.CLIENT_MARKETPLACE); }}
                    className="px-10 py-5 bg-nature-900 text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-xl shadow-nature-900/20 active:scale-95 transition-all hover:bg-nature-800"
                >
                    Adicionar
                </button>
            </div>
        </div>
    </PortalView>
  );

  // --- SUB-TELA: EXPLORAR ---
  if (view === ViewState.CLIENT_EXPLORE) return (
      <PortalView title="Explorar" subtitle="MAPA DE CURA" onBack={() => setView(ViewState.CLIENT_HOME)}>
          <div className="space-y-6">
              <div className="relative group" onClick={() => setShowAdvancedSearch(true)}>
                  <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-nature-400 group-focus-within:text-primary-500 transition-colors" />
                  <input readOnly placeholder="Busque por mestre, técnica ou alívio..." className="w-full bg-white border border-nature-100 py-6 pl-14 pr-6 rounded-[2rem] outline-none shadow-sm focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer placeholder:text-nature-300 text-sm font-medium" />
              </div>
              <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Guardiões Disponíveis</h4>
                  {pros.map(pro => (
                    <button key={pro.id} onClick={() => { setSelectedPro(pro); setView(ViewState.CLIENT_PRO_DETAILS); }} className="w-full bg-white p-5 rounded-[2.5rem] border border-nature-100 flex items-center gap-5 shadow-sm active:scale-[0.98] transition-all hover:border-primary-200 text-left hover:shadow-md">
                        <DynamicAvatar user={pro} size="lg" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-nature-900 truncate text-base">{pro.name}</h4>
                            <p className="text-[10px] text-nature-400 font-bold uppercase tracking-tighter truncate mt-0.5">{pro.specialty.join(' • ')}</p>
                            <div className="flex items-center gap-1 mt-2 text-amber-500 font-bold text-[10px] bg-amber-50 self-start px-2 py-0.5 rounded-full w-fit">
                                <Star size={10} fill="currentColor"/> {pro.rating.toFixed(1)} • {pro.pricePerSession} cr
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-nature-200" />
                    </button>
                  ))}
              </div>
          </div>
      </PortalView>
  );

  // --- SUB-TELA: BAZAR ---
  const [marketplaceTab, setMarketplaceTab] = useState<'all' | 'physical' | 'digital' | 'service'>('all');
  
  if (view === ViewState.CLIENT_MARKETPLACE) return (
      <PortalView title="Bazar" subtitle="FERRAMENTAS DE LUZ" onBack={() => setView(ViewState.CLIENT_HOME)}>
          <div className="space-y-6">
              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {[
                      { id: 'all', label: 'Tudo' },
                      { id: 'physical', label: 'Físico' },
                      { id: 'digital', label: 'Digital' },
                      { id: 'service', label: 'Vivências' },
                      { id: 'event', label: 'Eventos' },
                  ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setMarketplaceTab(tab.id as any)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                            marketplaceTab === tab.id 
                                ? 'bg-nature-900 text-white shadow-lg shadow-nature-900/10' 
                                : 'bg-white border border-nature-200 text-nature-400 hover:border-nature-300'
                        }`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  {products
                    .filter(p => marketplaceTab === 'all' || p.type === marketplaceTab)
                    .map(product => (
                      <button key={product.id} onClick={() => { setSelectedProduct(product); setView(ViewState.CLIENT_PRODUCT_DETAILS); }} className="bg-white rounded-[2.5rem] border border-nature-100 overflow-hidden shadow-sm flex flex-col group text-left h-full hover:shadow-md transition-all">
                          <div className="aspect-square relative overflow-hidden">
                            <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute top-4 right-4"><span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-bold uppercase tracking-widest text-nature-900">{product.category}</span></div>
                            <div className="absolute bottom-4 left-4">
                                {product.type === 'physical' && <span className="p-2 bg-white/90 rounded-full text-nature-900 shadow-sm"><ShoppingBag size={12}/></span>}
                                {product.type === 'digital' && <span className="p-2 bg-white/90 rounded-full text-nature-900 shadow-sm"><Wind size={12}/></span>}
                                {(product.type === 'service' || product.type === 'event') && <span className="p-2 bg-white/90 rounded-full text-nature-900 shadow-sm"><Calendar size={12}/></span>}
                            </div>
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <h4 className="font-bold text-nature-900 text-sm leading-tight mb-2 truncate">{product.name}</h4>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-sm font-serif italic text-primary-700">R$ {product.price.toFixed(2)}</span>
                                <div className="p-3 bg-nature-50 text-nature-300 rounded-2xl group-hover:bg-nature-900 group-hover:text-white transition-all"><ShoppingCart size={16}/></div>
                            </div>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      </PortalView>
  );

  // --- SUB-TELA: RITUAL (WIZARD) ---
  if (view === ViewState.CLIENT_RITUAL) {
    return (
      <RitualWizard 
        user={user}
        onClose={() => setView(ViewState.CLIENT_HOME)}
        onComplete={async (data) => {
             try {
                 const res = await api.rituals.checkIn(data.mood, undefined, data.image);
                 if (res.success && res.user) {
                     updateUser(res.user);
                     setToast({ title: "Ritual Completo", message: res.message });
                 } else {
                     setToast({ title: "Ritual", message: res.message });
                 }
             } catch (e) {
                 console.error(e);
                 setToast({ title: "Erro", message: "Falha ao registrar ritual." });
             }
             setView(ViewState.CLIENT_HOME);
        }}
      />
    );
  }

  // --- SUB-TELA: MEDITAÇÃO GUIADA ---
  if (view === ViewState.CLIENT_MEDITATION) {
    return (
      <MeditationScreen 
        onClose={() => setView(ViewState.CLIENT_HOME)} 
        onComplete={(minutes, karma) => {
          updateUser({...user, karma: (user.karma || 0) + karma, plantXp: (user.plantXp || 0) + minutes * 2});
          setToast({ title: "Meditação Completa", message: `+${karma} Karma • +${minutes * 2} XP da Planta` });
        }}
      />
    );
  }

  // --- SUB-TELA: CONQUISTAS ---
  if (view === ViewState.CLIENT_ACHIEVEMENTS) {
    return (
      <AchievementsScreen 
        user={user}
        onClose={() => setView(ViewState.CLIENT_HOME)}
      />
    );
  }

  // --- SUB-TELA: JORNADA ---
  if (view === ViewState.CLIENT_JOURNEY) return (
      <PortalView title="Jornada" subtitle="METAMORFOSE" onBack={() => setView(ViewState.CLIENT_HOME)}>
          <div className="space-y-8">
              <SoulJourneyPlayer snaps={user.snaps || []} period={journeyPeriod} setPeriod={setJourneyPeriod as any} />
              <Card className="p-8 text-center space-y-4">
                  <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto text-primary-600"><Activity size={32}/></div>
                  <h3 className="text-2xl font-serif italic text-nature-900">Análise de Frequência</h3>
                  <p className="text-xs text-nature-400 leading-relaxed">Seus padrões sugerem uma evolução gradual da serenidade esta semana. Continue regando sua essência.</p>
              </Card>
          </div>
      </PortalView>
  );

  // --- SUB-TELA: TRIBO ---
  // @ts-ignore
  if (view === ViewState.CLIENT_TRIBO) return (
      <PortalView title="Tribo" subtitle="CÍRCULO DE CONFIANÇA" onBack={() => setView(ViewState.CLIENT_HOME)}>
          <div className="space-y-8">
              <ConstellationOrbit user={user} onUpdateUser={updateUser} />
              <GlobalMandala />
          </div>
      </PortalView>
  );

  return (
    <>
      {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
      <ImageUploader isOpen={showUpload} onClose={() => setShowUpload(false)} onSelect={handleAvatarUpdate} />
      <NanoDashboard 
        user={user} 
        setView={setView} 
        onAddToCart={onAddToCart} 
        onMoodSelect={handleMoodSelect}
        onCheckIn={async () => {
             // Optimistic Update for Check-in
             const previousUser = { ...user };
             const expectedReward = 50 * (user.multiplier || 1);
             const optimisticUser = {
                 ...user,
                 karma: (user.karma || 0) + expectedReward,
                 streak: (user.streak || 0) + 1,
                 lastCheckIn: new Date().toISOString().split('T')[0] // Mark as checked-in today
             };

             updateUser(optimisticUser);
             setToast({ title: "Bênção Recebida", message: `+${expectedReward} Karma (Otimista)` });

             try {
                 const res = await api.rituals.checkIn(user.lastMood);
                 
                 // If successful, the server returns the authoritative state which might differ slightly
                 // but visually it felt instant.
                 if (res.success && res.user) {
                     updateUser(res.user); // Re-sync with server truth
                     // Toast already shown, maybe update message if needed, or just silent sync
                 } else {
                     // Logic error (e.g. already checked in), revert
                     updateUser(previousUser);
                     setToast({ title: "Já Sintonizado", message: res.message });
                 }
             } catch (e: any) {
                 // Network error, revert
                 updateUser(previousUser);
                 setToast({ title: "Erro de Conexão", message: "Não foi possível sintonizar. Tente novamente." });
             }
        }}
      />
    </>
  );
};
