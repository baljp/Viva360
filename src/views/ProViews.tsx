
import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, Professional, Appointment, User, Transaction, Vacancy } from '../types';
import { 
    Calendar as CalendarIcon, ChevronLeft, Wallet, Flower, Zap, 
    Heart, Clock, Star, History, Plus, RefreshCw, CheckCircle2, Cloud, FileText, ChevronRight, Video, MessageSquare, Users, Search, Briefcase, MapPin, Sparkles
} from 'lucide-react';
import { DynamicAvatar, Card, ZenToast, PortalCard } from '../components/Common';
import { api } from '../services/api';
import { SimpleActionModal } from '../components/Modals';
import InteractiveCalendar from '../components/InteractiveCalendar';
import PatientGarden from '../components/PatientGarden';
import { AgendaWidget } from '../components/AgendaWidget';
import { PatientRecord } from '../components/PatientRecord';
import { SwapCircle } from '../components/SwapCircle';

const PortalView: React.FC<{ title: string, subtitle: string, onBack: () => void, children: React.ReactNode }> = ({ title, subtitle, onBack, children }) => (
    <div className="fixed inset-0 z-[150] flex flex-col bg-nature-50 animate-in slide-in-from-right duration-300">
        <header className="flex-none flex items-center gap-4 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 z-10 shadow-sm">
            <button onClick={onBack} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all shadow-sm"><ChevronLeft size={22} /></button>
            <div className="space-y-0.5"><h2 className="text-xl font-serif italic text-nature-900 leading-none">{title}</h2><p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">{subtitle}</p></div>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar pb-[calc(4rem+env(safe-area-inset-bottom))] pt-6 px-6">{children}</div>
    </div>
);

export const ProViews: React.FC<{ 
    user: Professional, view: ViewState, setView: (v: ViewState) => void, updateUser: (u: User) => void 
}> = ({ user, view, setView, updateUser }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [network, setNetwork] = useState<Professional[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [modalAction, setModalAction] = useState<{title: string, desc: string, label: string, action: () => Promise<void>} | null>(null);

  const startAction = (title: string, desc: string, label: string, action: () => Promise<void>) => {
      setModalAction({ title, desc, label, action });
  };

  useEffect(() => {
      api.appointments.list(user.id, user.role).then(setAppointments).catch(e => console.error("Appointments error", e));
      api.spaces.getTransactions(user.id).then((txs: any[]) => {
          if (Array.isArray(txs)) setTransactions(txs as Transaction[]);
      }).catch(e => console.error("Transactions error", e));
      
      api.professionals.list().then(data => {
          console.log("Pro Network Data:", data);
          if (Array.isArray(data)) {
              setNetwork(data.filter(p => p.id !== user.id));
          } else {
              console.error("Pro Network Data is not an array!", data);
              setNetwork([]);
          }
      }).catch(e => console.error("Pro Network error", e));

      api.spaces.getVacancies().then(data => {
           if(Array.isArray(data)) setVacancies(data);
      }).catch(e => console.error("Vacancies error", e));
  }, [user.id, user.role]);

  useEffect(() => {
      if (selectedPatient && view === ViewState.PRO_PATIENT_DETAILS) {
          api.professionals.getNotes(selectedPatient.id, user.id).then(setNotes);
      }
  }, [selectedPatient, view, user.id]);

  const saveNotes = useCallback(async (content: string) => {
      if (!selectedPatient) return;
      setIsSaving(true);
      try {
          await api.professionals.updateNotes(selectedPatient.id, user.id, content);
          setLastSaved(new Date());
      } catch (e) {
          console.error("Erro ao sincronizar notas.");
      } finally {
          setIsSaving(false);
      }
  }, [selectedPatient, user.id]);

  useEffect(() => {
      const timeout = setTimeout(() => {
          if (notes) saveNotes(notes);
      }, 2000);
      return () => clearTimeout(timeout);
  }, [notes, saveNotes]);

  // --- SUB-TELA: OPORTUNIDADES ---
  if (view === ViewState.PRO_OPPORTUNITIES) return (
    <PortalView title="Oportunidades" subtitle="VAGAS EM SANTUÁRIOS" onBack={() => setView(ViewState.PRO_HOME)}>
        <div className="space-y-6">
            <div className="bg-amber-50/50 backdrop-blur-md p-6 rounded-[2rem] border border-amber-100/50 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-full"><Sparkles size={20}/></div>
                <p className="text-xs text-amber-900 font-medium italic">Santuários próximos buscam seu dom. Candidate-se para expandir seu jardim.</p>
            </div>
            {vacancies.map(v => (
                <Card key={v.id} className="p-8 space-y-4 bg-white/80 backdrop-blur-sm border-white/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-nature-900 text-lg">{v.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <MapPin size={12} className="text-nature-400" />
                                <span className="text-[10px] font-bold text-nature-500 uppercase tracking-wide">Santuário Tambaú</span>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-bold uppercase tracking-widest border border-green-100">Aberto</span>
                    </div>
                    <p className="text-sm text-nature-600 italic leading-relaxed bg-nature-50/50 p-4 rounded-2xl border border-nature-100/50">{v.description}</p>
                    <div className="flex flex-wrap gap-2">
                        {v.specialties.map(s => <span key={s} className="px-3 py-1 bg-white text-nature-600 rounded-full text-[9px] font-bold uppercase border border-nature-100 shadow-sm">{s}</span>)}
                    </div>
                    <button 
    onClick={() => startAction("Candidatura", `Deseja enviar sua energia para a vaga ${v.title}?`, "Confirmar Envio", async () => new Promise(r => setTimeout(r, 1000)))}
    className="w-full py-4 bg-nature-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-nature-900/10 active:scale-95 transition-all hover:bg-nature-800"
>
    Enviar Minha Energia
</button>
                </Card>
            ))}
        </div>
    </PortalView>
  );

  // --- SUB-TELA: AGENDA ---
  if (view === ViewState.PRO_AGENDA) return (
      <InteractiveCalendar 
          appointments={appointments} 
          onClose={() => setView(ViewState.PRO_HOME)} 
          onAddAppointment={() => {}} 
          onReschedule={() => {}} 
          onCancel={() => {}} 
          onConfirm={() => {}} 
      />
  );

  // --- SUB-TELA: REDE (ALQUIMIA) ---
  if (view === ViewState.PRO_NETWORK) return (
      <SwapCircle 
          currentUser={user}
          offers={[
              { id: '1', professionalId: 'p2', offer: 'Sessão de Constelação', seek: 'Apoio em Roda de Conversa', status: 'active', createdAt: new Date().toISOString() },
              { id: '2', professionalId: 'p3', offer: 'Massagem Ayurvédica', seek: 'Leitura de Mapa Astral', status: 'active', createdAt: new Date().toISOString() }
          ]} // Mock data
          onClose={() => setView(ViewState.PRO_HOME)}
          onCreateOffer={(offer, seek) => {
              // Add to API
              console.log("Creating swap:", offer, seek);
          }}
          onMatch={(id) => {
              startAction("Confirmar Escambo", "Deseja iniciar esta troca sagrada? Ela será registrada em sua jornada.", "Aceitar", async () => {
                  await new Promise(r => setTimeout(r, 1000));
                  // Logic to create appointment of type 'swap'
              });
          }}
      />
  );

  // --- SUB-TELA: PRONTUÁRIO ---
  if (view === ViewState.PRO_PATIENT_DETAILS && selectedPatient) return (
      <PortalView title="Prontuário" subtitle="DETALHES DO BUSCADOR" onBack={() => setView(ViewState.PRO_PATIENTS)}>
          <PatientRecord 
              patient={selectedPatient}
              notes={notes}
              onSaveNotes={setNotes} // In real app, debounce inside or pass saver
              isSaving={isSaving}
              lastSaved={lastSaved}
          />
      </PortalView>
  );

  // --- SUB-TELA: PACIENTES ---
  if (view === ViewState.PRO_PATIENTS) return (
      <PatientGarden 
          patients={appointments.map(a => ({
              id: a.clientId,
              name: a.clientName,
              avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${a.clientId}`,
              lastSession: '2024-01-20',
              totalSessions: 5,
              status: 'active',
              tags: ['Terapia'],
              progress: 50
          }))} 
          onClose={() => setView(ViewState.PRO_HOME)} 
          onViewPatient={(id) => { setSelectedPatient({id, name: 'Paciente'}); setView(ViewState.PRO_PATIENT_DETAILS); }}
          onSendMessage={() => {}}
          onSchedule={() => {}}
          onViewRecords={() => {}}
      />
  );

  // --- SUB-TELA: FINANÇAS ---
  if (view === ViewState.PRO_FINANCE) return (
      <PortalView title="Fluxo" subtitle="ABUNDÂNCIA" onBack={() => setView(ViewState.PRO_HOME)}>
          <div className="space-y-8">
              <div className="bg-nature-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-nature-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-1000"></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold text-nature-300 uppercase tracking-widest mb-3">Saldo em Sincronia</p>
                    <h3 className="text-5xl font-serif font-medium leading-none tracking-tight">R$ 14.500,80</h3>
                  </div>
              </div>
              <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Histórico de Trocas</h4>
                  {transactions.map(tx => (
                      <div key={tx.id} className="bg-white p-6 rounded-[2rem] border border-nature-100 flex justify-between items-center shadow-sm">
                          <div><p className="text-xs font-bold text-nature-900">{tx.description}</p><p className="text-[9px] text-nature-300 font-bold uppercase mt-1">{new Date(tx.date).toLocaleDateString()}</p></div>
                          <span className={`text-sm font-bold bg-opacity-10 px-3 py-1 rounded-full ${tx.type === 'income' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>{tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}</span>
                      </div>
                  ))}
              </div>
          </div>
      </PortalView>
  );

  return (
    <div className="flex flex-col animate-in fade-in pb-24 selection:bg-primary-500 selection:text-white">
        <header className="flex items-center justify-between mt-10 mb-12 px-2">
            <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.4em]">GUARDIÃO • NÍVEL {user.prestigeLevel || 3}</p>
                <h2 className="text-4xl font-serif font-medium text-nature-900 leading-tight">Olá, {user.name.split(' ')[0]}</h2>
            </div>
            <button onClick={() => setView(ViewState.SETTINGS)} className="w-16 h-16 rounded-[2rem] border-[4px] border-white shadow-xl shadow-nature-900/10 overflow-hidden active:scale-95 transition-all hover:rotate-3">
                <img src={user.avatar} className="w-full h-full object-cover" />
            </button>
        </header>
        
        <div className="space-y-8">
            {/* Agenda Viva Widget */}
            <AgendaWidget 
                appointments={appointments}
                onConfirm={async (id) => {
                    await api.appointments.updateStatus(id, 'confirmed');
                    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
                }}
                onCancel={(id) => {}}
                onViewRecord={(clientId) => {
                    const apt = appointments.find(a => a.clientId === clientId);
                    if (apt) {
                        setSelectedPatient({ 
                            id: apt.clientId, 
                            name: apt.clientName, 
                            email: `${apt.clientName.toLowerCase().replace(' ', '.')}@viva360.com`, // Mock email
                            plantStage: 'BLOOM', // Mock data integration
                            plantState: 'HEALTHY'
                        });
                        setView(ViewState.PRO_PATIENT_DETAILS);
                    }
                }}
            />

            <div className="grid grid-cols-2 gap-6">
                 <PortalCard title="Agenda" subtitle="TEMPO" icon={CalendarIcon} bgImage="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600" onClick={() => setView(ViewState.PRO_AGENDA)} />
                 <PortalCard title="Jardim" subtitle="PACIENTES" icon={Flower} bgImage="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600" onClick={() => setView(ViewState.PRO_PATIENTS)} delay={100} />
                 <PortalCard title="Alquimia" subtitle="REDE" icon={Zap} bgImage="https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=600" onClick={() => setView(ViewState.PRO_NETWORK)} delay={200} />
                 <PortalCard title="Oportunidades" subtitle="VAGAS" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600" onClick={() => setView(ViewState.PRO_OPPORTUNITIES)} delay={300} />
                 <PortalCard title="Abundância" subtitle="FINANCEIRO" icon={Wallet} bgImage="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600" onClick={() => setView(ViewState.PRO_FINANCE)} delay={400} />
            </div>
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
