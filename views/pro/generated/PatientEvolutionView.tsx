import React, { useState, useEffect } from 'react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { PortalView } from '../../../components/Common';
import { 
    Activity, Clock, Brain, Sprout, Plus, Sparkles, Leaf, TrendingUp
} from 'lucide-react';
import { api } from '../../../services/api';

const TimelineCard: React.FC<{ event: any }> = ({ event }) => (
    <div className="flex gap-4 group animate-in slide-in-from-bottom-2">
        <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${event.type === 'crisis' ? 'bg-rose-500' : (event.type === 'milestone' ? 'bg-amber-400' : 'bg-emerald-500')}`}></div>
            <div className="w-0.5 flex-1 bg-nature-100 group-last:bg-transparent"></div>
        </div>
        <div className="pb-8 flex-1">
            <div className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm relative group-hover:border-nature-300 transition-colors">
                 <div className="flex justify-between items-start mb-2">
                     <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${event.type === 'crisis' ? 'bg-rose-50 text-rose-600' : 'bg-nature-50 text-nature-500'}`}>{event.type}</span>
                     <span className="text-[10px] text-nature-300 font-bold">{new Date(event.date).toLocaleDateString()}</span>
                 </div>
                 <h4 className="font-bold text-nature-900 text-sm mb-1">{event.title}</h4>
                 <div className="flex items-center gap-2">
                     <Activity size={12} className={event.mood === 'Ansioso' ? 'text-rose-400' : 'text-emerald-400'} />
                     <span className="text-[10px] text-nature-400 font-bold uppercase">{event.mood}</span>
                 </div>
            </div>
        </div>
    </div>
);

const InterventionCard: React.FC<{ title: string, outcome: string, type: string }> = ({ title, outcome, type }) => (
    <div className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm mb-3">
        <div className="flex gap-4 items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${type === 'pratica' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {type === 'pratica' ? <Sparkles size={20}/> : <Leaf size={20}/>}
            </div>
            <div>
                <h4 className="font-bold text-nature-900 text-sm">{title}</h4>
                <p className="text-[10px] text-nature-500 mt-1 italic leading-relaxed">"{outcome}"</p>
            </div>
        </div>
    </div>
);

const Check = ({ size }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

export default function PatientEvolutionView() {
    const { back, go, notify, state } = useGuardiaoFlow();
    const [activeTab, setActiveTab] = useState<'timeline' | 'patterns' | 'interventions' | 'plan'>('timeline');
    
    useEffect(() => {
        if (state.currentState === 'PATIENT_PLAN') {
            setActiveTab('plan');
        }
    }, [state.currentState]);

    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock Patient ID for demo
    const PATIENT_ID = 'user_1'; // Linked to Ana Silva in MockDB

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await api.records.list(PATIENT_ID);
            // Default mock data if empty, for demo purposes
            if (data.length === 0) {
                 const initial = [
                    { id: 1, type: 'session', title: 'Sessão de Desbloqueio', date: '2023-10-24', mood: 'Vibrante', patientId: PATIENT_ID },
                    { id: 2, type: 'milestone', title: 'Ritual de Gratidão', date: '2023-10-20', mood: 'Sereno', patientId: PATIENT_ID }
                ];
                initial.forEach(r => api.records.create(r));
                setRecords(initial);
            } else {
                setRecords(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleAddEvent = async () => {
        // Simple interaction for demo verification
        const newEvent = {
            id: Date.now(),
            type: 'session',
            title: 'Sessão Evolutiva (Nova)',
            date: new Date().toISOString(),
            mood: 'Elevado',
            patientId: PATIENT_ID
        };
        await api.records.create(newEvent);
        setRecords(prev => [newEvent, ...prev]);
        notify('Evento Registrado', 'A linha da vida foi atualizada.', 'success');
    };

    return (
        <PortalView 
            title="Prontuário Evolutivo" 
            subtitle="JORNADA DA ALMA" 
            onBack={() => go('PATIENT_PROFILE')}
            heroImage="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800"
            footer={
                activeTab === 'timeline' ? (
                    <button onClick={handleAddEvent} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <Plus size={16} /> Adicionar Sessão
                    </button>
                ) : undefined
            }
        >
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar -mx-2 px-2">
                {[
                    { id: 'timeline', label: 'Linha da Vida', icon: Clock },
                    { id: 'patterns', label: 'Padrões', icon: Brain },
                    { id: 'interventions', label: 'Intervenções', icon: Sprout }, // Fixed Icon
                    { id: 'plan', label: 'Plano Vivo', icon: Activity },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-nature-900 text-white border-nature-900 shadow-lg' : 'bg-white text-nature-400 border-nature-100'}`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'timeline' && (
                <div className="pl-2 pb-24">
                    {loading ? <p className="text-center text-xs text-nature-400 animate-pulse">Sincronizando Akasha...</p> : records.map(evt => <TimelineCard key={evt.id} event={evt} />)}
                </div>
            )}
            
            {/* Keeping other tabs static for now as they are complex views */}
            {/* ... patterns, interventions, plan logic ... */}


            {activeTab === 'patterns' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-nature-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
                        <h4 className="font-serif italic text-xl mb-4">Constância Vibracional</h4>
                        <div className="flex items-end gap-2 h-32 px-4 pb-4 bg-white/5 rounded-2xl border border-white/10">
                            {[40, 60, 55, 78, 85, 82, 90].map((h, i) => (
                                <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/50 to-emerald-400 rounded-t-lg relative" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mt-4 text-center">Tendência de Alta Estabilidade</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                         <h5 className="font-bold text-nature-900 text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Brain size={16} className="text-nature-400"/> Padrões Recorrentes (IA)</h5>
                         <div className="flex flex-wrap gap-2">
                             <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-bold uppercase border border-rose-100">Gatilho: Rejeição</span>
                             <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold uppercase border border-indigo-100">Força: Resiliência</span>
                             <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-bold uppercase border border-amber-100">Ciclo: Lunar</span>
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'interventions' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <InterventionCard type="pratica" title="Respiração Holocriativa" outcome="Paciente relatou desbloqueio imediato no chakra laríngeo." />
                    <InterventionCard type="natureza" title="Banho de Ervas (Alecrim)" outcome="Aumento de vitalidade reportado após 2 dias." />
                    <InterventionCard type="pratica" title="Meditação da Criança Interior" outcome="Choro catártico e sensação de leveza." />
                </div>
            )}

             {activeTab === 'plan' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-[2.5rem] border border-emerald-100 text-center">
                        <Sprout size={32} className="mx-auto text-emerald-600 mb-3" />
                        <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Intenção Central</p>
                        <h3 className="text-xl font-serif italic text-nature-900">"Desenvolver Segurança Emocional"</h3>
                    </div>

                    <div className="space-y-3">
                         <div className="flex justify-between items-center px-1">
                             <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Micro-Metas da Semana</h4>
                             <button className="p-1 bg-nature-50 rounded text-nature-400"><TrendingUp size={14}/></button>
                        </div>
                        {[
                            { title: 'Diário da Gratidão (3x)', done: true },
                            { title: 'Caminhada na Natureza', done: false },
                            { title: 'Ritual do Sono', done: true }
                        ].map((goal, i) => (
                             <div key={i} className={`p-4 rounded-2xl border flex items-center gap-3 ${goal.done ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-nature-100'}`}>
                                 <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${goal.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-nature-300'}`}>
                                     {goal.done && <Check size={12} />}
                                 </div>
                                 <span className={`text-xs font-bold ${goal.done ? 'text-emerald-800 line-through opacity-70' : 'text-nature-700'}`}>{goal.title}</span>
                             </div>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-[40px]"></div>
                        <h4 className="font-bold text-nature-900 text-xs uppercase tracking-widest mb-4 relative z-10">Trilhas Ativas</h4>
                        <div className="space-y-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                <p className="text-xs text-nature-600">Jornada do Amor Próprio (Dia 12/21)</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                <p className="text-xs text-nature-600">Desintoxicação Digital (Dia 5/7)</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PortalView>
    );
}


