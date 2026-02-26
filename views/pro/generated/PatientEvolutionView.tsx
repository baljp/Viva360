import React, { useState, useEffect } from 'react';
import { useGuardiaoFlow } from '../../../src/flow/useGuardiaoFlow';
import { PortalView } from '../../../components/Common';
import {
    Activity, Clock, Brain, Sprout, Plus, Sparkles, Leaf, TrendingUp
} from 'lucide-react';
import { api } from '../../../services/api';

type PatientEvolutionRecord = {
    id: string | number;
    type: string;
    title: string;
    date: string;
    mood: string;
    content: string;
};

type RecordDraft = {
    title: string;
    mood: string;
    content: string;
    date: string;
    type: 'session' | 'anamnesis';
};

type RawRecord = {
    id?: string | number;
    type?: string | null;
    created_at?: string | null;
    date?: string | null;
    content?: string | null;
};

const normalizeRecords = (data: unknown): PatientEvolutionRecord[] => {
    const list = Array.isArray(data) ? (data as RawRecord[]) : [];
    return list
        .map((item) => ({
            id: item.id ?? `record_${Date.now()}`,
            type: item.type || 'session',
            title: item.type === 'anamnesis' ? 'Anamnese Clínica' : 'Sessão Terapêutica',
            date: item.created_at || item.date || new Date().toISOString(),
            mood: 'Registrado',
            content: item.content || '',
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const TimelineCard: React.FC<{ event: PatientEvolutionRecord }> = ({ event }) => (
    <div className="flex gap-4 group animate-in slide-in-from-bottom-2">
        <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${event.type === 'crisis' ? 'bg-rose-500' : (event.type === 'milestone' ? 'bg-amber-400' : 'bg-emerald-500')}`}></div>
            <div className="w-0.5 flex-1 bg-nature-100 group-last:bg-transparent"></div>
        </div>
        <div className="pb-8 flex-1">
            <div className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm relative group-hover:border-nature-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${event.type === 'crisis' ? 'bg-rose-50 text-rose-600' : 'bg-nature-50 text-nature-500'}`}>{event.type}</span>
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



const RecordModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (data: RecordDraft) => void }> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [mood, setMood] = useState('Vibrante');
    const [content, setContent] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh] flex flex-col">
                <div className="bg-nature-900 p-8 text-white">
                    <h3 className="text-2xl font-serif italic">Novo Registro Evolutivo</h3>
                    <p className="text-[10px] text-nature-300 font-bold uppercase mt-1">Sintonizando Jornada</p>
                </div>
                <div className="p-8 space-y-6 overflow-y-auto">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-nature-400 px-2 tracking-widest">Título da Sessão</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Sessão de Alinhamento" className="w-full p-4 bg-nature-50 rounded-2xl border-none text-sm font-bold text-nature-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-nature-400 px-2 tracking-widest">Frequência/Humor</label>
                        <select value={mood} onChange={e => setMood(e.target.value)} className="w-full p-4 bg-nature-50 rounded-2xl border-none text-sm font-bold text-nature-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                            <option>Vibrante</option>
                            <option>Sereno</option>
                            <option>Meditativo</option>
                            <option>Ansioso</option>
                            <option>Melancólico</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-nature-400 px-2 tracking-widest">Insights & Evolução</label>
                        <textarea rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="O que o espírito revelou hoje?" className="w-full p-4 bg-nature-50 rounded-2xl border-none text-sm font-bold text-nature-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 py-4 bg-nature-100 text-nature-600 rounded-2xl font-bold uppercase tracking-widest text-xs">Cancelar</button>
                        <button
                            disabled={!title}
                            onClick={() => onSave({ title, mood, content, date: new Date().toISOString(), type: 'session' })}
                            className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg disabled:opacity-50"
                        >
                            Gravar Evolução
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Check = ({ size = 16 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;

const InterventionCard: React.FC<{ title: string, outcome: string, type: string }> = ({ title, outcome, type }) => (
    <div className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm mb-3">
        <div className="flex gap-4 items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${type === 'pratica' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {type === 'pratica' ? <Sparkles size={20} /> : <Leaf size={20} />}
            </div>
            <div>
                <h4 className="font-bold text-nature-900 text-sm">{title}</h4>
                <p className="text-[10px] text-nature-500 mt-1 italic leading-relaxed">"{outcome}"</p>
            </div>
        </div>
    </div>
);

export default function PatientEvolutionView() {
    const { go, notify, state } = useGuardiaoFlow();
    const [activeTab, setActiveTab] = useState<'timeline' | 'patterns' | 'interventions' | 'plan'>('timeline');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (state.currentState === 'PATIENT_PLAN') {
            setActiveTab('plan');
        }
    }, [state.currentState]);

    const [records, setRecords] = useState<PatientEvolutionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [interventions, setInterventions] = useState<Array<{id: string|number; title: string; outcome: string; type: string; date?: string}>>([]);
    const [interventionsLoading, setInterventionsLoading] = useState(true);
    const [planGoals, setPlanGoals] = useState<Array<{title: string; done: boolean}>>([]);

    const PATIENT_ID = String(state.selectedPatient?.id || '').trim();

    // Load interventions from clinical API
    useEffect(() => {
        let cancelled = false;
        setInterventionsLoading(true);
        api.clinical.listInterventions()
            .then((data: any) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : [];
                // Filter by patient if possible
                const patientInterventions = PATIENT_ID
                    ? list.filter((i: any) => !i.patient_id || String(i.patient_id) === PATIENT_ID)
                    : list;
                setInterventions(patientInterventions.map((i: any) => ({
                    id: i.id || Date.now(),
                    title: i.title || i.name || 'Intervenção',
                    outcome: i.outcome || i.result || i.notes || '',
                    type: i.type || 'pratica',
                    date: i.created_at || i.date || '',
                })));
                // Derive plan goals from records content
                if (!cancelled) {
                    const goals = (records || []).slice(0, 3).map((r, i) => ({
                        title: r.title || `Meta ${i + 1}`,
                        done: r.mood !== 'Pendente',
                    }));
                    setPlanGoals(goals);
                }
            })
            .catch(() => { if (!cancelled) setInterventions([]); })
            .finally(() => { if (!cancelled) setInterventionsLoading(false); });
        return () => { cancelled = true; };
    }, [PATIENT_ID, records.length]);

    const fetchRecords = async () => {
        setLoading(true);
        if (!PATIENT_ID) {
            setRecords([]);
            setLoading(false);
            return;
        }
        try {
            const data = await api.records.list(PATIENT_ID);
            setRecords(normalizeRecords(data));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        if (!PATIENT_ID) {
            setRecords([]);
            setLoading(false);
            return;
        }
        api.records.list(PATIENT_ID)
            .then((data) => {
                if (cancelled) return;
                setRecords(normalizeRecords(data));
            })
            .catch(() => { if (!cancelled) setRecords([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [PATIENT_ID]);

    const handleAddEvent = async (data: RecordDraft) => {
        if (!PATIENT_ID) {
            notify('Paciente não selecionado', 'Selecione um paciente antes de gravar evolução.', 'warning');
            return;
        }

        const recordPayload = {
            patientId: PATIENT_ID,
            type: data.type === 'anamnesis' ? 'anamnesis' : 'session',
            content: `${data.title}\nHumor: ${data.mood}\n\n${data.content}`.trim(),
        };
        const created = await api.records.create(recordPayload);
        const newEvent = {
            id: created?.id || Date.now(),
            type: created?.type || recordPayload.type,
            title: data.title,
            date: created?.created_at || data.date || new Date().toISOString(),
            mood: data.mood || 'Registrado',
            content: created?.content || recordPayload.content,
        };
        setRecords(prev => [newEvent, ...prev]);
        setIsModalOpen(false);
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
                    <button onClick={() => setIsModalOpen(true)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <Plus size={16} /> Adicionar Sessão
                    </button>
                ) : undefined
            }
        >
            <RecordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddEvent} />
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
                    {!loading && records.length === 0 && (
                        <p className="text-center text-xs text-nature-400">Nenhum registro evolutivo encontrado para este paciente.</p>
                    )}
                </div>
            )}

            {/* Keeping other tabs static for now as they are complex views */}
            {/* ... patterns, interventions, plan logic ... */}


            {activeTab === 'patterns' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-nature-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
                        <h4 className="font-serif italic text-xl mb-4">Constância Vibracional</h4>
                        {(() => {
                            // Derive chart from last 7 records mood scores
                            const moodScore = (m: string) => {
                                const s = m.toLowerCase();
                                if (s.includes('vibrante') || s.includes('ótimo')) return 95;
                                if (s.includes('bem') || s.includes('positivo')) return 75;
                                if (s.includes('registrado') || s.includes('neutro')) return 55;
                                if (s.includes('fraco') || s.includes('difícil')) return 35;
                                return 50;
                            };
                            const pts = records.length > 0
                                ? records.slice(0, 7).reverse().map(r => moodScore(r.mood))
                                : [40, 60, 55, 78, 85, 82, 90];
                            const maxPt = Math.max(...pts, 1);
                            const trend = pts.length > 1 && pts[pts.length-1] >= pts[0] ? 'Alta' : 'Estável';
                            return (<>
                                <div className="flex items-end gap-2 h-32 px-4 pb-4 bg-white/5 rounded-2xl border border-white/10">
                                    {pts.map((h, i) => (
                                        <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/50 to-emerald-400 rounded-t-lg relative" style={{ height: `${(h/maxPt)*100}%` }}></div>
                                    ))}
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mt-4 text-center">Tendência de {trend} Estabilidade</p>
                            </>);
                        })()}
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                        <h5 className="font-bold text-nature-900 text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Brain size={16} className="text-nature-400" /> Padrões Recorrentes (IA)</h5>
                        <div className="flex flex-wrap gap-2">
                            {records.length > 0 ? (() => {
                                const moodCounts: Record<string, number> = {};
                                records.forEach(r => { const k = r.mood || 'Neutro'; moodCounts[k] = (moodCounts[k] || 0) + 1; });
                                const colors = ['bg-rose-50 text-rose-600 border-rose-100','bg-indigo-50 text-indigo-600 border-indigo-100','bg-emerald-50 text-emerald-600 border-emerald-100','bg-amber-50 text-amber-600 border-amber-100'];
                                return Object.entries(moodCounts).slice(0,4).map(([mood, count], i) => (
                                    <span key={mood} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border ${colors[i % colors.length]}`}>
                                        {mood} · {count}x
                                    </span>
                                ));
                            })() : (
                                <p className="text-xs text-nature-400 italic">Padrões disponíveis após registros evolutivos.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'interventions' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-2">
                    {interventionsLoading ? (
                        <p className="text-center text-xs text-nature-400 animate-pulse py-8">Carregando intervenções...</p>
                    ) : interventions.length > 0 ? (
                        interventions.map(iv => (
                            <InterventionCard key={String(iv.id)} type={iv.type} title={iv.title} outcome={iv.outcome} />
                        ))
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border border-dashed border-nature-200 p-8 text-center space-y-3">
                            <Sprout size={28} className="mx-auto text-nature-300" />
                            <p className="text-xs text-nature-400 italic">Nenhuma intervenção registrada ainda.</p>
                            <p className="text-[10px] text-nature-300">Registre intervenções pelo prontuário para vê-las aqui.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'plan' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-[2.5rem] border border-emerald-100 text-center">
                        <Sprout size={32} className="mx-auto text-emerald-600 mb-3" />
                        <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Intenção Central</p>
                        <h3 className="text-xl font-serif italic text-nature-900">
                            {state.selectedPatient?.name
                                ? `Jornada de ${state.selectedPatient.name.split(' ')[0]}`
                                : 'Plano Terapêutico Ativo'}
                        </h3>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Micro-Metas da Semana</h4>
                            <button onClick={() => setActiveTab('patterns')} className="p-1 bg-nature-50 rounded text-nature-400"><TrendingUp size={14} /></button>
                        </div>
                        {(planGoals.length > 0 ? planGoals : [
                            { title: 'Aguardando próxima sessão', done: false }
                        ]).map((goal, i) => (
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
                            {records.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                        <p className="text-xs text-nature-600">{records.length} sessão{records.length !== 1 ? 'ões' : ''} registrada{records.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    {interventions.length > 0 && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            <p className="text-xs text-nature-600">{interventions.length} intervenção{interventions.length !== 1 ? 'ões' : ''} aplicada{interventions.length !== 1 ? 's' : ''}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-nature-400 italic">Trilhas ativas aparecerão após as primeiras sessões.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </PortalView>
    );
}
