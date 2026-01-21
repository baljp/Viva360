
import React, { useEffect, useState } from 'react';
import { ViewState, Professional, SpaceRoom, User, Transaction, Vacancy } from '../types';
import { 
    Users, ChevronLeft, Home, BarChart3, Wallet, Plus, Sparkles, RefreshCw, Activity, ChevronRight, Briefcase, DollarSign, TrendingUp, TrendingDown, Star, Calendar, MessageSquare, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { DynamicAvatar, PortalCard, Card } from '../components/Common';

const PortalView: React.FC<{ title: string, subtitle: string, onBack: () => void, children: React.ReactNode }> = ({ title, subtitle, onBack, children }) => (
    <div className="fixed inset-0 z-[150] flex flex-col bg-nature-50 animate-in slide-in-from-right duration-300">
        <header className="flex-none flex items-center justify-between px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all shadow-sm"><ChevronLeft size={22} /></button>
                <div className="space-y-0.5"><h2 className="text-xl font-serif italic text-nature-900 leading-none">{title}</h2><p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">{subtitle}</p></div>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar pb-[calc(4rem+env(safe-area-inset-bottom))] pt-6 px-6">{children}</div>
    </div>
);

export const SpaceViews: React.FC<{ user: User, view: ViewState, setView: (v: ViewState) => void }> = ({ user, view, setView }) => {
  const [rooms, setRooms] = useState<SpaceRoom[]>([]);
  const [team, setTeam] = useState<Professional[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
      api.spaces.getRooms(user.id).then(setRooms);
      api.spaces.getTeam(user.id).then(setTeam);
      api.spaces.getVacancies().then(setVacancies);
      api.spaces.getTransactions(user.id).then(setTransactions);
  }, [user.id]);

  const refreshRooms = async () => {
      setIsRefreshing(true);
      const data = await api.spaces.getRooms(user.id);
      setRooms(data);
      setIsRefreshing(false);
  };

  // --- SUB-TELA: DETALHES DA EQUIPE ---
  if (view === ViewState.SPACE_TEAM_DETAILS && selectedPro) return (
      <PortalView title={selectedPro.name} subtitle="PERFIL DO GUARDIÃO" onBack={() => setView(ViewState.SPACE_TEAM)}>
          <div className="space-y-8">
              <div className="flex flex-col items-center gap-4">
                  <DynamicAvatar user={selectedPro} size="xl" className="border-4 border-white shadow-2xl" />
                  <div className="text-center">
                    <h3 className="text-2xl font-serif italic text-nature-900">{selectedPro.name}</h3>
                    <div className="flex items-center gap-2 justify-center mt-2">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-nature-900">{selectedPro.rating}</span>
                        <span className="text-nature-300">•</span>
                        <span className="text-[10px] font-bold text-nature-400 uppercase">{selectedPro.specialty[0]}</span>
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 text-center">
                      <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest mb-1">Horas Ativas</p>
                      <h4 className="text-2xl font-serif italic text-nature-900">128h</h4>
                  </Card>
                  <Card className="p-6 text-center">
                      <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest mb-1">Satisfação</p>
                      <h4 className="text-2xl font-serif italic text-nature-900">4.9</h4>
                  </Card>
              </div>

              <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Ações de Gestão</h4>
                  <button className="w-full p-6 bg-white rounded-[2.5rem] border border-nature-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4"><Calendar size={18} className="text-nature-400"/><span className="text-sm font-medium">Ver Agenda no Hub</span></div>
                      <ChevronRight size={18} className="text-nature-200" />
                  </button>
                  <button className="w-full p-6 bg-white rounded-[2.5rem] border border-nature-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4"><MessageSquare size={18} className="text-nature-400"/><span className="text-sm font-medium">Enviar Feedback</span></div>
                      <ChevronRight size={18} className="text-nature-200" />
                  </button>
              </div>
          </div>
      </PortalView>
  );

  // --- SUB-TELA: DETALHES DA VAGA ---
  if (view === ViewState.SPACE_VACANCY_DETAILS && selectedVacancy) return (
      <PortalView title="Vaga Aberta" subtitle="GESTÃO DE CANDIDATOS" onBack={() => setView(ViewState.SPACE_RECRUITMENT)}>
          <div className="space-y-6">
              <Card className="p-8 bg-nature-900 text-white border-0 relative overflow-hidden">
                  <Briefcase size={80} className="absolute -right-4 -bottom-4 opacity-5" />
                  <h3 className="text-2xl font-serif italic mb-2">{selectedVacancy.title}</h3>
                  <p className="text-xs text-primary-400 font-medium italic">{selectedVacancy.description}</p>
              </Card>

              <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">{selectedVacancy.applicantsCount} Candidatos em Sincronia</h4>
                  {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <DynamicAvatar user={{name: `Candidato ${i}`}} size="md" />
                              <div>
                                  <h4 className="font-bold text-nature-900 text-sm">Mestre {i}</h4>
                                  <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Acupuntura • 4.8★</p>
                              </div>
                          </div>
                          <button className="p-3 bg-primary-50 text-primary-600 rounded-xl"><ShieldCheck size={18}/></button>
                      </div>
                  ))}
              </div>
          </div>
      </PortalView>
  );

  // --- SUB-TELA: DASHBOARD (RADIÂNCIA) ---
  if (view === ViewState.SPACE_DASHBOARD) return (
      <PortalView title="Radiância do Hub" subtitle="MÉTRICAS E FLUXO" onBack={() => setView(ViewState.SPACE_HOME)}>
          <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 space-y-2">
                      <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Ocupação</p>
                      <div className="flex items-end justify-between">
                          <h4 className="text-3xl font-serif italic">82%</h4>
                          <TrendingUp size={16} className="text-emerald-500 mb-1" />
                      </div>
                  </Card>
                  <Card className="p-6 space-y-2">
                      <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Satisfação</p>
                      <div className="flex items-end justify-between">
                          <h4 className="text-3xl font-serif italic">4.9</h4>
                          <TrendingUp size={16} className="text-emerald-500 mb-1" />
                      </div>
                  </Card>
              </div>

              <Card className="p-8">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-6">Atividade de Atendimentos</h4>
                  <div className="h-48 flex items-end justify-between gap-2">
                      {[40, 65, 50, 80, 55, 90, 75].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary-100 rounded-t-xl relative group transition-all hover:bg-primary-900" style={{height: `${h}%`}}>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-nature-900 text-white text-[8px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">{(h*1.2).toFixed(0)}h</div>
                          </div>
                      ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[8px] font-bold text-nature-300 uppercase">
                      <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
                  </div>
              </Card>

              <button onClick={() => setView(ViewState.SPACE_FINANCE)} className="w-full bg-nature-900 text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-4 text-left">
                      <div className="p-3 bg-white/10 rounded-2xl"><DollarSign size={20}/></div>
                      <div><h4 className="font-bold text-sm">Resumo Financeiro</h4><p className="text-[9px] text-primary-400 font-bold uppercase">Ver detalhes do caixa</p></div>
                  </div>
                  <ChevronRight size={20}/>
              </button>
          </div>
      </PortalView>
  );

  // --- SUB-TELA: ALTARES (SALAS) ---
  if (view === ViewState.SPACE_ROOMS) return (
      <PortalView title="Altares e Salas" subtitle="GESTÃO DE ESPAÇOS" onBack={() => setView(ViewState.SPACE_HOME)}>
           <div className="space-y-6">
               <div className="flex justify-between items-center px-2">
                   <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Status das Sincronias</h4>
                   <button onClick={refreshRooms} className={`${isRefreshing ? 'animate-spin' : ''} text-primary-500`}><RefreshCw size={14} /></button>
               </div>
               <div className="grid grid-cols-1 gap-4">
                   {rooms.map(room => (
                       <div key={room.id} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between transition-all">
                           <div className="flex items-center gap-4">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${room.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                   <Home size={20}/>
                               </div>
                               <div>
                                   <h4 className="font-bold text-nature-900 text-sm">{room.name}</h4>
                                   <p className={`text-[10px] font-bold uppercase mt-1 ${room.status === 'available' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                       {room.status === 'available' ? 'Livre' : `Ocupado: ${room.currentOccupant}`}
                                   </p>
                               </div>
                           </div>
                           <button className="p-3 bg-nature-50 rounded-xl"><Activity size={16}/></button>
                       </div>
                   ))}
               </div>
           </div>
      </PortalView>
  );

  // --- SUB-TELA: EQUIPE ---
  if (view === ViewState.SPACE_TEAM) return (
      <PortalView title="Círculo de Guardiões" subtitle="MINHA EQUIPE" onBack={() => setView(ViewState.SPACE_HOME)}>
          <div className="space-y-4">
              {team.map(pro => (
                  <button key={pro.id} onClick={() => { setSelectedPro(pro); setView(ViewState.SPACE_TEAM_DETAILS); }} className="w-full bg-white p-6 rounded-[2.5rem] border border-nature-100 flex items-center gap-5 shadow-sm active:scale-95 transition-all text-left">
                      <DynamicAvatar user={pro} size="lg" />
                      <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-nature-900 truncate">{pro.name}</h4>
                          <p className="text-[10px] text-nature-400 font-bold uppercase tracking-tighter truncate">{pro.specialty.join(' • ')}</p>
                      </div>
                      <div className="p-3 bg-nature-50 rounded-xl"><ChevronRight size={18} /></div>
                  </button>
              ))}
              <button className="w-full py-6 border-2 border-dashed border-nature-100 rounded-[2.5rem] text-nature-300 flex items-center justify-center gap-3 hover:bg-white hover:border-primary-200 transition-all">
                  <Plus size={24} /> Convidar Mestre
              </button>
          </div>
      </PortalView>
  );

  // --- SUB-TELA: RECRUTAMENTO ---
  if (view === ViewState.SPACE_RECRUITMENT) return (
      <PortalView title="Busca de Guardiões" subtitle="RECRUTAMENTO" onBack={() => setView(ViewState.SPACE_HOME)}>
          <div className="space-y-4">
              {vacancies.map(v => (
                  <Card key={v.id} className="p-6 border-indigo-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="font-bold text-nature-900 text-sm">{v.title}</h4>
                            <p className="text-[10px] text-nature-400 font-bold uppercase mt-1">{v.specialties.join(', ')}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-bold uppercase">{v.applicantsCount} Inscritos</span>
                      </div>
                      <button onClick={() => { setSelectedVacancy(v); setView(ViewState.SPACE_VACANCY_DETAILS); }} className="w-full py-3 bg-nature-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Ver Candidatos</button>
                  </Card>
              ))}
          </div>
      </PortalView>
  );

  // --- SUB-TELA: FINANCEIRO ---
  if (view === ViewState.SPACE_FINANCE) return (
      <PortalView title="Fluxo do Caixa" subtitle="ABUNDÂNCIA HUB" onBack={() => setView(ViewState.SPACE_HOME)}>
          <div className="space-y-8">
              <div className="bg-nature-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400 mb-2">Faturamento em Fluxo</p>
                   <h3 className="text-5xl font-serif italic">R$ 142.902,40</h3>
              </div>
              <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Movimentações Recentes</h4>
                  {transactions.slice(0, 5).map(tx => (
                      <div key={tx.id} className="bg-white p-6 rounded-3xl border border-nature-100 flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}><DollarSign size={18}/></div>
                              <div><p className="text-xs font-bold text-nature-900">{tx.description}</p><p className="text-[9px] text-nature-300 uppercase font-bold">{new Date(tx.date).toLocaleDateString()}</p></div>
                          </div>
                          <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}</span>
                      </div>
                  ))}
              </div>
          </div>
      </PortalView>
  );

  return (
    <div className="flex flex-col animate-in fade-in pb-24">
        <header className="flex justify-between items-center mt-10 mb-12 px-2">
            <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.4em]">HUB EM SINTONIA</p>
                <h2 className="text-4xl font-serif italic text-nature-900 leading-tight">{user.name}</h2>
            </div>
            <button onClick={() => setView(ViewState.SETTINGS)} className="w-16 h-16 rounded-[1.8rem] border-[3px] border-white shadow-xl overflow-hidden active:scale-95 transition-all">
                <img src={user.avatar} className="w-full h-full object-cover" />
            </button>
        </header>

        <div className="mb-10 px-2">
            <button onClick={() => setView(ViewState.SPACE_DASHBOARD)} className="w-full bg-nature-900 text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden text-left group">
                <div className="absolute inset-0 bg-primary-500/10 blur-[60px] translate-x-1/2 translate-y-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-[0.3em] mb-2">Radiância Operacional</p>
                <div className="flex items-end gap-3">
                    <h3 className="text-5xl font-serif italic leading-none">{user.radianceScore || 892}</h3>
                    <span className="text-sm font-sans not-italic text-nature-400 lowercase mb-1">karma</span>
                </div>
                <Sparkles className="absolute -bottom-4 -right-4 opacity-5" size={150} />
            </button>
        </div>

        <div className="grid grid-cols-2 gap-6 px-2">
            <PortalCard title="Equipe" subtitle="CÍRCULO" icon={Users} bgImage="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600" onClick={() => setView(ViewState.SPACE_TEAM)} />
            <PortalCard title="Altares" subtitle="SALAS" icon={Home} bgImage="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600" onClick={() => setView(ViewState.SPACE_ROOMS)} delay={100} />
            <PortalCard title="Vagas" subtitle="RECRUTAR" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600" onClick={() => setView(ViewState.SPACE_RECRUITMENT)} delay={200} />
            <PortalCard title="Gestão" subtitle="DADOS" icon={BarChart3} bgImage="https://images.unsplash.com/photo-1551288049-bbdac8a28a1e?q=80&w=600" onClick={() => setView(ViewState.SPACE_DASHBOARD)} delay={300} />
        </div>
    </div>
  );
};
