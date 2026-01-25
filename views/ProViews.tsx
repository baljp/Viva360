
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Professional, Appointment, User, Transaction, Product, RecordAccess, Vacancy } from '../types';
import { api } from '../services/api';
import { 
    Calendar as CalendarIcon, ChevronLeft, Wallet, Flower, Zap, 
    Heart, Clock, Star, History, Plus, RefreshCw, CheckCircle2, FileText, ChevronRight, Video, MessageSquare, Users, Briefcase, MapPin, Sparkles, Save, ArrowUpRight, ArrowDownRight, Filter, Share2, Shield, Lock, Trash2, TrendingUp, Droplets, Activity, Sun, Wind, Phone as PhoneIcon, LayoutDashboard, UserCheck, AlertCircle, Target, ShoppingBag, Award, BarChart3, Play, Moon, Search, Package, Layers, ExternalLink, Building
} from 'lucide-react';
import { DynamicAvatar, Card, ZenToast, PortalCard, BottomSheet, OrganicSkeleton, ProductFormModal, PortalView } from '../components/Common';
import { getDailyMessage } from '../src/utils/dailyWisdom';

export const ProViews: React.FC<{ 
    user: Professional, view: ViewState, setView: (v: ViewState) => void, updateUser: (u: User) => void 
}> = ({ user, view, setView, updateUser }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<{id: string, name: string} | null>(null);
  const [patientNotes, setPatientNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
        const [apts, vacs, prods, txs] = await Promise.all([
            api.appointments.list(user.id, user.role),
            api.spaces.getVacancies(),
            api.marketplace.listByOwner(user.id),
            api.professionals.getFinanceSummary(user.id).then(res => res.transactions)
        ]);
        setAppointments(apts);
        setVacancies(vacs);
        setMyProducts(prods);
        setTransactions(txs);
    } catch (e) {
        console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => { refreshData(); }, [user.id]);

  const handleSaveNotes = async () => {
    if (!selectedPatient) return;
    setIsSaving(true);
    await api.professionals.updateNotes(selectedPatient.id, user.id, patientNotes);
    setIsSaving(false);
    setToast({ title: "Ancorado", message: "As notas terapêuticas foram salvas com segurança." });
  };

  const handleApplyVacancy = async (vId: string) => {
    await api.professionals.applyToVacancy(vId, user.id);
    setToast({ title: "Selo Enviado", message: "Seu manifesto foi enviado ao Santuário com sucesso." });
  };

  const handleAddProduct = async (pData: any) => {
    await api.marketplace.create({ ...pData, ownerId: user.id });
    refreshData();
    setToast({ title: "Alquimia Lançada", message: "Seu novo item já está vibrando no ecossistema." });
  };

  const moodConfig: Record<string, { icon: any, color: string, label: string }> = {
    'VIBRANTE': { icon: Sun, color: 'text-amber-500 bg-amber-50', label: 'Vibrante' },
    'ANSIOSO': { icon: Activity, color: 'text-rose-500 bg-rose-50', label: 'Ansioso' },
    'SERENO': { icon: Wind, color: 'text-emerald-500 bg-emerald-50', label: 'Sereno' },
    'FOCADO': { icon: Zap, color: 'text-indigo-500 bg-indigo-50', label: 'Focado' }
  };

  // --- TELA: FINANÇAS (ABUNDÂNCIA) ---
  if (view === ViewState.PRO_FINANCE) return (
    <PortalView title="Abundância" subtitle="FLUXO DE PROSPERIDADE" onBack={() => setView(ViewState.PRO_HOME)}>
      <div className="space-y-8">
        <div className="bg-nature-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
           <TrendingUp size={160} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
           <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-400 mb-2">Saldo Disponível</p>
              <h3 className="text-5xl font-serif italic mb-8">R$ {user.personalBalance}<span className="text-xl text-primary-400">,00</span></h3>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                    <p className="text-[8px] font-bold uppercase text-primary-200 mb-1">A Liberar</p>
                    <span className="text-lg font-bold text-emerald-400">R$ 1.840</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                    <p className="text-[8px] font-bold uppercase text-primary-200 mb-1">Meta Mensal</p>
                    <span className="text-lg font-bold text-white">82%</span>
                  </div>
              </div>
           </div>
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Histórico do Fluxo</h4>
                <button className="p-2 bg-white rounded-xl border border-nature-100"><Filter size={14} className="text-nature-400"/></button>
            </div>
            {transactions.map(tx => (
                <div key={tx.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                            {tx.type === 'income' ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>}
                        </div>
                        <div>
                            <h4 className="font-bold text-nature-900 text-sm truncate max-w-[160px]">{tx.description}</h4>
                            <p className="text-[9px] text-nature-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'income' ? '+' : '-'} R$ {tx.amount}
                        </p>
                        <span className="text-[8px] text-nature-200 uppercase font-bold">{tx.status}</span>
                    </div>
                </div>
            ))}
        </div>

        <button className="w-full py-5 border-2 border-dashed border-nature-100 rounded-[2.5rem] text-nature-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white transition-all"><Share2 size={16}/> Baixar Relatório Mensal</button>
      </div>
    </PortalView>
  );

  // --- TELA: OPORTUNIDADES (HUB RECRUITMENT) ---
  if (view === ViewState.PRO_OPPORTUNITIES) return (
    <PortalView title="Portal de Expansão" subtitle="VAGAS EM SANTUÁRIOS" onBack={() => setView(ViewState.PRO_HOME)}>
        <div className="space-y-6">
            <div className="bg-indigo-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                {/* Fixed: Added Building import to fix 'Cannot find name Building' */}
                <Building size={140} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                <h3 className="text-2xl font-serif italic mb-2 relative z-10">Conecte seu Dom</h3>
                <p className="text-xs text-indigo-200 italic leading-relaxed relative z-10">Descubra espaços físicos que buscam seu talento e expanda sua rede de rituais presencialmente.</p>
            </div>

            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-300" size={18} />
                <input type="text" placeholder="Filtrar por região ou especialidade..." className="w-full bg-white border border-nature-100 py-4 pl-14 pr-6 rounded-2xl text-sm shadow-sm outline-none" />
            </div>

            <div className="space-y-4">
                {vacancies.map(v => (
                    <div key={v.id} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-5 group">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                {/* Fixed: Added Building import to fix 'Cannot find name Building' */}
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Building size={24}/></div>
                                <div>
                                    <h4 className="font-bold text-nature-900 text-sm">{v.title}</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase">Santuário Tambaú • 2km</p>
                                </div>
                            </div>
                            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase">Ativa</div>
                        </div>
                        <p className="text-xs text-nature-500 line-clamp-2 italic leading-relaxed">"{v.description}"</p>
                        <div className="flex flex-wrap gap-1.5">
                            {v.specialties.map(s => <span key={s} className="px-2.5 py-1 bg-nature-50 text-nature-400 rounded-lg text-[8px] font-bold uppercase">{s}</span>)}
                        </div>
                        <div className="pt-4 border-t border-nature-50 flex items-center justify-between">
                            <span className="text-[10px] text-nature-300 font-bold uppercase">{v.applicantsCount} Guardiões inscritos</span>
                            <button 
                                onClick={() => handleApplyVacancy(v.id)}
                                className="px-5 py-2.5 bg-nature-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                            >
                                Candidatar-se
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </PortalView>
  );

  // --- TELA: MARKETPLACE (MEU BAZAR) ---
  if (view === ViewState.PRO_MARKETPLACE) return (
    <PortalView 
        title="Alquimia Comercial" 
        subtitle="GESTÃO DE BAZAR" 
        onBack={() => setView(ViewState.PRO_HOME)}
        footer={
            <button onClick={() => setShowAddProduct(true)} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-2">
                <Plus size={18}/> Novo Produto ou Ritual
            </button>
        }
    >
        <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm text-center">
                    <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Vendas Mês</p>
                    <h4 className="text-2xl font-serif italic text-nature-900">42</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm text-center">
                    <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Reputação Bazar</p>
                    <div className="flex items-center justify-center gap-1 text-amber-500">
                        <span className="text-2xl font-serif italic">4.9</span>
                        <Star size={14} fill="currentColor"/>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Meu Inventário Ativo</h4>
                    <Layers size={14} className="text-nature-200"/>
                </div>
                
                {myProducts.length > 0 ? myProducts.map(prod => (
                    <div key={prod.id} className="bg-white p-4 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-4 group">
                        <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shrink-0 relative">
                            <img src={prod.image} className="w-full h-full object-cover" />
                            <div className="absolute top-1 right-1 bg-white/90 p-1 rounded-lg text-nature-900 shadow-sm"><ExternalLink size={10}/></div>
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-nature-900 text-sm truncate">{prod.name}</h4>
                                <span className="text-[10px] font-bold text-nature-900">R$ {prod.price}</span>
                            </div>
                            <p className="text-[9px] text-nature-400 font-bold uppercase mt-1 tracking-widest">{prod.category} • {prod.type === 'physical' ? 'Em estoque' : 'Digital'}</p>
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-1.5 text-emerald-600"><Award size={10}/><span className="text-[9px] font-bold uppercase">+{prod.karmaReward} Karma</span></div>
                                <div className="flex gap-2">
                                    <button className="p-2 bg-nature-50 text-nature-300 rounded-lg hover:text-nature-900 transition-colors"><Save size={14}/></button>
                                    <button onClick={() => api.marketplace.delete(prod.id).then(refreshData)} className="p-2 bg-rose-50 text-rose-300 rounded-lg hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center opacity-30 space-y-4">
                        <ShoppingBag size={48} className="mx-auto" />
                        <p className="italic text-sm">Seu bazar está em silêncio.<br/>Manifeste seu primeiro item.</p>
                    </div>
                )}
            </div>
        </div>
        <ProductFormModal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} onSubmit={handleAddProduct} />
    </PortalView>
  );

  // --- TELA: AGENDA ---
  if (view === ViewState.PRO_AGENDA) return (
    <PortalView title="Agenda de Luz" subtitle="FLUXO DE TEMPO" onBack={() => setView(ViewState.PRO_HOME)}>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif italic text-lg text-nature-900">Maio, 2024</h3>
              <div className="flex gap-2">
                 <button className="p-2 bg-nature-50 rounded-xl"><ChevronLeft size={16}/></button>
                 <button className="p-2 bg-nature-50 rounded-xl"><ChevronRight size={16}/></button>
              </div>
           </div>
           <div className="grid grid-cols-7 gap-2 mb-4">
              {['D','S','T','Q','Q','S','S'].map(d => <span key={d} className="text-[10px] font-bold text-nature-300 text-center uppercase">{d}</span>)}
              {Array.from({length: 31}).map((_, i) => (
                <button key={i} className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all ${i + 1 === 22 ? 'bg-nature-900 text-white shadow-lg' : 'text-nature-600 hover:bg-nature-50'}`}>
                  {i + 1}
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-4">
           <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Rituais de Hoje</h4>
           {appointments.filter(a => a.status === 'confirmed').map(apt => (
              <div key={apt.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between group">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 font-bold text-xs">{apt.time}</div>
                    <div><h4 className="font-bold text-nature-900 text-sm">{apt.clientName}</h4><p className="text-[10px] text-nature-400 font-bold uppercase">{apt.serviceName}</p></div>
                 </div>
                 <button className="p-3 bg-nature-50 text-nature-400 rounded-xl group-hover:bg-nature-900 group-hover:text-white transition-all"><Video size={16}/></button>
              </div>
           ))}
           <button className="w-full py-5 border-2 border-dashed border-nature-100 rounded-[2.5rem] text-nature-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white transition-all"><Moon size={16}/> Bloquear para Recolhimento</button>
        </div>
      </div>
    </PortalView>
  );

  // --- TELA: REDE ALQUIMIA (NETWORKING) ---
  if (view === ViewState.PRO_NETWORK) return (
    <PortalView title="Rede Alquimia" subtitle="ESCAMBO HOLÍSTICO" onBack={() => setView(ViewState.PRO_HOME)}>
      <div className="space-y-8">
        <div className="bg-indigo-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden">
           <Zap size={140} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-300 mb-2">Seus Créditos de Troca</p>
           <h3 className="text-5xl font-serif italic mb-6">{user.swapCredits || 120} <span className="text-xl text-indigo-300">Créditos</span></h3>
           <div className="flex gap-3">
              <button className="flex-1 bg-white/10 backdrop-blur-md py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest border border-white/10">Ver Ofertas</button>
              <button className="flex-1 bg-white/10 backdrop-blur-md py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest border border-white/10">Listar Oferta</button>
           </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Trocas Sugeridas</h4>
           {user.offers?.map((offer, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><RefreshCw size={24}/></div>
                    <div><h4 className="font-bold text-nature-900 text-sm">{offer}</h4><p className="text-[9px] text-nature-400 font-bold uppercase">Disponível para Permuta</p></div>
                 </div>
                 <div className="text-right"><span className="text-xs font-bold text-nature-900">45 Cr</span></div>
              </div>
           ))}
        </div>

        <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 text-center space-y-4">
           <Users size={40} className="mx-auto text-indigo-600" />
           <h4 className="font-serif italic text-lg text-nature-900">Comunidade de Guardiões</h4>
           <p className="text-xs text-nature-500 italic px-4">"Ninguém cura sozinho. Fortaleça sua rede trocando saberes e ferramentas."</p>
           <button className="w-full py-4 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest">Acessar Fórum da Tribo</button>
        </div>
      </div>
    </PortalView>
  );

  // --- TELA: PRONTUÁRIO DETALHES ---
  if (view === ViewState.PRO_PATIENT_DETAILS && selectedPatient) return (
    <PortalView title="Prontuário Sagrado" subtitle={selectedPatient.name.toUpperCase()} onBack={() => { setView(ViewState.PRO_PATIENTS); setSelectedPatient(null); }}>
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-4">
              <DynamicAvatar user={{name: selectedPatient.name}} size="lg" />
              <div>
                 <h3 className="font-bold text-nature-900 text-lg">{selectedPatient.name}</h3>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-[9px] font-bold text-nature-400 uppercase">Paciente desde Fev/2024</span>
                 </div>
              </div>
           </div>
           <button className="p-4 bg-white rounded-full border border-nature-100 shadow-sm text-primary-600"><Share2 size={20}/></button>
        </div>

        <div className="space-y-4">
           <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2 flex items-center gap-2"><FileText size={12}/> Notas Terapêuticas (Privado)</label>
           <textarea 
             value={patientNotes} 
             onChange={e => setPatientNotes(e.target.value)}
             placeholder="Ancore aqui os insights desta jornada..."
             className="w-full bg-white border border-nature-100 p-6 rounded-[2.5rem] text-sm outline-none focus:ring-4 focus:ring-primary-500/5 min-h-[200px] shadow-sm italic leading-relaxed"
           />
           <button 
             onClick={handleSaveNotes}
             disabled={isSaving}
             className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
           >
             {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} 
             Salvar Registro
           </button>
        </div>

        <div className="bg-nature-100/50 p-6 rounded-[2.5rem] border border-nature-200 space-y-4">
           <div className="flex items-center gap-2"><Lock size={14} className="text-nature-400"/><h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Selos de Acesso (LGPD)</h4></div>
           <p className="text-[10px] text-nature-500 leading-relaxed italic">Este paciente ainda não autorizou o compartilhamento de dados com outros guardiões.</p>
           <button className="w-full py-3 bg-white border border-nature-200 text-nature-400 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Shield size={14}/> Solicitar Consentimento</button>
        </div>
      </div>
    </PortalView>
  );

  // --- TELA: MEU JARDIM (PACIENTES) ---
  if (view === ViewState.PRO_PATIENTS) return (
    <PortalView title="Meu Jardim" subtitle="GESTÃO DE ALMAS" onBack={() => setView(ViewState.PRO_HOME)}>
        <div className="space-y-8">
            <div className="bg-emerald-500 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                 <Flower size={160} className="absolute -right-8 -bottom-8 opacity-20 rotate-12" />
                 <div className="relative z-10 space-y-6">
                      <h3 className="text-4xl font-serif italic leading-tight">Cultivando Almas</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/20"><p className="text-[8px] font-bold uppercase text-emerald-100 mb-1">Total de Curas</p><span className="text-xl font-bold">{appointments.length} Sessões</span></div>
                          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/20"><p className="text-[8px] font-bold uppercase text-emerald-100 mb-1">Satisfação</p><div className="flex items-center gap-1"><span className="text-xl font-bold">{user.rating || 5.0}</span><Star size={12} fill="currentColor" /></div></div>
                      </div>
                 </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                   <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2"><Activity size={12} className="text-emerald-500" /> Mapa de Vibração</h4>
                   <button className="text-[9px] font-bold text-primary-600 uppercase">Filtrar Críticos</button>
                </div>
                {isLoading ? (
                  <div className="space-y-4"><OrganicSkeleton className="h-24 w-full"/><OrganicSkeleton className="h-24 w-full"/></div>
                ) : appointments.map(apt => {
                    const moodKey = ['VIBRANTE', 'ANSIOSO', 'SERENO', 'FOCADO'][Math.floor(Math.random()*4)];
                    const mood = moodConfig[moodKey];
                    return (
                      <button 
                        key={apt.id} 
                        onClick={() => { setSelectedPatient({id: apt.clientId, name: apt.clientName}); setView(ViewState.PRO_PATIENT_DETAILS); }}
                        className="w-full bg-white p-5 rounded-[2.5rem] border border-nature-100 flex justify-between items-center shadow-sm group hover:shadow-md transition-all active:scale-95 text-left"
                      >
                          <div className="flex items-center gap-4">
                              <div className="relative"><DynamicAvatar user={{name: apt.clientName}} size="md" /><div className={`absolute -bottom-1 -right-1 w-6 h-6 ${mood.color} rounded-full border-2 border-white flex items-center justify-center shadow-sm`}><mood.icon size={10} /></div></div>
                              <div><h4 className="font-bold text-nature-900 text-sm">{apt.clientName}</h4><p className="text-[8px] text-nature-400 font-bold uppercase mt-1">Sintonizado como: <span className={mood.color.split(' ')[0]}>{mood.label}</span></p></div>
                          </div>
                          <ChevronRight size={18} className="text-nature-200 group-hover:text-primary-500 transition-colors" />
                      </button>
                    );
                })}
            </div>
        </div>
    </PortalView>
  );

  // --- TELA: DASHBOARD (HOME) ---
  return (
    <div className="flex flex-col animate-in fade-in w-full bg-primary-50 min-h-screen pb-24">
        {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
        <header className="flex items-center justify-between mt-8 mb-10 px-6 flex-none">
            <div className="flex items-center gap-4">
                <button onClick={() => setView(ViewState.SETTINGS)} className="relative group">
                    <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-xl group-hover:scale-105 transition-transform" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center z-20 pointer-events-none shadow-md animate-pulse"><Zap size={10} className="text-white fill-white" /></div>
                </button>
                <div><p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">Bom Despertar,</p><h2 className="text-2xl font-serif italic text-nature-900 leading-none mt-1">Mestre {user.name.split(' ')[0]}</h2></div>
            </div>
            <button className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400"><History size={20}/></button>
        </header>

        <div className="px-4 space-y-8">
            <div className="relative h-80 rounded-[3.5rem] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => setView(ViewState.PRO_AGENDA)}>
                <img src="https://images.unsplash.com/photo-1620733723572-11c52f7c2d82?q=80&w=800" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-nature-900 via-nature-900/40 to-transparent"></div>
                <div className="absolute inset-x-8 bottom-8 flex justify-between items-end text-white">
                    <div className="space-y-2">
                         <div className="flex items-center gap-2 bg-emerald-500 text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit animate-pulse">Ritual em 15min</div>
                        <h3 className="text-4xl font-serif italic leading-none">Ana Luz</h3>
                        <p className="text-[10px] text-primary-200 font-bold uppercase tracking-[0.2em]">Sessão: Reiki & Cristais</p>
                    </div>
                   <button className="w-16 h-16 bg-white text-nature-900 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all hover:bg-primary-50"><Play size={24} fill="currentColor" className="ml-1" /></button>
                </div>
            </div>

            <div className="bg-nature-50 p-6 rounded-[2.5rem] border border-nature-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                    <h4 className="font-bold text-nature-400 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><Sun size={12} className="text-amber-500"/> Mantra do Guardião</h4>
                    <p className="font-serif italic text-nature-900 text-sm leading-relaxed">"{getDailyMessage()}"</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <PortalCard title="Jardim" subtitle="PACIENTES" icon={Flower} bgImage="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600" onClick={() => setView(ViewState.PRO_PATIENTS)} />
                <PortalCard title="Alquimia" subtitle="REDE & TROCA" icon={Zap} bgImage="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=600" onClick={() => setView(ViewState.PRO_NETWORK)} delay={100} />
            </div>

            <div className="grid grid-cols-2 gap-4 pb-8">
                 <button onClick={() => setView(ViewState.PRO_OPPORTUNITIES)} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex flex-col items-center text-center space-y-3 group active:scale-95 transition-all">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform"><Briefcase size={24}/></div>
                    <span className="text-[10px] font-bold text-nature-900 uppercase tracking-widest">Oportunidades</span>
                </button>
                <button onClick={() => setView(ViewState.PRO_FINANCE)} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex flex-col items-center text-center space-y-3 group active:scale-95 transition-all">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><Wallet size={24}/></div>
                    <span className="text-[10px] font-bold text-nature-900 uppercase tracking-widest">Abundância</span>
                </button>
            </div>

            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-nature-100 flex items-center justify-between group active:scale-95 transition-all cursor-pointer" onClick={() => setView(ViewState.PRO_MARKETPLACE)}>
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><ShoppingBag size={28}/></div>
                    <div><h4 className="font-bold text-nature-900 text-sm">Meu Bazar</h4><p className="text-[10px] text-nature-400 font-bold uppercase mt-1">{myProducts.length} Itens Publicados</p></div>
                </div>
                <ChevronRight size={20} className="text-nature-200" />
            </div>
        </div>
    </div>
  );
};
