
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
      api.appointments.list(user.id, user.role).then(setAppointments);
      api.spaces.getTransactions(user.id).then(setTransactions);
      api.professionals.list().then(data => setNetwork(data.filter(p => p.id !== user.id)));
      api.spaces.getVacancies().then(setVacancies);
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
            <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 flex items-center gap-4">
                <div className="p-3 bg-amber-200 text-amber-700 rounded-2xl"><Sparkles size={20}/></div>
                <p className="text-xs text-amber-900 font-medium italic">Santuários próximos buscam seu dom. Candidate-se para expandir seu jardim.</p>
            </div>
            {vacancies.map(v => (
                <Card key={v.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-nature-900">{v.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <MapPin size={12} className="text-nature-300" />
                                <span className="text-[10px] font-bold text-nature-400 uppercase">Santuário Tambaú</span>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-nature-100 rounded-full text-[8px] font-bold uppercase tracking-widest">Aberto</span>
                    </div>
                    <p className="text-xs text-nature-500 italic leading-relaxed">{v.description}</p>
                    <div className="flex flex-wrap gap-2">
                        {v.specialties.map(s => <span key={s} className="px-2 py-1 bg-primary-50 text-primary-600 rounded-lg text-[8px] font-bold uppercase">{s}</span>)}
                    </div>
                    <button 
    onClick={() => startAction("Candidatura", `Deseja enviar sua energia para a vaga ${v.title}?`, "Confirmar Envio", async () => new Promise(r => setTimeout(r, 1000)))}
    className="w-full py-4 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
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
      <PortalView title="Rede de Alquimia" subtitle="CONEXÕES ENTRE MESTRES" onBack={() => setView(ViewState.PRO_HOME)}>
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 flex items-center gap-4 shadow-sm">
                  <Search size={18} className="text-nature-300" />
                  <input placeholder="Buscar guardiões para trocas..." className="flex-1 bg-transparent text-sm outline-none" />
              </div>
              <div className="space-y-4">
                  {network.map(p => (
                      <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                            <DynamicAvatar user={p} size="md" />
                            <div><h4 className="font-bold text-nature-900 text-sm">{p.name}</h4><p className="text-[9px] text-nature-400 font-bold uppercase">{p.specialty[0]}</p></div>
                          </div>
                          <button className="p-3 bg-primary-50 text-primary-600 rounded-xl active:scale-95 transition-all"><MessageSquare size={16}/></button>
                      </div>
                  ))}
              </div>
          </div>
      </PortalView>
  );

  // --- SUB-TELA: PRONTUÁRIO ---
  if (view === ViewState.PRO_PATIENT_DETAILS && selectedPatient) return (
      <PortalView title="Prontuário" subtitle="DETALHES DO BUSCADOR" onBack={() => setView(ViewState.PRO_PATIENTS)}>
          <div className="space-y-8">
              <div className="flex flex-col items-center gap-4">
                  <DynamicAvatar user={selectedPatient} size="xl" className="border-4 border-white shadow-2xl" />
                  <div className="text-center">
                    <h3 className="text-2xl font-serif italic text-nature-900">{selectedPatient.name}</h3>
                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">Metamorfose: Ativa</p>
                  </div>
              </div>
              
              <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-nature-900 text-xs uppercase flex items-center gap-2"><FileText size={14}/> Notas do Ritual</h4>
                    <div className="flex items-center gap-2">
                        {isSaving ? <RefreshCw size={12} className="animate-spin text-primary-500" /> : <Cloud size={12} className="text-emerald-500" />}
                        <span className="text-[8px] font-bold text-nature-400 uppercase">{isSaving ? 'Sincronizando...' : lastSaved ? `Salvo às ${lastSaved.toLocaleTimeString()}` : 'Pronto para escrever'}</span>
                    </div>
                  </div>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Inicie o registro das frequências observadas..."
                    className="w-full h-64 bg-nature-50/50 p-6 rounded-3xl text-sm italic border-none focus:ring-2 focus:ring-primary-100 outline-none resize-none"
                  />
              </div>
          </div>
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
              <div className="bg-nature-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                  <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-2">Saldo em Sincronia</p>
                  <h3 className="text-5xl font-serif italic leading-none">R$ 14.500,80</h3>
              </div>
              <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Histórico de Trocas</h4>
                  {transactions.map(tx => (
                      <div key={tx.id} className="bg-white p-6 rounded-3xl border border-nature-100 flex justify-between items-center shadow-sm">
                          <div><p className="text-xs font-bold text-nature-900">{tx.description}</p><p className="text-[9px] text-nature-300 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</p></div>
                          <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}</span>
                      </div>
                  ))}
              </div>
          </div>
      </PortalView>
  );

  return (
    <div className="flex flex-col animate-in fade-in pb-24">
        <header className="flex items-center justify-between mt-10 mb-12">
            <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.4em]">GUARDIÃO • NÍVEL {user.prestigeLevel || 3}</p>
                <h2 className="text-4xl font-serif italic text-nature-900 leading-tight">Olá, {user.name.split(' ')[0]}</h2>
            </div>
            <button onClick={() => setView(ViewState.SETTINGS)} className="w-16 h-16 rounded-[1.8rem] border-[3px] border-white shadow-xl overflow-hidden active:scale-95 transition-all">
                <img src={user.avatar} className="w-full h-full object-cover" />
            </button>
        </header>
        
        <div className="grid grid-cols-2 gap-6">
             <PortalCard title="Agenda" subtitle="TEMPO" icon={CalendarIcon} bgImage="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600" onClick={() => setView(ViewState.PRO_AGENDA)} />
             <PortalCard title="Jardim" subtitle="PACIENTES" icon={Flower} bgImage="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600" onClick={() => setView(ViewState.PRO_PATIENTS)} delay={100} />
             <PortalCard title="Alquimia" subtitle="REDE" icon={Zap} bgImage="https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=600" onClick={() => setView(ViewState.PRO_NETWORK)} delay={200} />
             <PortalCard title="Oportunidades" subtitle="VAGAS" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600" onClick={() => setView(ViewState.PRO_OPPORTUNITIES)} delay={300} />
             <PortalCard title="Abundância" subtitle="FINANCEIRO" icon={Wallet} bgImage="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600" onClick={() => setView(ViewState.PRO_FINANCE)} delay={400} />
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
