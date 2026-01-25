
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Professional, User, Product, Appointment, MoodType, DailyRitualSnap, Badge, Review } from '../types';
import { api } from '../services/api'; 
import { Search, Compass, ShoppingBag, ChevronLeft, ChevronRight, Wind, X, Moon, Sparkles, Heart, Activity, ShoppingCart, Calendar, MapPin, Star, ShieldCheck, Camera, Scan, Zap, Fingerprint, Aperture, CheckCircle2, BarChart3, Wifi, ArrowRight, PenLine, Smile, Frown, Meh, CloudRain, Sun, Plus, Filter, Tag, PlayCircle, Users, Clock, Info, Loader2, Sunrise, Sunset, Image as ImageIcon, Share2, Globe, MessageCircle, Trophy, Droplets, Leaf, BookOpen, Coffee, Play, Flame, Award, LayoutDashboard, SearchCode, Sparkle, Brain, Target, Stethoscope } from 'lucide-react';
import { DynamicAvatar, SoulGarden, ZenToast, PortalCard, DailyBlessing, Card, MoodTracker, CameraWidget, ReviewCard, ReviewFormModal, DailyQuestsWidget, BottomSheet, StarRating, VerifiedBadge, PortalView } from '../components/Common';
import { ConstellationOrbit, TimelapseViewer, GlobalMandala } from '../components/SocialFeatures';
import { SPECIALTIES } from '../constants';

import { getDailyMetamorphosisInsight } from '../src/utils/dailyWisdom';

export const ClientViews: React.FC<{ 
  user: User, view: ViewState, setView: (v: ViewState) => void, updateUser: (u: User) => void, onAddToCart: (p: Product) => void
}> = ({ user, view, setView, updateUser, onAddToCart }) => {
  const [pros, setPros] = useState<Professional[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tudo");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);
  const [activeModal, setActiveModal] = useState<'camera' | 'invite' | 'leaderboard' | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const handleCapture = async (image: string) => {
      const newSnap: DailyRitualSnap = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          image,
          mood: 'SERENO', // Default, could be selected
          note: 'Registro de Metamorfose'
      };
      const updatedUser = { ...user, snaps: [newSnap, ...(user.snaps || [])] };
      const res = await api.users.update(updatedUser);
      updateUser(res);
      setActiveModal(null);
      setToast({ title: "Registro Salvo", message: "Sua memória foi cristalizada." });
  };

  const handleInvite = () => {
      if (!inviteEmail) return;
      // Mock Invite Logic
      setToast({ title: "Convite Enviado", message: `Chamado enviado para ${inviteEmail}` });
      setInviteEmail("");
      setActiveModal(null);
  };

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
             <button onClick={() => setActiveModal('camera')} className="text-[9px] font-bold text-primary-600 uppercase flex items-center gap-1 bg-white border border-primary-100 px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform"><Camera size={12}/> Novo Registro</button>
           </div>
           <TimelapseViewer snaps={user.snaps || []} />
        </div>

        <div className="bg-nature-900 rounded-[3rem] p-8 text-white">
           <h4 className="font-serif italic text-lg mb-2">Insight de Metamorfose</h4>
           <p className="text-xs text-primary-200 leading-relaxed italic">"{getDailyMetamorphosisInsight()}"</p>
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
              <button onClick={() => setActiveModal('invite')} className="text-[9px] font-bold text-primary-600 uppercase flex items-center gap-1 bg-white border border-primary-100 px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform"><Plus size={12}/> Convidar Alma</button>
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
           <button onClick={() => setActiveModal('leaderboard')} className="w-full py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-[10px] font-bold uppercase tracking-widest relative z-10 hover:bg-white/20 transition-all">Ver Classificação</button>
        </div>
      </div>
    </PortalView>
  );

 // --- VIEW: HOME (EXISTENTE REFINADA) ---
  if (view === ViewState.CLIENT_HOME) return (
    <div className="flex flex-col animate-in fade-in w-full bg-[#f8faf9] min-h-screen pb-24">
        {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
        
        {/* MODAIS (Manter existentes) */}
        <BottomSheet isOpen={activeModal === 'camera'} onClose={() => setActiveModal(null)} title="Novo Registro">
             <div className="h-[60vh] -mx-4">
                 <CameraWidget onCapture={handleCapture} />
             </div>
        </BottomSheet>

        <BottomSheet isOpen={activeModal === 'invite'} onClose={() => setActiveModal(null)} title="Convidar para Tribo">
             <div className="space-y-6 pb-20">
                 <div className="text-center space-y-4">
                     <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500"><Users size={40}/></div>
                     <p className="text-sm text-nature-600">Convide uma alma afim para caminhar junto. <br/>Vocês compartilharão Karma e evolução.</p>
                 </div>
                 <div className="space-y-2">
                     <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">E-mail do Convidado</label>
                     <input 
                        value={inviteEmail} 
                        onChange={e => setInviteEmail(e.target.value)} 
                        placeholder="nome@email.com" 
                        className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                     />
                 </div>
                 <button onClick={handleInvite} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Enviar Chamado</button>
             </div>
        </BottomSheet>

        <BottomSheet isOpen={activeModal === 'leaderboard'} onClose={() => setActiveModal(null)} title="Classificação Radiante">
             {/* Conteúdo Leaderboard existente */}
             <div className="space-y-6 pb-12">
                 <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="text-2xl font-black text-indigo-200">#42</div>
                        <DynamicAvatar user={user} size="md" />
                        <div>
                            <h4 className="font-bold text-nature-900 text-sm">Você</h4>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase">{user.plantStage} • Nível {Math.floor((user.plantXp || 0) / 20) + 1}</p>
                        </div>
                     </div>
                     <div className="text-right">
                         <span className="block text-xl font-black text-nature-900">{user.karma}</span>
                         <span className="text-[9px] font-bold text-nature-400 uppercase">Karma</span>
                     </div>
                 </div>
                 {/* ... Lista Top 3 ... */}
             </div>
        </BottomSheet>

        <DailyBlessing user={user} onCheckIn={handleDailyCheckIn} />
        
        <header className="flex items-center justify-between mt-8 mb-6 px-6 flex-none">
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
            {/* JARDIM INTERNO CARD */}
            <div className="relative rounded-[3.5rem] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => handleWaterPlant()}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10"></div>
                <img src="https://images.unsplash.com/photo-1592323287019-2169b1834225?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="relative z-20 p-8 h-64 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="bg-white/20 backdrop-blur-md border border-white/30 p-3 rounded-2xl text-white">
                            <Leaf size={24} />
                        </div>
                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">Nível {Math.floor((user.plantXp || 0) / 20) + 1}</span>
                    </div>
                    <div>
                         <h3 className="text-3xl font-serif italic text-white mb-2 drop-shadow-md">Jardim Interno</h3>
                         <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                            <div className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-1000" style={{ width: `${(user.plantXp || 0) % 100}%` }}></div>
                         </div>
                         <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest mt-3 flex items-center gap-2"><Droplets size={12}/> {user.plantStage} • Toque para Nutrir</p>
                    </div>
                </div>
            </div>

            {/* GRID PRINCIPAL */}
            <div className="grid grid-cols-2 gap-4">
                <PortalCard 
                    title="Metamorfose" 
                    subtitle="DIÁRIO" 
                    icon={Sunrise} 
                    bgImage="https://images.unsplash.com/photo-1507643179173-61b8d64f8476?q=80&w=600" 
                    onClick={() => setView(ViewState.CLIENT_JOURNEY)} 
                />
                <PortalCard 
                    title="Minha Tribo" 
                    subtitle="COMUNIDADE" 
                    icon={Users} 
                    bgImage="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=600" 
                    onClick={() => setView(ViewState.CLIENT_TRIBO)} 
                    delay={100}
                />
                <PortalCard 
                    title="Mapa da Cura" 
                    subtitle="EXPLORAR" 
                    icon={Compass} 
                    bgImage="https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=600" 
                    onClick={() => setView(ViewState.CLIENT_EXPLORE)} 
                    delay={200}
                />
                <PortalCard 
                    title="Bazar" 
                    subtitle="FARMÁCIA" 
                    icon={ShoppingBag} 
                    bgImage="https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=600" 
                    onClick={() => setView(ViewState.CLIENT_MARKETPLACE)} 
                    delay={300} 
                />
            </div>
        </div>
    </div>
  );
};
