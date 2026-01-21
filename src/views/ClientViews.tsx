
import React, { useState, useEffect } from 'react';
import { ViewState, Professional, User, Product, Appointment } from '../types';
import { api } from '../services/api'; 
import { Search, Compass, ShoppingBag, ChevronLeft, ChevronRight, Wind, X, Moon, Sparkles, Heart, Activity, ShoppingCart, Calendar, MapPin, Star, ShieldCheck, Trophy, Leaf, MessageSquare } from 'lucide-react';
import { DynamicAvatar, SoulGarden, ZenToast, PortalCard, DailyBlessing, Card, MoodTracker } from '../components/Common';
import { ConstellationOrbit, SoulJourneyPlayer, GlobalMandala } from '../components/SocialFeatures';
import { ImageUploader, SimpleActionModal, ComingSoonModal } from '../components/Modals';
import { MeditationScreen, AchievementsScreen } from '../components/NewScreens';
import SoulPharmacy from '../components/SoulPharmacy';
import TribeScreen from '../components/TribeScreen';
import NetworkScreen from '../components/NetworkScreen';
import CheckoutFlow from '../components/CheckoutFlow';
import ChatScreen from '../components/ChatScreen';
import AdvancedSearchScreen from '../components/AdvancedSearch';

const PortalView: React.FC<{ title: string, subtitle: string, onBack: () => void, children: React.ReactNode }> = ({ title, subtitle, onBack, children }) => (
    <div className="fixed inset-0 z-[150] flex flex-col bg-nature-50 animate-in slide-in-from-right duration-300">
        <header className="flex-none flex items-center gap-4 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 shadow-sm">
            <button onClick={onBack} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all"><ChevronLeft size={22} /></button>
            <div className="space-y-0.5"><h2 className="text-xl font-serif italic text-nature-900 leading-none">{title}</h2><p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">{subtitle}</p></div>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar pb-[calc(4rem+env(safe-area-inset-bottom))] pt-6 px-6">{children}</div>
    </div>
);

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
      const updated = { ...user, lastMood: mood };
      await api.users.update(updated as User);
      updateUser(updated as User);
      setToast({ title: "Sincronia Energética", message: `Frequência ${mood} ancorada com sucesso.` });
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
      
      <PortalView title={selectedPro.name} subtitle="GUARDIÃO VERIFICADO" onBack={() => setView(ViewState.CLIENT_EXPLORE)}>
        <div className="space-y-8 pb-12">
            <div className="flex flex-col items-center gap-4">
                <DynamicAvatar user={selectedPro} size="xl" className="border-4 border-white shadow-2xl" />
                <div className="text-center">
                    <h3 className="text-2xl font-serif italic text-nature-900">{selectedPro.name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-nature-900">{selectedPro.rating}</span>
                        <span className="text-nature-300">•</span>
                        <span className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">{selectedPro.specialty[0]}</span>
                    </div>
                </div>
                
                <button 
                  onClick={() => setShowChat(true)}
                  className="px-6 py-2 bg-nature-100 text-nature-700 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-nature-200 transition-colors"
                >
                  <MessageSquare size={14} />
                  Enviar Mensagem
                </button>
            </div>

            <Card className="p-6 space-y-4">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} /> Sobre o Guardião</h4>
                <p className="text-sm text-nature-600 leading-relaxed italic">"{selectedPro.bio}"</p>
            </Card>

            <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Rituais Disponíveis</h4>
                {selectedPro.specialty.map((spec, i) => (
                    <button key={i} onClick={() => {
                        onAddToCart({ id: `svc_${selectedPro.id}_${i}`, name: `Ritual: ${spec}`, price: selectedPro.pricePerSession, image: selectedPro.avatar, category: 'Serviço', type: 'service' });
                        setToast({ title: "Agendamento Iniciado", message: "Sessão adicionada à sacola." });
                    }} className="w-full bg-white p-6 rounded-[2.5rem] border border-nature-100 flex items-center justify-between shadow-sm active:scale-95 transition-all">
                        <div className="flex items-center gap-4 text-left">
                            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl"><Activity size={18} /></div>
                            <div><h5 className="font-bold text-nature-900 text-sm">{spec}</h5><p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">60 MIN • ONLINE</p></div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-serif italic text-primary-700">{selectedPro.pricePerSession} cr</p>
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
                  type: 'digital_content' 
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
            <div className="aspect-square rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white">
                <img src={selectedProduct.image} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-2">
                <h3 className="text-3xl font-serif italic text-nature-900 leading-tight">{selectedProduct.name}</h3>
                <span className="px-3 py-1 bg-nature-200 text-nature-600 rounded-full text-[10px] font-bold uppercase tracking-widest">{selectedProduct.category}</span>
            </div>
            <p className="text-sm text-nature-500 leading-relaxed italic">{selectedProduct.description || "Uma ferramenta sagrada para auxiliar sua jornada de autoconhecimento e equilíbrio."}</p>
            
            <div className="flex items-center justify-between p-8 bg-white rounded-[3rem] border border-nature-100 shadow-sm">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Troca</p>
                    <p className="text-2xl font-serif italic text-primary-700">R$ {selectedProduct.price.toFixed(2)}</p>
                </div>
                <button 
                    onClick={() => { onAddToCart(selectedProduct); setView(ViewState.CLIENT_MARKETPLACE); }}
                    className="px-10 py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                >
                    Adicionar à Sacola
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
                  <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-nature-300 group-focus-within:text-primary-500" />
                  <input readOnly placeholder="Busque por mestre, técnica ou alívio..." className="w-full bg-white border border-nature-100 py-6 pl-14 pr-6 rounded-[2.5rem] outline-none shadow-sm focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer" />
              </div>
              <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Guardiões Disponíveis</h4>
                  {pros.map(pro => (
                    <button key={pro.id} onClick={() => { setSelectedPro(pro); setView(ViewState.CLIENT_PRO_DETAILS); }} className="w-full bg-white p-6 rounded-[2.5rem] border border-nature-100 flex items-center gap-5 shadow-sm active:scale-[0.98] transition-all hover:border-primary-200 text-left">
                        <DynamicAvatar user={pro} size="lg" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-nature-900 truncate">{pro.name}</h4>
                            <p className="text-[10px] text-nature-400 font-bold uppercase tracking-tighter truncate">{pro.specialty.join(' • ')}</p>
                            <div className="flex items-center gap-1 mt-1 text-amber-500 font-bold text-[10px]">
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
  if (view === ViewState.CLIENT_MARKETPLACE) return (
      <PortalView title="Bazar" subtitle="FERRAMENTAS DE LUZ" onBack={() => setView(ViewState.CLIENT_HOME)}>
          <div className="grid grid-cols-2 gap-4">
              {products.map(product => (
                  <button key={product.id} onClick={() => { setSelectedProduct(product); setView(ViewState.CLIENT_PRODUCT_DETAILS); }} className="bg-white rounded-[2.5rem] border border-nature-100 overflow-hidden shadow-sm flex flex-col group text-left">
                      <div className="aspect-square relative overflow-hidden">
                        <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute top-4 right-4"><span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-bold uppercase tracking-widest text-nature-900">{product.category}</span></div>
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
      </PortalView>
  );

  // --- SUB-TELA: RITUAL ---
  if (view === ViewState.CLIENT_RITUAL) {
    return (
      <div className="fixed inset-0 z-[200] bg-nature-900 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <button onClick={() => setView(ViewState.CLIENT_HOME)} className="absolute top-12 right-8 p-3 bg-white/10 text-white rounded-full"><X size={24} /></button>
        <div className="w-64 h-64 rounded-full border-4 border-white/10 flex items-center justify-center animate-breathe">
             <Wind size={64} className="text-white opacity-80" />
        </div>
        <h2 className="text-4xl font-serif italic text-white mt-12">Respire...</h2>
        <p className="text-nature-400 mt-6 max-w-xs italic leading-relaxed">Deixe o mundo lá fora por um instante. Sincronize sua batida com o pulso da terra.</p>
      </div>
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
  if (view === ViewState.CLIENT_TRIBO) return (
      <PortalView title="Tribo" subtitle="CÍRCULO DE CONFIANÇA" onBack={() => setView(ViewState.CLIENT_HOME)}>
          <div className="space-y-8">
              <ConstellationOrbit user={user} onUpdateUser={updateUser} />
              <GlobalMandala />
          </div>
      </PortalView>
  );

  return (
    <div className="flex flex-col animate-in fade-in pb-24">
        {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
        <ImageUploader isOpen={showUpload} onClose={() => setShowUpload(false)} onSelect={handleAvatarUpdate} />
        <DailyBlessing user={user} onCheckIn={() => { updateUser({...user, lastCheckIn: new Date().toISOString().split('T')[0]}); setToast({title: "Sincronizado", message: "+50 Karma recebido."}); }} />
        
        <header className="flex justify-between items-center mb-10 mt-8">
            <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.4em]">BUSCADOR • NÍVEL {Math.floor(user.karma / 1000) + 1}</p>
                <h1 className="text-4xl font-serif italic text-nature-900 leading-tight">Salve, {user.name.split(' ')[0]}</h1>
            </div>
            <button onClick={() => setShowUpload(true)} className="w-16 h-16 rounded-[1.8rem] border-[3px] border-white shadow-xl overflow-hidden active:scale-95 transition-all relative group">
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[8px] font-bold uppercase tracking-widest">Editar</div>
                <img src={user.avatar} className="w-full h-full object-cover" />
            </button>
        </header>

        <div className="space-y-8">
          <MoodTracker currentMood={user.lastMood} onSelect={handleMoodSelect} />
          
          <SoulGarden user={user} onWater={() => updateUser({ ...user, plantXp: (user.plantXp || 0) + 10 })} />
          
          <Card className="flex items-center justify-between p-10 bg-nature-900 text-white border-0 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary-500/10 blur-[60px] translate-x-1/2 translate-y-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
              <div className="relative z-10 space-y-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-400 mb-2">Momento Presente</p>
                    <h4 className="text-3xl font-serif italic">Ritual de<br/>Alinhamento</h4>
                </div>
                <button onClick={() => setView(ViewState.CLIENT_RITUAL)} className="px-8 py-4 bg-white text-nature-900 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all">Iniciar Agora</button>
              </div>
              <Moon size={64} className="text-primary-200/40 animate-float" />
          </Card>

          <div className="grid grid-cols-2 gap-6">
              <PortalCard title="Explorar" subtitle="MAPA DE CURA" icon={Compass} bgImage="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=500" onClick={() => setView(ViewState.CLIENT_EXPLORE)} />
              <PortalCard title="Bazar" subtitle="FERRAMENTAS" icon={ShoppingBag} bgImage="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=500" onClick={() => setView(ViewState.CLIENT_MARKETPLACE)} delay={100} />
              <PortalCard title="Meditar" subtitle="PAZ INTERIOR" icon={Leaf} bgImage="https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=500" onClick={() => setView(ViewState.CLIENT_MEDITATION)} delay={200} />
              <PortalCard title="Conquistas" subtitle="JORNADA" icon={Trophy} bgImage="https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?q=80&w=500" onClick={() => setView(ViewState.CLIENT_ACHIEVEMENTS)} delay={300} />
              <PortalCard title="Tribo" subtitle="SINCRO" icon={Heart} bgImage="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=500" onClick={() => setView(ViewState.CLIENT_TRIBO)} delay={400} />
              <PortalCard title="Metamorfose" subtitle="EVOLUÇÃO" icon={Sparkles} bgImage="https://images.unsplash.com/photo-1506466010722-395aa2bef877?q=80&w=500" onClick={() => setView(ViewState.CLIENT_JOURNEY)} delay={500} />
          </div>
        </div>
    </div>
  );
};
