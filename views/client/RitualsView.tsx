import React, { useState, useEffect } from 'react';
import { PortalView, ZenToast } from '../../components/Common';
import { MicroInteraction } from '../../components/MicroInteraction';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { api } from '../../services/api';
import { Sun, Moon, CheckCircle2, Circle, Sparkles } from 'lucide-react';

interface RoutineStep {
    id: string;
    title: string;
    duration: number;
    icon: string;
    completed?: boolean;
}

export const RitualsView: React.FC = () => {
    const { go } = useBuscadorFlow();
    const [morningRoutine, setMorningRoutine] = useState<RoutineStep[]>([]);
    const [nightRoutine, setNightRoutine] = useState<RoutineStep[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);
    const [microInteraction, setMicroInteraction] = useState<{ title: string, message: string } | null>(null);

    useEffect(() => {
        loadRoutines();
    }, []);

    const loadRoutines = async () => {
        try {
            const morning = await api.rituals.get('morning');
            const night = await api.rituals.get('night');
            setMorningRoutine(morning);
            setNightRoutine(night);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (period: 'morning' | 'night', id: string) => {
        const updater = period === 'morning' ? setMorningRoutine : setNightRoutine;
        const current = period === 'morning' ? morningRoutine : nightRoutine;
        
        // Optimistic update
        const updatedList = current.map(step => {
             if (step.id === id) {
                 const newState = !step.completed;
                 if (newState) {
                     setMicroInteraction({ 
                        title: "Hábito Cristalizado", 
                        message: `Sua essência brilha com a conclusão de: ${step.title}. +10 XP` 
                     });
                 }
                 return { ...step, completed: newState };
             }
             return step;
         });
        updater(updatedList);

        // API Call
        try {
            await api.rituals.toggle(period, id);
        } catch (e) {
            console.error("Failed to save ritual state", e);
            // Revert on failure could be implemented here
        }
    };

    const calculateProgress = () => {
        const all = [...morningRoutine, ...nightRoutine];
        if (all.length === 0) return 0;
        const completed = all.filter(s => s.completed).length;
        return Math.round((completed / all.length) * 100);
    };

    const renderRoutineSection = (title: string, icon: any, period: 'morning' | 'night', steps: RoutineStep[]) => {
        const completedCount = steps.filter(s => s.completed).length;
        const totalCount = steps.length;
        const isAllDone = totalCount > 0 && completedCount === totalCount;

        return (
            <div className={`bg-white p-6 rounded-[2.5rem] border transition-all duration-500 shadow-sm space-y-4 ${isAllDone ? 'border-emerald-200 shadow-emerald-100' : 'border-nature-100'}`}>
                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${period === 'morning' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                             {icon}
                         </div>
                         <div>
                             <h3 className="font-serif italic text-lg text-nature-900 leading-none mb-1">{title}</h3>
                             <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">{completedCount}/{totalCount} Concluídos</p>
                         </div>
                     </div>
                     {isAllDone && (
                         <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-in zoom-in duration-300">
                             <CheckCircle2 size={16} />
                         </div>
                     )}
                 </div>
                 
                 <div className="space-y-3">
                     {steps.map(step => (
                         <div 
                            key={step.id} 
                            onClick={() => handleToggle(period, step.id)}
                            className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98] ${step.completed ? 'bg-nature-900 border-nature-900 text-white shadow-lg shadow-nature-900/20' : 'bg-nature-50 border-white hover:border-nature-200'}`}
                         >
                             <div className="flex items-center gap-4">
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${step.completed ? 'bg-white/20 border-transparent' : 'bg-white border-nature-200'}`}>
                                     {step.completed && <CheckCircle2 size={12} className="text-white" />}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                     <h4 className={`font-bold text-sm truncate ${step.completed ? 'text-white' : 'text-nature-700'}`}>{step.title}</h4>
                                     <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[9px] uppercase tracking-widest font-bold ${step.completed ? 'text-white/60' : 'text-nature-400'}`}>{step.duration} min</span>
                                     </div>
                                 </div>
                             </div>
                             {step.completed && <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-md text-white">+10 XP</span>}
                         </div>
                     ))}
                     {steps.length === 0 && <p className="text-center text-xs text-nature-300 italic py-4">Nenhum ritual definido.</p>}
                 </div>
            </div>
        );
    };

    const progress = calculateProgress();

    return (
        <PortalView 
            title="Meus Rituais" 
            subtitle="HÁBITOS DE PODER" 
            onBack={() => go('DASHBOARD')}
            heroImage="https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=800"
        >
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            {microInteraction && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center pointer-events-none">
                    <MicroInteraction 
                        title={microInteraction.title} 
                        message={microInteraction.message} 
                        onClose={() => setMicroInteraction(null)} 
                    />
                </div>
            )}
            
            <div className="space-y-6 pb-20 px-1">
                {/* Progress Header */}
                <div className="bg-nature-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-nature-900/20">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                     
                     <div className="relative z-10 flex flex-col items-center text-center">
                         <div className="w-20 h-20 relative mb-4 flex items-center justify-center">
                             <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                 <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                 <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                             </svg>
                             <span className="absolute text-xl font-black">{progress}%</span>
                         </div>
                         <h2 className="font-serif italic text-2xl mb-1">Ritmo Diário</h2>
                         <p className="text-xs text-white/60 max-w-[200px]">A constância é a chave para a transformação verdadeira.</p>
                     </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        <div className="h-40 bg-gray-100 rounded-[2.5rem] animate-pulse" />
                        <div className="h-40 bg-gray-100 rounded-[2.5rem] animate-pulse" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {renderRoutineSection('Despertar Solar', <Sun size={24} />, 'morning', morningRoutine)}
                        {renderRoutineSection('Recolhimento Lunar', <Moon size={24} />, 'night', nightRoutine)}
                    </div>
                )}
            </div>
        </PortalView>
    );
};
