
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Professional, User, Product, Appointment, MoodType, DailyRitualSnap, Badge, Review } from '../types';
import { api } from '../services/api'; 
import { Search, Compass, ShoppingBag, ChevronLeft, ChevronRight, Wind, X, Moon, Sparkles, Heart, Activity, ShoppingCart, Calendar, MapPin, Star, ShieldCheck, Camera, Scan, Zap, Fingerprint, Aperture, CheckCircle2, BarChart3, Wifi, ArrowRight, PenLine, Smile, Frown, Meh, CloudRain, Sun, Plus, Filter, Tag, PlayCircle, Users, Clock, Info, Loader2, Sunrise, Sunset, Image as ImageIcon, Share2, Globe, MessageCircle, Trophy, Droplets, Leaf, BookOpen, Coffee, Play, Flame, Award, LayoutDashboard, SearchCode, Sparkle, Brain, Target, Stethoscope } from 'lucide-react';
import { DynamicAvatar, SoulGarden, ZenToast, PortalCard, DailyBlessing, Card, MoodTracker, CameraWidget, ReviewCard, ReviewFormModal, DailyQuestsWidget, BottomSheet, StarRating, VerifiedBadge } from '../components/Common';
import { ConstellationOrbit, TimelapseViewer, GlobalMandala } from '../components/SocialFeatures';
import { SPECIALTIES } from '../constants';

const PortalView: React.FC<{ title: string, subtitle: string, onBack: () => void, children: React.ReactNode, footer?: React.ReactNode }> = ({ title, subtitle, onBack, children, footer }) => (
    <div className="fixed inset-0 z-[150] flex flex-col bg-nature-50 animate-in slide-in-from-right duration-300 h-full w-full">
        <header className="flex-none flex items-center gap-4 px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 bg-white border-b border-nature-100 shadow-sm z-20">
            <button onClick={onBack} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all shadow-sm"><ChevronLeft size={22} /></button>
            <div className="space-y-0.5"><h2 className="text-xl font-serif italic text-nature-900 leading-none">{title}</h2><p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">{subtitle}</p></div>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
            {children}
        </div>
        {footer && <div className="flex-none border-t border-nature-100 bg-white/80 backdrop-blur-md p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">{footer}</div>}
    </div>
);

export const ClientViews: React.FC<{ 
  user: User, view: ViewState, setView: (v: ViewState) => void, updateUser: (u: User) => void, onAddToCart: (p: Product) => void
}> = ({ user, view, setView, updateUser, onAddToCart }) => {
  const [pros, setPros] = useState<Professional[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tudo");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);

  useEffect(() => { 
    setIsLoading(true);
    Promise.all([
      api.professionals.list(),
      api.marketplace.listAll()
    ]).then(([prosData, productsData]) => {
      setPros(prosData);
      setProducts(productsData);
      setIsLoading(false);
    });
  }, []);

  const filteredPros = useMemo(() => {
    return pros.filter(p => 
      (selectedCategory === "Tudo" || p.specialty.includes(selectedCategory)) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.specialty.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [pros, selectedCategory, searchQuery]);

  const handleWaterPlant = async () => {
      const newXp = (user.plantXp || 0) + 10;
      let newStage = user.plantStage;
      if (newXp > 100 && user.plantStage === 'seed') newStage = 'sprout';
      const updated = { ...user, plantXp: newXp, plantStage: newStage };
      const res = await api.users.update(updated as User);
      updateUser(res);
      setToast({ title: "Essência Nutrida", message: "+10 XP de Vida. Seu jardim floresce." });
  };

  const handleDailyCheckIn = async () => {
      const res = await api.users.checkIn(user.id);
      if (res && res.user) {
          updateUser(res.user as User);
          setToast({ title: "Sincronizado", message: `+${res.reward} Karma recebido.` });
      }
  };

  // --- VIEW: DETALHES DO GUARDIÃO ---
  if (view === ViewState.CLIENT_PRO_DETAILS) {
    if (!searchQuery && filteredPros.length > 0) {
       // Mock detail view using the first pro if none selected contextually (simple fix for now)
       const pro = filteredPros[0]; 
       return (
            <PortalView title="Guardião" subtitle={pro.name.toUpperCase()} onBack={() => setView(ViewState.CLIENT_EXPLORE)}>
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <DynamicAvatar user={pro} size="xl" className="border-4 border-white shadow-xl" />
                        <div>
                            <h3 className="text-2xl font-serif italic text-nature-900">{pro.name}</h3>
                            <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">{pro.specialty.join(' • ')}</p>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-6 py-3 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Agendar Ritual</button>
                            <button className="p-3 bg-nature-50 text-nature-600 rounded-2xl border border-nature-100 hover:bg-white transition-all"><MessageCircle size={20}/></button>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-4">
                        <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Biografia</h4>
                        <p className="text-sm text-nature-600 italic leading-relaxed px-2">"{pro.bio || 'Dedicado à cura integral e ao despertar da consciência através de práticas ancestrais e modernas.'}"</p>
                    </div>
                </div>
            </PortalView>
       );
    }
    // Fallback if no pro selected logic exists yet
    return <PortalView title="Guardião" subtitle="DETALHES" onBack={() => setView(ViewState.CLIENT_EXPLORE)}><div className="text-center p-10 opacity-50">Selecione um Guardião no Mapa da Cura</div></PortalView>;
  }

  // --- VIEW: DETALHES DO PRODUTO ---
  if (view === ViewState.CLIENT_PRODUCT_DETAILS) return (
     <PortalView title="Detalhes" subtitle="ALQUIMIA" onBack={() => setView(ViewState.CLIENT_MARKETPLACE)}>
         <div className="text-center p-10 opacity-50">Detalhes do produto em breve...</div>
     </PortalView>
  );

  // --- VIEW: METAMORFOSE (JOURNEY) ---
  if (view === ViewState.CLIENT_JOURNEY) return (
    <PortalView title="Metamorfose" subtitle="DIÁRIO VISUAL" onBack={() => setView(ViewState.CLIENT_HOME)}>
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm text-center space-y-4">
           <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto text-primary-600"><Activity size={40}/></div>
           <h3 className="text-xl font-serif italic text-nature-900">Sua Frequência</h3>
           <p className="text-xs text-nature-500 italic">"Você está 15% mais radiante que na última semana. Continue florescendo."</p>
           <div className="flex justify-center gap-1 h-12 items-end">
              {[40, 60, 45, 90, 70, 85, 100].map((h, i) => (
                <div key={i} className="w-3 bg-primary-100 rounded-full overflow-hidden relative h-full">
                   <div className="absolute bottom-0 w-full bg-primary-500 rounded-full" style={{ height: `${h}%` }}></div>
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
             <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Evolução de Ritual</h4>
             <button className="text-[9px] font-bold text-primary-600 uppercase flex items-center gap-1"><Camera size={12}/> Novo Registro</button>
           </div>
           <TimelapseViewer snaps={user.snaps || []} />
        </div>

        <div className="bg-nature-900 rounded-[3rem] p-8 text-white">
           <h4 className="font-serif italic text-lg mb-2">Insight de Metamorfose</h4>
           <p className="text-xs text-primary-200 leading-relaxed italic">"Notamos que seus momentos de maior gratidão ocorrem após sessões matinais. Que tal agendar um Reiki para amanhã às 08:00?"</p>
           <button onClick={() => setView(ViewState.CLIENT_EXPLORE)} className="mt-6 w-full py-4 bg-white text-nature-900 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl">Ver Agenda de Guardiões</button>
        </div>
      </div>
    </PortalView>
  );

  // --- VIEW: EXPLORAR (MAPA DA CURA) ---
  if (view === ViewState.CLIENT_EXPLORE) return (
    <PortalView title="Mapa da Cura" subtitle="SINTONIZE SEU DOM" onBack={() => setView(ViewState.CLIENT_HOME)}>
      <div className="space-y-8">
        <div className="bg-nature-100 rounded-[3.5rem] p-8 text-center space-y-6 border border-nature-200">
           <h3 className="text-xl font-serif italic text-nature-900">Onde você precisa de luz hoje?</h3>
           <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Corpo', icon: Activity, color: 'bg-rose-100 text-rose-600' },
                { label: 'Mente', icon: Brain, color: 'bg-indigo-100 text-indigo-600' },
                { label: 'Espírito', icon: Sparkle, color: 'bg-amber-100 text-amber-600' }
              ].map(area => (
                <button key={area.label} className="flex flex-col items-center gap-3 active:scale-90 transition-transform">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center ${area.color} shadow-sm`}><area.icon size={28}/></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest">{area.label}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-300 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Busque por técnica ou nome..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-nature-100 py-5 pl-14 pr-6 rounded-[2rem] text-sm shadow-sm focus:ring-4 focus:ring-primary-500/5 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {["Tudo", ...SPECIALTIES.slice(0, 10)].map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat ? 'bg-nature-900 text-white border-nature-900 shadow-md' : 'bg-white text-nature-400 border-nature-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Guardiões Recomendados</h4>
          {isLoading ? (
            <div className="space-y-4"><div className="h-32 w-full bg-white rounded-3xl animate-pulse"></div><div className="h-32 w-full bg-white rounded-3xl animate-pulse"></div></div>
          ) : filteredPros.map(pro => (
              <button 
                key={pro.id} 
                onClick={() => setView(ViewState.CLIENT_PRO_DETAILS)}
                className="w-full bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group text-left"
              >
                <div className="relative">
                   <DynamicAvatar user={pro} size="lg" className="border-2 border-primary-50" />
                   {pro.isVerified && <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white"><ShieldCheck size={10} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-nature-900 text-sm truncate">{pro.name}</h4>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg"><Star size={10} className="text-amber-500 fill-amber-500" /><span className="text-[10px] font-bold text-amber-700">{pro.rating}</span></div>
                  </div>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1 truncate">{pro.specialty.join(', ')}</p>
                  <div className="flex items-center gap-4 mt-3 text-nature-400">
                     <div className="flex items-center gap-1"><MapPin size={10} /><span className="text-[9px] font-bold uppercase">{pro.location || 'Online'}</span></div>
                     <div className="flex items-center gap-1"><Clock size={10} /><span className="text-[9px] font-bold uppercase">60 min</span></div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-nature-200 group-hover:text-primary-500" />
              </button>
          ))}
        </div>
      </div>
    </PortalView>
  );

  // --- VIEW: BAZAR (FARMÁCIA DA ALMA) ---
  if (view === ViewState.CLIENT_MARKETPLACE) return (
    <PortalView title="Bazar" subtitle="FARMÁCIA DA ALMA" onBack={() => setView(ViewState.CLIENT_HOME)}>
      <div className="space-y-10">
        <div className="bg-nature-900 rounded-[3rem] p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-400 mb-2">Sugestão do Oráculo</p>
           <h3 className="text-3xl font-serif italic mb-6">Manifestação Hoje?</h3>
           <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Energizar', icon: Zap, color: 'bg-amber-500/20', sub: 'Foco & Vitalidade' },
                { label: 'Relaxar', icon: Wind, color: 'bg-emerald-500/20', sub: 'Calma & Sono' }
              ].map(mood => (
                <button key={mood.label} className={`flex flex-col p-5 rounded-3xl ${mood.color} border border-white/5 active:scale-95 transition-all text-left group`}>
                  <mood.icon size={24} className="mb-4 group-hover:rotate-12 transition-transform" />
                  <span className="text-sm font-bold uppercase tracking-widest">{mood.label}</span>
                  <span className="text-[8px] font-medium opacity-60 uppercase">{mood.sub}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12}/> Alquimia Pura</h4>
            <button className="text-[9px] font-bold text-primary-600 uppercase">Explorar Tudo</button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar px-2">
            {products.filter(p => p.type === 'physical').map(prod => (
              <div key={prod.id} className="min-w-[200px] bg-white rounded-[2.5rem] p-5 border border-nature-100 shadow-sm flex flex-col gap-4 group">
                 <div className="relative aspect-square rounded-[2rem] overflow-hidden">
                    <img src={prod.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <button onClick={() => onAddToCart(prod)} className="absolute bottom-3 right-3 w-12 h-12 bg-nature-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus size={24}/></button>
                 </div>
                 <div className="px-1">
                    <h5 className="font-bold text-nature-900 text-sm truncate">{prod.name}</h5>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm font-bold text-nature-900">R$ {prod.price}</span>
                      <span className="text-[9px] text-emerald-500 font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded-lg">+{prod.karmaReward} K</span>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2 flex items-center gap-2"><Globe size={12}/> Portais Ativos</h4>
          <div className="space-y-4">
            {products.filter(p => p.type === 'event' || p.type === 'workshop').map(ev => (
              <div key={ev.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex gap-6 group hover:shadow-md transition-all">
                <div className="w-28 h-36 rounded-3xl overflow-hidden shrink-0 relative">
                   <img src={ev.image} className="w-full h-full object-cover" />
                   <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex flex-col items-center shadow-sm">
                      <span className="text-xs font-black leading-none">{new Date(ev.eventDate!).getDate()}</span>
                      <span className="text-[8px] font-bold uppercase">{new Date(ev.eventDate!).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                   </div>
                </div>
                <div className="flex-1 py-1 flex flex-col justify-between">
                   <div className="space-y-1">
                      <span className="text-[9px] font-bold text-primary-500 uppercase tracking-widest">{ev.category}</span>
                      <h4 className="font-bold text-nature-900 text-base leading-tight group-hover:text-primary-600 transition-colors">{ev.name}</h4>
                      <p className="text-[11px] text-nature-400 flex items-center gap-1.5"><Users size={12}/> {ev.hostName}</p>
                   </div>
                   <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                         <span className="text-[9px] text-rose-500 font-bold uppercase">{ev.spotsLeft} Vagas Restantes</span>
                         <p className="text-sm font-bold text-nature-900">R$ {ev.price}</p>
                      </div>
                      <button onClick={() => onAddToCart(ev)} className="px-5 py-2.5 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Participar</button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalView>
  );

  // --- VIEW: TRIBO (SINCRO-ESTELAR) ---
  if (view === ViewState.CLIENT_TRIBO) return (
    <PortalView title="Minha Tribo" subtitle="SINCRO-ESTELAR" onBack={() => setView(ViewState.CLIENT_HOME)}>
      <div className="space-y-10">
        <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm">
           <GlobalMandala />
        </div>
        
        <div className="relative">
           <ConstellationOrbit user={user} onUpdateUser={updateUser} />
        </div>

        <div className="space-y-4">
           <div className="flex justify-between items-center px-4">
              <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><Flame size={12} className="text-amber-500"/> Pactos Ativos</h4>
              <button className="text-[9px] font-bold text-primary-600 uppercase">Novo Pacto</button>
           </div>
           <div className="bg-white p-6 rounded-[3rem] border border-nature-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform"><Flame size={28}/></div>
                 <div>
                    <h5 className="font-bold text-nature-900 text-sm">Pacto de Respiração</h5>
                    <p className="text-[10px] text-nature-400 font-bold uppercase mt-1">Com Lucas Paz • 4/7 Dias</p>
                 </div>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-nature-50" />
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-amber-500" strokeDasharray={150} strokeDashoffset={150 - (150 * 0.57)} />
                 </svg>
                 <span className="absolute text-[10px] font-black text-amber-600">57%</span>
              </div>
           </div>
        </div>

        <div className="bg-indigo-900 rounded-[3.5rem] p-10 text-white text-center space-y-6 relative overflow-hidden">
           <Trophy size={160} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
           <h4 className="font-serif italic text-2xl relative z-10">Líderes de Radiância</h4>
           <div className="flex justify-center -space-x-4 relative z-10">
              {[1,2,3,4,5].map(i => <img key={i} src={`https://api.dicebear.com/7.x/notionists/svg?seed=tribo${i}`} className="w-14 h-14 rounded-full border-4 border-indigo-800 shadow-xl object-cover" />)}
           </div>
           <p className="text-xs text-indigo-200 italic px-4 relative z-10">"Sua tribo elevou a vibração coletiva em 14% este mês. Continuem brilhando."</p>
           <button className="w-full py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-[10px] font-bold uppercase tracking-widest relative z-10">Ver Leaderboard</button>
        </div>
      </div>
    </PortalView>
  );

  // --- VIEW: HOME (EXISTENTE REFINADA) ---
  return (
    <div className="flex flex-col animate-in fade-in w-full bg-primary-50 min-h-screen pb-24">
        {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
        <DailyBlessing user={user} onCheckIn={handleDailyCheckIn} />
        <header className="flex items-center justify-between mt-8 mb-10 px-6 flex-none">
            <div className="flex items-center gap-4">
                <div className="relative group" onClick={() => setView(ViewState.SETTINGS)}>
                    <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-xl relative z-10 cursor-pointer group-hover:scale-105 transition-transform" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center z-20 pointer-events-none shadow-md animate-pulse"><Zap size={10} className="text-white fill-white" /></div>
                </div>
                <div><p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">Boa Jornada,</p><h2 className="text-2xl font-serif italic text-nature-900 leading-none mt-1">{user.name.split(' ')[0]}</h2></div>
            </div>
            <div className="px-5 py-2.5 bg-white rounded-2xl shadow-sm flex items-center gap-2 border border-nature-100 animate-in slide-in-from-top"><Sparkles size={16} className="text-amber-400" /><span className="text-sm font-bold text-nature-900">{user.karma}</span></div>
        </header>

        <div className="px-4 space-y-8">
            <div className="relative bg-white rounded-[3.5rem] p-10 shadow-2xl border border-nature-100 overflow-hidden group">
                <div className="flex gap-8 items-center relative z-10 mb-8">
                    <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 border border-primary-100 shadow-inner group-hover:scale-110 transition-transform"><Leaf size={48} className="animate-float" /></div>
                    <div><h3 className="text-2xl font-serif italic text-nature-900">Jardim Interno</h3><p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mt-1">Nível {Math.floor((user.plantXp || 0) / 20) + 1} • {user.plantStage}</p></div>
                </div>
                <div className="w-full h-4 bg-nature-100 rounded-full overflow-hidden border border-nature-50 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-[2000ms] shadow-lg" style={{ width: `${(user.plantXp || 0) % 100}%` }}></div>
                </div>
                <button onClick={handleWaterPlant} className="w-full mt-10 py-5 bg-nature-900 text-white rounded-[2rem] text-[11px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all hover:bg-black"><Droplets size={20} /> Nutrir Essência</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button id="metamorphosis-card" onClick={() => setView(ViewState.CLIENT_JOURNEY)} className="bg-white p-8 rounded-[3rem] border border-nature-100 shadow-sm flex flex-col items-center text-center space-y-4 group active:scale-95 transition-all hover:shadow-md">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform"><Sunrise size={28}/></div>
                    <span className="text-[11px] font-bold text-nature-900 uppercase tracking-widest">Metamorfose</span>
                </button>
                <button onClick={() => setView(ViewState.CLIENT_TRIBO)} className="bg-white p-8 rounded-[3rem] border border-nature-100 shadow-sm flex flex-col items-center text-center space-y-4 group active:scale-95 transition-all hover:shadow-md">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform"><Users size={28}/></div>
                    <span className="text-[11px] font-bold text-nature-900 uppercase tracking-widest">Minha Tribo</span>
                </button>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em] px-2 flex justify-between items-center">Portais da Cura <ArrowRight size={12}/></h4>
                <div className="grid grid-cols-2 gap-4">
                    <PortalCard id="body-map-card" title="Mapa da Cura" subtitle="EXPLORAR" icon={Compass} bgImage="https://images.unsplash.com/photo-1600618528240-fb9fc964b853?q=80&w=600" onClick={() => setView(ViewState.CLIENT_EXPLORE)} />
                    <PortalCard title="Bazar" subtitle="FARMÁCIA" icon={ShoppingBag} bgImage="https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=600" onClick={() => setView(ViewState.CLIENT_MARKETPLACE)} delay={100} />
                </div>
            </div>
        </div>
    </div>
  );
};
