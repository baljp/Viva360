
import React, { useEffect, useState } from 'react';
import { ViewState, Professional, SpaceRoom, User, Transaction, Vacancy } from '../types';
import {
    Users, ChevronLeft, Home, BarChart3, Wallet, Plus, Sparkles, RefreshCw, Activity, ChevronRight, Briefcase, DollarSign, TrendingUp, TrendingDown, Star, Calendar, MessageSquare, ShieldCheck, Map
} from 'lucide-react';
import { api } from '../services/api';
import { DynamicAvatar, PortalCard, Card } from '../components/Common';
import { SimpleActionModal } from '../components/Modals';
import { SanctuaryMap } from '../components/SanctuaryMap';
import { VacancyManager } from '../components/VacancyManager';
import { InteractiveCalendar } from '../components/InteractiveCalendar';

const PortalView: React.FC<{ title: string, subtitle: string, onBack: () => void, children: React.ReactNode }> = ({ title, subtitle, onBack, children }) => (
    <div className="fixed inset-0 z-[150] flex flex-col bg-nature-50/50 backdrop-blur-xl animate-in slide-in-from-right duration-300">
        <header className="flex-none flex items-center justify-between px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white/80 backdrop-blur-md border-b border-white/40 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 bg-nature-50 rounded-full text-nature-600 active:scale-95 transition-all shadow-sm hover:bg-nature-100"><ChevronLeft size={22} /></button>
                <div className="space-y-0.5"><h2 className="text-xl font-serif font-medium text-nature-900 leading-none">{title}</h2><p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">{subtitle}</p></div>
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
  const [modalAction, setModalAction] = useState<{title: string, desc: string, label: string, action: () => Promise<void>} | null>(null);

  const startAction = (title: string, desc: string, label: string, action: () => Promise<void>) => {
      setModalAction({ title, desc, label, action });
  };

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
              <div className="flex flex-col items-center gap-6">
                  <DynamicAvatar user={selectedPro} size="xl" className="border-4 border-white shadow-2xl shadow-nature-900/10" />
                  <div className="text-center">
                    <h3 className="text-2xl font-serif italic font-medium text-nature-900">{selectedPro.name}</h3>
                    <div className="flex items-center gap-2 justify-center mt-2 bg-white/50 px-3 py-1 rounded-full border border-white/40">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-nature-900">{selectedPro.rating}</span>
                        <span className="text-nature-300">•</span>
                        <span className="text-[10px] font-bold text-nature-400 uppercase">{selectedPro.specialty[0]}</span>
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 text-center bg-white/60 backdrop-blur-sm border-white/60">
                      <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest mb-1">Horas Ativas</p>
                      <h4 className="text-2xl font-serif italic text-nature-900">128h</h4>
                  </Card>
                  <Card className="p-6 text-center bg-white/60 backdrop-blur-sm border-white/60">
                      <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest mb-1">Satisfação</p>
                      <h4 className="text-2xl font-serif italic text-nature-900">4.9</h4>
                  </Card>
              </div>

              <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Ações de Gestão</h4>
                  <button className="w-full p-6 bg-white/80 backdrop-blur-sm rounded-[2.5rem] border border-white/60 flex items-center justify-between shadow-sm hover:shadow-md transition-all active:scale-98">
                      <div className="flex items-center gap-4"><Calendar size={20} className="text-nature-400"/><span className="text-sm font-medium text-nature-900">Ver Agenda no Hub</span></div>
                      <ChevronRight size={18} className="text-nature-200" />
                  </button>
                  <button className="w-full p-6 bg-white/80 backdrop-blur-sm rounded-[2.5rem] border border-white/60 flex items-center justify-between shadow-sm hover:shadow-md transition-all active:scale-98">
                      <div className="flex items-center gap-4"><MessageSquare size={20} className="text-nature-400"/><span className="text-sm font-medium text-nature-900">Enviar Feedback</span></div>
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
              <Card className="p-8 bg-nature-900 text-white border-0 relative overflow-hidden shadow-xl shadow-nature-900/20">
                  <Briefcase size={120} className="absolute -right-6 -bottom-6 opacity-[0.03]" />
                  <div className="relative z-10">
                      <h3 className="text-2xl font-serif italic font-medium mb-3">{selectedVacancy.title}</h3>
                      <p className="text-sm text-primary-100/80 font-medium leading-relaxed">{selectedVacancy.description}</p>
                  </div>
              </Card>

              <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">{selectedVacancy.applicantsCount} Candidatos em Sincronia</h4>
                  {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white/80 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white/60 shadow-sm flex items-center justify-between hover:bg-white transition-colors">
                          <div className="flex items-center gap-4">
                              <DynamicAvatar user={{name: `Candidato ${i}`}} size="md" />
                              <div>
                                  <h4 className="font-bold text-nature-900 text-sm">Mestre {i}</h4>
                                  <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-0.5">Acupuntura • 4.8★</p>
                              </div>
                          </div>
                          <button className="p-3 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors"><ShieldCheck size={18}/></button>
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
                  <Card className="p-6 space-y-2 bg-white/60 backdrop-blur-sm border-white/60">
                      <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Ocupação</p>
                      <div className="flex items-end justify-between">
                          <h4 className="text-3xl font-serif italic text-nature-900">82%</h4>
                          <TrendingUp size={16} className="text-emerald-500 mb-1" />
                      </div>
                  </Card>
                  <Card className="p-6 space-y-2 bg-white/60 backdrop-blur-sm border-white/60">
                      <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Satisfação</p>
                      <div className="flex items-end justify-between">
                          <h4 className="text-3xl font-serif italic text-nature-900">4.9</h4>
                          <TrendingUp size={16} className="text-emerald-500 mb-1" />
                      </div>
                  </Card>
              </div>

              <Card className="p-8 bg-white/80 backdrop-blur-sm border-white/60">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-6">Atividade de Atendimentos</h4>
                  <div className="h-48 flex items-end justify-between gap-2">
                      {[40, 65, 50, 80, 55, 90, 75].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary-100 rounded-t-xl relative group transition-all hover:bg-primary-900" style={{height: `${h}%`}}>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-nature-900 text-white text-[8px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{(h*1.2).toFixed(0)}h</div>
                          </div>
                      ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[8px] font-bold text-nature-300 uppercase">
                      <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
                  </div>
              </Card>

              <button onClick={() => setView(ViewState.SPACE_FINANCE)} className="w-full bg-nature-900 text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-nature-900/20 active:scale-95 transition-all group">
                  <div className="flex items-center gap-4 text-left">
                      <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors"><DollarSign size={20}/></div>
                      <div><h4 className="font-bold text-sm">Resumo Financeiro</h4><p className="text-[9px] text-primary-400 font-bold uppercase mt-0.5">Ver detalhes do caixa</p></div>
                  </div>
                  <ChevronRight size={20} className="text-primary-500"/>
              </button>
          </div>
      </PortalView>
  );

  // --- SUB-TELA: ALTARES (SALAS) ---
  if (view === ViewState.SPACE_ROOMS) return (
      <PortalView title="Altares e Salas" subtitle="GESTÃO DE ESPAÇOS" onBack={() => setView(ViewState.SPACE_HOME)}>
           <SanctuaryMap 
                rooms={rooms}
                onRoomClick={(room) => {
                    // Start editing or viewing details
                    startAction(`Gerenciar ${room.name}`, `Alterar status ou detalhes do altar ${room.name}?`, "Editar", async () => {
                        // Mock update
                        const newStatus = room.status === 'available' ? 'occupied' : 'available';
                        const updatedRooms = rooms.map(r => r.id === room.id ? { ...r, status: newStatus } : r);
                        setRooms(updatedRooms as any);
                    });
                }}
                onEditRoom={(room) => {
                     startAction(`Editar ${room.name}`, "Alterar configurações físicas da sala?", "Salvar", async () => new Promise(r => setTimeout(r, 1000)));
                }}
                onCreateRoom={() => {
                     startAction("Novo Altar", "Criar um novo espaço sagrado no santuário?", "Criar", async () => new Promise(r => setTimeout(r, 1000)));
                }}
           />
      </PortalView>
  );

  // --- SUB-TELA: EQUIPE ---
  if (view === ViewState.SPACE_TEAM) return (
      <PortalView title="Círculo de Guardiões" subtitle="MINHA EQUIPE" onBack={() => setView(ViewState.SPACE_HOME)}>
          <div className="space-y-4">
              {team.map(pro => (
                  <button key={pro.id} onClick={() => { setSelectedPro(pro); setView(ViewState.SPACE_TEAM_DETAILS); }} className="w-full bg-white/80 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white/60 flex items-center gap-5 shadow-sm active:scale-[0.98] transition-all text-left hover:bg-white hover:shadow-md group">
                      <DynamicAvatar user={pro} size="lg" className="shadow-lg shadow-nature-900/5 group-hover:scale-105 transition-transform" />
                      <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-nature-900 truncate text-base">{pro.name}</h4>
                          <p className="text-[10px] text-nature-400 font-bold uppercase tracking-tighter truncate mt-0.5">{pro.specialty.join(' • ')}</p>
                      </div>
                      <div className="p-3 bg-nature-50 rounded-full group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors"><ChevronRight size={18} /></div>
                  </button>
              ))}
              <button 
                onClick={() => startAction("Expandir Círculo", "Enviar convite para novo guardião via e-mail?", "Enviar Convite", async () => new Promise(r => setTimeout(r, 1500)))}
                className="w-full py-6 border-2 border-dashed border-nature-200 rounded-[2.5rem] text-nature-400 flex items-center justify-center gap-3 hover:bg-white/50 hover:border-primary-200 hover:text-primary-600 transition-all text-xs font-bold uppercase tracking-widest"
              >
                <Plus size={18} /> Convidar Mestre
              </button>
          </div>
      </PortalView>
  );

  // --- SUB-TELA: RECRUTAMENTO ---
  if (view === ViewState.SPACE_RECRUITMENT) return (
      <VacancyManager 
          vacancies={vacancies}
          onCreate={async (v: any) => {
              const newVac = { ...v, id: `vac_${Date.now()}`, createdAt: new Date().toISOString(), applicantsCount: 0, status: 'open' as const };
              setVacancies([newVac, ...vacancies]);
          }}
          onClose={() => setView(ViewState.SPACE_HOME)}
      />
  );

  // --- SUB-TELA: AGENDA (FLUXO) ---
  if (view === ViewState.SPACE_CALENDAR) {
      return (
          <InteractiveCalendar
              appointments={[]} // Should be real data
              onClose={() => setView(ViewState.SPACE_HOME)}
              onAddAppointment={() => {}}
              onReschedule={() => {}}
              onCancel={() => {}}
              onConfirm={() => {}}
          />
      );
  }

  // --- SUB-TELA: FINANCEIRO ---
  if (view === ViewState.SPACE_FINANCE) return (
      <PortalView title="Fluxo do Caixa" subtitle="ABUNDÂNCIA HUB" onBack={() => setView(ViewState.SPACE_HOME)}>
          <div className="space-y-8">
              <div className="bg-nature-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-500/20 transition-all duration-1000"></div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400 mb-2 relative z-10">Faturamento em Fluxo</p>
                   <h3 className="text-5xl font-serif italic font-medium relative z-10">R$ 142.902,40</h3>
              </div>
              <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Movimentações Recentes</h4>
                  {transactions.slice(0, 5).map(tx => (
                      <div key={tx.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white/60 flex justify-between items-center shadow-sm hover:bg-white transition-colors">
                          <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-2xl ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}><DollarSign size={18}/></div>
                              <div><p className="text-xs font-bold text-nature-900">{tx.description}</p><p className="text-[9px] text-nature-300 uppercase font-bold mt-0.5">{new Date(tx.date).toLocaleDateString()}</p></div>
                          </div>
                          <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}</span>
                      </div>
                  ))}
              </div>
          </div>
      </PortalView>
  );

  return (
    <div className="flex flex-col animate-in fade-in pb-24 selection:bg-primary-500 selection:text-white">
        <header className="flex justify-between items-center mt-10 mb-12 px-2">
            <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.4em]">HUB EM SINTONIA</p>
                <h2 className="text-4xl font-serif italic text-nature-900 leading-tight font-medium">{user.name}</h2>
            </div>
            <button onClick={() => setView(ViewState.SETTINGS)} className="w-16 h-16 rounded-[1.8rem] border-[3px] border-white shadow-xl overflow-hidden active:scale-95 transition-all hover:border-primary-200">
                <img src={user.avatar} className="w-full h-full object-cover" />
            </button>
        </header>

        <div className="mb-10 px-2">
            <button onClick={() => setView(ViewState.SPACE_DASHBOARD)} className="w-full bg-nature-900 text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden text-left group active:scale-[0.98] transition-all">
                <div className="absolute inset-0 bg-primary-500/10 blur-[60px] translate-x-1/2 translate-y-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-[0.3em] mb-2 relative z-10">Radiância Operacional</p>
                <div className="flex items-end gap-3 relative z-10">
                    <h3 className="text-5xl font-serif italic leading-none font-medium text-white">{user.radianceScore || 892}</h3>
                    <span className="text-sm font-sans not-italic text-nature-400 lowercase mb-1">karma</span>
                </div>
                <Sparkles className="absolute -bottom-4 -right-4 opacity-5" size={150} />
            </button>
        </div>

            <div className="grid grid-cols-2 gap-6 bg-white/50 p-6 rounded-[2.5rem] border border-white/60 shadow-sm backdrop-blur-sm">
                 <PortalCard title="Mapa" subtitle="ALTARES" icon={Map} bgImage="https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=600" onClick={() => setView(ViewState.SPACE_ROOMS)} />
                 <PortalCard title="Agenda" subtitle="FLUXO" icon={Calendar} bgImage="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600" onClick={() => setView(ViewState.SPACE_CALENDAR)} delay={100} />
                 <PortalCard title="Equipe" subtitle="GUARDIÕES" icon={Users} bgImage="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=600" onClick={() => setView(ViewState.SPACE_TEAM)} delay={200} />
                 <PortalCard title="Vagas" subtitle="RECRUTAMENTO" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600" onClick={() => setView(ViewState.SPACE_RECRUITMENT)} delay={300} />
                 <PortalCard title="Abundância" subtitle="FINANCEIRO" icon={Wallet} bgImage="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600" onClick={() => setView(ViewState.SPACE_FINANCE)} delay={400} />
            </div>
        <SimpleActionModal 
            isOpen={!!modalAction} 
            onClose={() => setModalAction(null)} 
            title={modalAction?.title || ''} 
            description={modalAction?.desc || ''} 
            actionLabel={modalAction?.label || ''} 
            onAction={modalAction?.action || (async ()=>{})} 
        />
    </div>
  );
};
