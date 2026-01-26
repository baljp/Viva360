
import React, { useEffect, useState, useMemo } from 'react';
import { ViewState, Professional, SpaceRoom, User, Transaction, Vacancy, Product, UserRole } from '../types';
import { 
    Users, ChevronLeft, BarChart3, Wallet, Plus, Sparkles, RefreshCw, Activity, ChevronRight, Briefcase, DollarSign, Star, DoorOpen, Timer, CheckCircle, Trash2, LayoutDashboard, History, Search, UserPlus, Award, Clock, TrendingUp, Filter, MapPin, ArrowUpRight, ArrowDownRight, MoreVertical, Settings, Building2, Flame, Heart, Zap, ShieldCheck, Package, LayoutGrid, Tag, ShoppingBag, Eye, Calendar, UserCheck, AlertCircle, Share2
} from 'lucide-react';
import { api } from '../services/api';
import { DynamicAvatar, PortalCard, Card, ZenToast, ProductFormModal, OrganicSkeleton, BottomSheet, VacancyFormModal, PortalView } from '../components/Common';
import { SPECIALTIES } from '../constants';
import { getDailyMessage } from '../src/utils/dailyWisdom';



export const SpaceViews: React.FC<{ user: User, view: ViewState, setView: (v: ViewState) => void }> = ({ user, view, setView }) => {
  const [rooms, setRooms] = useState<SpaceRoom[]>([]);
  const [team, setTeam] = useState<Professional[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);
  const [showAddVacancy, setShowAddVacancy] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const refreshData = async () => {
      setIsLoading(true);
      try {
          const [r, t, v, tx, prods] = await Promise.all([
              api.spaces.getRooms(user.id),
              api.spaces.getTeam(user.id),
              api.spaces.getVacancies(),
              api.spaces.getTransactions(user.id),
              api.marketplace.listByOwner(user.id)
          ]);
          setRooms(r);
          setTeam(t.map(p => ({ ...p, isOccupied: Math.random() > 0.7 } as any)));
          setVacancies(v);
          setTransactions(tx);
          setMyProducts(prods);
      } catch (e) { console.error(e); }
      setIsLoading(false);
  };

  useEffect(() => { refreshData(); }, [user.id]); 

  // --- TELA: MASTER CALENDAR (AGENDA CENTRALIZADA) ---
  if (view === ViewState.SPACE_CALENDAR) {
     return <SpaceCalendar team={team} setView={setView} />;
  }
  // --- TELA: FINANÇAS (ABUNDÂNCIA REFINADA) ---
  if (view === ViewState.SPACE_FINANCE) return (
    <PortalView title="Prosperidade" subtitle="GESTÃO DE FLUXO" onBack={() => setView(ViewState.SPACE_HOME)}>
      <div className="space-y-8">
        <div className="bg-nature-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-12 translate-x-12"></div>
           <TrendingUp size={140} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
           <div className="relative z-10 space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-400 mb-2">Faturamento Consolidado</p>
                <h3 className="text-5xl font-serif italic">R$ 24.850<span className="text-xl text-primary-400">,00</span></h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                    <p className="text-[8px] font-bold uppercase text-primary-200 mb-1">Média p/ Sala</p>
                    <span className="text-lg font-bold text-white">R$ 4.2k</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                    <p className="text-[8px] font-bold uppercase text-primary-200 mb-1">Crescimento</p>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                        <ArrowUpRight size={14} />
                        <span className="text-lg font-bold">12%</span>
                    </div>
                  </div>
              </div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm space-y-6">
           <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Distribuição de Receita</h4>
              <BarChart3 size={14} className="text-nature-200"/>
           </div>
           <div className="space-y-4">
              {[
                  { label: 'Aluguel de Altares', value: 65, color: 'bg-primary-500' },
                  { label: 'Eventos & Workshops', value: 20, color: 'bg-indigo-500' },
                  { label: 'Vendas Bazar', value: 15, color: 'bg-amber-500' }
              ].map(item => (
                  <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                          <span className="text-nature-500">{item.label}</span>
                          <span className="text-nature-900">{item.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-nature-50 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }}></div>
                      </div>
                  </div>
              ))}
           </div>
        </div>

        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Fluxo Recente</h4>
              <button className="p-2 bg-white rounded-xl border border-nature-100"><Filter size={14} className="text-nature-400"/></button>
           </div>
           {transactions.map(tx => (
             <div key={tx.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>}
                   </div>
                   <div>
                      <h4 className="font-bold text-nature-900 text-sm truncate max-w-[150px]">{tx.description}</h4>
                      <p className="text-[10px] text-nature-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {tx.amount}
                   </p>
                   <span className="text-[8px] text-nature-200 uppercase font-bold tracking-tighter">{tx.status}</span>
                </div>
             </div>
           ))}
        </div>
      </div>
    </PortalView>
  );

  // --- TELA: RECRUTAMENTO (PORTAL DE VAGAS REFINADO) ---
  if (view === ViewState.SPACE_RECRUITMENT) return (
    <PortalView 
      title="Sincronia Mestra" 
      subtitle="EXPANSÃO DO CÍRCULO" 
      onBack={() => setView(ViewState.SPACE_HOME)}
      footer={
        <button onClick={() => setShowAddVacancy(true)} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Plus size={18}/> Novo Manifesto de Busca
        </button>
      }
    >
      <div className="space-y-8">
        <div className="bg-indigo-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
           <Briefcase size={160} className="absolute -right-12 -bottom-12 opacity-10 rotate-12" />
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full w-fit border border-white/10">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                 <span className="text-[8px] font-bold uppercase tracking-widest">Hub em Expansão</span>
              </div>
              <h3 className="text-2xl font-serif italic leading-tight">Manifeste o Guardião Ideal</h3>
              <p className="text-xs text-indigo-200 italic leading-relaxed">Conecte seu Santuário a mestres que vibram na mesma frequência. Gerencie o funil de luz aqui.</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm text-center space-y-1">
                <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Candidatos Ativos</p>
                <h4 className="text-2xl font-serif italic text-nature-900">28</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm text-center space-y-1">
                <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Vagas Abertas</p>
                <h4 className="text-2xl font-serif italic text-indigo-600">{vacancies.length}</h4>
            </div>
        </div>

        <div className="space-y-4">
           <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Manifestos de Busca (Vagas)</h4>
           {vacancies.length > 0 ? vacancies.map(v => (
             <div key={v.id} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-5 group hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><UserPlus size={24}/></div>
                      <div>
                         <h4 className="font-bold text-nature-900 text-sm leading-none">{v.title}</h4>
                         <div className="flex gap-1.5 mt-2">
                           {v.specialties.map(s => <span key={s} className="text-[8px] px-2 py-0.5 bg-nature-50 text-nature-400 rounded-lg font-bold uppercase border border-nature-100">{s}</span>)}
                         </div>
                      </div>
                   </div>
                   <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Ativo</div>
                </div>
                <p className="text-xs text-nature-500 line-clamp-2 italic leading-relaxed px-1">"{v.description}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-nature-50">
                   <div className="flex items-center gap-2 text-nature-400">
                      <Users size={14}/>
                      <span className="text-[10px] font-bold uppercase tracking-tighter">{v.applicantsCount} Guardiões Inscritos</span>
                   </div>
                   <button className="flex items-center gap-1.5 px-4 py-2 bg-nature-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                      Sincronizar <ChevronRight size={12}/>
                   </button>
                </div>
             </div>
           )) : (
             <div className="py-20 text-center space-y-4 opacity-40">
                <div className="w-20 h-20 bg-nature-100 rounded-full flex items-center justify-center mx-auto text-nature-300 shadow-inner"><Briefcase size={32} /></div>
                <p className="italic text-sm">Nenhum manifesto ativo no momento.<br/>O Santuário está em equilíbrio completo.</p>
             </div>
           )}
        </div>

        <div className="bg-amber-50 p-8 rounded-[3.5rem] border border-amber-100 space-y-4 text-center">
            <Award size={40} className="mx-auto text-amber-500" />
            <h4 className="font-serif italic text-lg text-amber-900">Impulsione seu Santuário</h4>
            <p className="text-xs text-amber-700 italic px-4 leading-relaxed">Destaque suas vagas no topo do Mapa da Cura de todos os Guardiões do Viva360.</p>
            <button className="px-6 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Ativar Selo de Destaque</button>
        </div>
      </div>
      <VacancyFormModal isOpen={showAddVacancy} onClose={() => setShowAddVacancy(false)} onSubmit={(title, desc, specs) => {
          api.spaces.createVacancy({ title, description: desc, specialties: specs, hubId: user.id });
          refreshData();
          setToast({ title: "Oportunidade Criada", message: "O universo agora sabe que você busca novos guardiões." });
      }} />
    </PortalView>
  );

  // --- TELA: MARKETPLACE (BAZAR DO SANTUÁRIO COMPLETO) ---
  if (view === ViewState.SPACE_MARKETPLACE) return (
    <PortalView 
        title="Alquimia Comercial" 
        subtitle="INVENTÁRIO DO HUB" 
        onBack={() => setView(ViewState.SPACE_HOME)}
        footer={
            <button onClick={() => setShowAddProduct(true)} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Plus size={18}/> Novo Produto ou Aluguel
            </button>
        }
    >
        <div className="space-y-8">
            <div className="bg-amber-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 flex justify-between items-end">
                    <div className="space-y-4">
                        <div className="p-3 bg-white/10 rounded-2xl w-fit"><ShoppingBag size={24} className="text-amber-400" /></div>
                        <div>
                           <h3 className="text-3xl font-serif italic leading-none">Bazar Ativo</h3>
                           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200 mt-2">Monitore suas Ofertas</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-serif">84%</p>
                        <p className="text-[8px] font-bold uppercase opacity-60">Meta de Vendas</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                {[
                    { id: 'all', label: 'Tudo', icon: LayoutGrid },
                    { id: 'physical', label: 'Insumos', icon: Package },
                    { id: 'event', label: 'Portais', icon: Flame },
                    { id: 'rental', label: 'Altares', icon: DoorOpen }
                ].map(tab => (
                    <button key={tab.id} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-nature-100 text-[10px] font-bold uppercase tracking-widest text-nature-400 whitespace-nowrap hover:border-primary-500 transition-all">
                        <tab.icon size={14}/> {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Catálogo Vigente</h4>
                    <span className="text-[9px] font-bold text-nature-300 uppercase tracking-tighter">{myProducts.length} itens listados</span>
                </div>
                
                {myProducts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {myProducts.map(prod => (
                            <div key={prod.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                                <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 relative bg-nature-50">
                                    <img src={prod.image} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={prod.name} />
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-sm text-nature-900"><Tag size={10}/></div>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-1 h-24">
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-nature-900 text-sm truncate">{prod.name}</h4>
                                            <span className="text-[10px] font-bold text-nature-900">R$ {prod.price}</span>
                                        </div>
                                        <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">{prod.category} • {prod.type === 'physical' ? 'Estoque: 12' : 'Vagas: 5'}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                            <TrendingUp size={10} className="text-emerald-500"/><span className="text-[8px] font-black text-emerald-600 uppercase">+{prod.karmaReward} K</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2.5 bg-nature-50 text-nature-300 rounded-xl hover:text-primary-600 transition-colors"><Eye size={14}/></button>
                                            <button className="p-2.5 bg-nature-50 text-nature-300 rounded-xl hover:text-nature-900 transition-colors"><RefreshCw size={14}/></button>
                                            <button onClick={() => api.marketplace.delete(prod.id).then(refreshData)} className="p-2.5 bg-rose-50 text-rose-300 rounded-xl hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center space-y-6 bg-white rounded-[3rem] border border-dashed border-nature-200">
                        <div className="w-24 h-24 bg-nature-50 rounded-full flex items-center justify-center mx-auto text-nature-200"><ShoppingBag size={40} /></div>
                        <div className="space-y-1">
                            <h4 className="font-serif italic text-xl text-nature-900">Bazar Silencioso</h4>
                            <p className="text-xs text-nature-400 px-12 leading-relaxed italic">"Suas prateleiras aguardam a manifestação de novos itens para o ecossistema."</p>
                        </div>
                        <button onClick={() => setShowAddProduct(true)} className="px-8 py-3 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg">Começar Manifestação</button>
                    </div>
                )}
            </div>
        </div>
        <ProductFormModal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} onSubmit={async (pData) => {
            await api.marketplace.create({ ...pData, ownerId: user.id });
            refreshData();
            setToast({ title: "Item Ancorado", message: "Sua nova alquimia já está disponível no Bazar Global." });
        }} />
    </PortalView>
  );

  // --- TELA: SALAS (ALTARES) ---
  if (view === ViewState.SPACE_ROOMS) return (
    <PortalView title="Altares" subtitle="GESTÃO DE AMBIENTES" onBack={() => setView(ViewState.SPACE_HOME)}>
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm text-center">
              <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Total Salas</p>
              <h4 className="text-2xl font-serif italic text-nature-900">{rooms.length}</h4>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm text-center">
              <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Disponíveis</p>
              <h4 className="text-2xl font-serif italic text-emerald-600">{rooms.filter(r => r.status === 'available').length}</h4>
           </div>
        </div>

        <div className="space-y-4">
           {rooms.map(room => (
             <div key={room.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-5">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${room.status === 'occupied' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {room.status === 'occupied' ? <Activity size={24} className="animate-pulse" /> : <DoorOpen size={24}/>}
                   </div>
                   <div>
                      <h4 className="font-bold text-nature-900 text-sm leading-tight">{room.name}</h4>
                      <p className={`text-[10px] font-bold uppercase mt-1 ${room.status === 'occupied' ? 'text-indigo-400' : 'text-emerald-500'}`}>
                        {room.status === 'occupied' ? `Ocupada: ${room.currentOccupant}` : 'Pronta para Ritual'}
                      </p>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   {room.status === 'occupied' && (
                     <div className="flex items-center gap-1 text-[10px] text-nature-400 font-bold"><Clock size={12}/> 25m restantes</div>
                   )}
                   <button className="p-2 text-nature-300 hover:text-nature-900 transition-colors"><MoreVertical size={18}/></button>
                </div>
             </div>
           ))}
           <button className="w-full py-5 border-2 border-dashed border-nature-100 rounded-[2.5rem] text-nature-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white transition-all"><Plus size={16}/> Adicionar Novo Altar</button>
        </div>
      </div>
    </PortalView>
  );

  // --- TELA: EQUIPE ---
  if (view === ViewState.SPACE_TEAM) return (
      <PortalView title="Círculo de Guardiões" subtitle="GESTÃO DE EQUIPE" onBack={() => setView(ViewState.SPACE_HOME)}>
          <div className="space-y-8">
              <div className="bg-indigo-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                   <Users size={140} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                   <div className="relative z-10 grid grid-cols-2 gap-8">
                        <div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-300 mb-2">Tribo Ativa</p><h3 className="text-4xl font-serif italic">{team.length} Mestres</h3></div>
                        <div className="flex flex-col justify-end items-end"><div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div><span className="text-[10px] font-bold uppercase tracking-widest">{team.filter((p: any) => p.isOccupied).length} em Ritual</span></div></div>
                   </div>
              </div>

              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input type="text" placeholder="Buscar mestre pelo dom ou nome..." className="w-full bg-white border border-nature-100 py-4 pl-14 pr-6 rounded-2xl text-sm shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5" />
              </div>

              <div className="space-y-4">
                  {team.map((pro: any) => (
                      <button key={pro.id} className="w-full bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between group text-left transition-all active:scale-95">
                          <div className="flex items-center gap-4">
                              <div className="relative">
                                 <DynamicAvatar user={pro} size="lg" className="border-2 border-indigo-50" />
                                 <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${pro.isOccupied ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{pro.isOccupied ? <Timer size={10}/> : <CheckCircle size={10}/>}</div>
                              </div>
                              <div className="min-w-0">
                                 <h4 className="font-bold text-nature-900 text-sm truncate">{pro.name}</h4>
                                 <p className="text-[10px] text-nature-400 font-bold uppercase mt-0.5 truncate">{pro.specialty[0]}</p>
                                 <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1 text-amber-500"><Star size={8} fill="currentColor"/><span className="text-[9px] font-bold">{pro.rating}</span></div>
                                    <span className="text-[8px] text-nature-300">•</span>
                                    <span className="text-[9px] text-nature-400 font-bold uppercase">{pro.totalHealingHours}h de Luz</span>
                                 </div>
                              </div>
                          </div>
                          <ChevronRight size={18} className="text-nature-200 group-hover:text-indigo-500 transition-colors" />
                      </button>
                  ))}
                  <button onClick={() => setView(ViewState.SPACE_RECRUITMENT)} className="w-full py-6 border-2 border-dashed border-indigo-100 rounded-[2.5rem] text-indigo-600 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-indigo-50 mt-4 transition-all"><UserPlus size={18} /> Expandir o Círculo</button>
              </div>
          </div>
      </PortalView>
  );


  // --- TELA: MASTER CALENDAR (AGENDA CENTRALIZADA) ---
  if ((view as any) === ViewState.SPACE_CALENDAR) {
     return <SpaceCalendar team={team} setView={setView} />;
  }

  // --- TELA: HOME (DASHBOARD) ---
  return (
    <div className="flex flex-col animate-in fade-in w-full bg-[#fcfdfc] min-h-screen pb-24">
        {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
        <header className="flex items-center justify-between mt-8 mb-8 px-6 flex-none">
            <div className="flex items-center gap-4">
                <div className="relative group" onClick={() => setView(ViewState.SETTINGS)}>
                  <img src={user.avatar} className="w-14 h-14 rounded-[1.5rem] border-4 border-white shadow-xl object-cover cursor-pointer group-hover:scale-110 transition-transform" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-900 border-4 border-white rounded-full flex items-center justify-center shadow-md animate-pulse"><Award size={10} className="text-white" /></div>
                </div>
                <div><p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">Santuário Viva360</p><h2 className="text-2xl font-serif italic text-nature-900 leading-none mt-1">{user.name.split(' ')[0]}</h2></div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setView(ViewState.SPACE_CALENDAR)} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all"><Calendar size={20}/></button>
                <button onClick={() => setView(ViewState.SPACE_FINANCE)} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-indigo-600 active:scale-95 transition-all"><BarChart3 size={20}/></button>
            </div>
        </header>

        <div className="px-4 space-y-8">
            <div className="bg-indigo-900 rounded-[3.5rem] p-8 text-white shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                       <div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-200">Radiance Score</p><h3 className="text-4xl font-serif italic flex items-center gap-2">94% <Sparkles size={20} className="text-amber-400"/></h3></div>
                       <TrendingUp size={24} className="text-emerald-400" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                        <p className="text-[8px] font-bold uppercase text-indigo-200 mb-1">Vibração do Dia</p>
                        <p className="text-xs text-white italic leading-relaxed">"{getDailyMessage()}"</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setView(ViewState.SPACE_TEAM)} className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-left hover:bg-white/20 transition-all"><p className="text-[8px] font-bold uppercase text-indigo-300">Equipe Ativa</p><span className="text-xl font-bold">{team.length} Mestres</span></button>
                        <button onClick={() => setView(ViewState.SPACE_FINANCE)} className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-left hover:bg-white/20 transition-all"><p className="text-[8px] font-bold uppercase text-indigo-300">Fluxo Hoje</p><span className="text-xl font-bold">R$ 1.4k</span></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <PortalCard title="Altares" subtitle="GESTÃO DE SALAS" icon={DoorOpen} bgImage="https://images.unsplash.com/photo-1600618528240-fb9fc964b853?q=80&w=600" onClick={() => setView(ViewState.SPACE_ROOMS)} />
                <PortalCard title="Equipe" subtitle="CONEXÃO MESTRES" icon={Users} bgImage="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600" onClick={() => setView(ViewState.SPACE_TEAM)} delay={100} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <PortalCard title="Expansão" subtitle="RECRUTAMENTO" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600" onClick={() => setView(ViewState.SPACE_RECRUITMENT)} delay={200} />
                <PortalCard title="Abundância" subtitle="FINANCEIRO" icon={Wallet} bgImage="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=600" onClick={() => setView(ViewState.SPACE_FINANCE)} delay={300} />
            </div>

            <div className="pb-8">
                 <PortalCard 
                    title="Bazar do Hub" 
                    subtitle="LOJA" 
                    icon={ShoppingBag} 
                    bgImage="https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=600" 
                    onClick={() => setView(ViewState.SPACE_MARKETPLACE)} 
                    delay={400} 
                />
            </div>

            <div className="space-y-4 pb-8">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em] px-2 flex justify-between items-center">Monitor de Altares <span className="text-emerald-600 text-[9px] font-bold animate-pulse">AO VIVO</span></h4>
                <div className="grid grid-cols-1 gap-3">
                    {rooms.slice(0, 3).map(room => (
                         <div key={room.id} className="bg-white p-5 rounded-3xl border border-nature-100 flex items-center justify-between group shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${room.status === 'occupied' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}><Activity size={18} className={room.status === 'occupied' ? 'animate-pulse' : ''} /></div>
                                <div><h4 className="text-xs font-bold text-nature-900">{room.name}</h4><p className="text-[9px] text-nature-400 uppercase font-bold">{room.status === 'occupied' ? `Com ${room.currentOccupant}` : 'Disponível'}</p></div>
                            </div>
                            {room.status === 'occupied' && <div className="text-right"><span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1"><Clock size={10}/> 45min</span></div>}
                            {room.status === 'available' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                        </div>
                    ))}
                    <button onClick={() => setView(ViewState.SPACE_ROOMS)} className="w-full py-4 text-center text-[10px] font-bold text-nature-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Ver Todas as Salas</button>
                </div>
            </div>
        </div>
    </div>
  );
};

const SpaceCalendar: React.FC<{ team: Professional[], setView: (v: ViewState) => void }> = ({ team, setView }) => {
     const [filterPro, setFilterPro] = useState<string>('all');
     
     // Mock appointments for demo (since we don't have a full appointments endpoint in this file yet)
     // In real app, use api.spaces.getAppointments(user.id)
     const mockAppointments = [
         { id: '1', time: '09:00', client: 'Ana Silva', proId: team[0]?.id, proName: team[0]?.name || 'Mestre 1', status: 'confirmed', room: 'Sala Hera' },
         { id: '2', time: '10:30', client: 'Carlos B.', proId: team[0]?.id, proName: team[0]?.name || 'Mestre 1', status: 'pending', room: 'Sala Zeus' },
         { id: '3', time: '14:00', client: 'Julia M.', proId: team[1]?.id, proName: team[1]?.name || 'Mestre 2', status: 'confirmed', room: 'Sala Gaia' },
     ];

     const filteredApps = filterPro === 'all' ? mockAppointments : mockAppointments.filter(mock => mock.proId === filterPro);

     return (
        <PortalView 
            title="Agenda do Santuário" 
            subtitle="VISÃO UNIFICADA" 
            onBack={() => setView(ViewState.SPACE_HOME)}
            footer={
                <div className="flex gap-2">
                     <button className="flex-1 py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px]">Novo Agendamento</button>
                     <button className="p-4 bg-white border border-nature-100 rounded-2xl text-nature-400"><Filter size={20}/></button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-3xl border border-nature-100 shadow-sm">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2 mb-2 block">Filtrar por Guardião</label>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        <button 
                            onClick={() => setFilterPro('all')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${filterPro === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-nature-50 text-nature-500 border-nature-100'}`}
                        >
                            Todos
                        </button>
                        {team.map((t: any) => (
                             <button 
                                key={t.id}
                                onClick={() => setFilterPro(t.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${filterPro === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-nature-50 text-nature-500 border-nature-100'}`}
                            >
                                {t.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Hoje, {new Date().toLocaleDateString('pt-BR')}</h4>
                    {filteredApps.length === 0 ? (
                        <div className="p-10 text-center opacity-50">Nenhum agendamento encontrado para este filtro.</div>
                    ) : filteredApps.map((app: any) => (
                        <div key={app.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 flex gap-4 items-center shadow-sm relative overflow-hidden group">
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500"></div>
                             <div className="pl-4">
                                <p className="text-xl font-serif italic text-nature-900">{app.time}</p>
                                <p className="text-[9px] font-bold uppercase text-nature-300">60 min</p>
                             </div>
                             <div className="flex-1 border-l border-nature-100 pl-4 bg-nature-50/50 rounded-r-2xl py-2">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-nature-900 text-sm">{app.client}</h4>
                                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-lg ${app.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{app.status}</span>
                                </div>
                                <p className="text-[10px] text-nature-500 mt-1 flex items-center gap-1"><Users size={10}/> {app.proName}</p>
                                <p className="text-[10px] text-indigo-500 mt-0.5 flex items-center gap-1 font-bold"><MapPin size={10}/> {app.room}</p>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </PortalView>
     );
}

