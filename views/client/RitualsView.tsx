import React, { useState, useEffect } from 'react';
import { PortalView, ZenToast } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { api } from '../../services/api';
import { Sun, Moon, CheckCircle2, Circle } from 'lucide-react';

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

    const toggleStep = (period: 'morning' | 'night', id: string) => {
        // In a real app, we'd save this state to the backend
        const updater = period === 'morning' ? setMorningRoutine : setNightRoutine;
        const current = period === 'morning' ? morningRoutine : nightRoutine;
        
        updater(current.map(step => {
            if (step.id === id) {
                const newState = !step.completed;
                if (newState) setToast({ title: "Hábito Cristalizado", message: `+10 XP. ${step.title} concluído.` });
                return { ...step, completed: newState };
            }
            return step;
        }));
    };

    const renderRoutineSection = (title: string, icon: any, period: 'morning' | 'night', steps: RoutineStep[]) => (
        <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-4">
             <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${period === 'morning' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                     {icon}
                 </div>
                 <h3 className="font-serif italic text-lg text-nature-900">{title}</h3>
             </div>
             
             <div className="space-y-3">
                 {steps.map(step => (
                     <div 
                        key={step.id} 
                        onClick={() => toggleStep(period, step.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${step.completed ? 'bg-nature-900 border-nature-900 text-white' : 'bg-nature-50 border-nature-100 hover:border-nature-300'}`}
                     >
                         <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-full ${step.completed ? 'bg-white/20' : 'bg-white'}`}>
                                 {step.completed ? <CheckCircle2 size={16} /> : <Circle size={16} className="text-nature-300" />}
                             </div>
                             <div>
                                 <h4 className="font-bold text-sm">{step.title}</h4>
                                 <p className={`text-[10px] uppercase tracking-widest font-bold ${step.completed ? 'text-white/50' : 'text-nature-400'}`}>{step.duration} min</p>
                             </div>
                         </div>
                     </div>
                 ))}
                 {steps.length === 0 && <p className="text-center text-xs text-nature-300 italic py-4">Nenhum ritual definido.</p>}
             </div>
        </div>
    );

    return (
        <PortalView 
            title="Meus Rituais" 
            subtitle="HÁBITOS DE PODER" 
            onBack={() => go('DASHBOARD')}
            heroImage="https://images.unsplash.com/photo-1531608139434-1912ae07b3da?q=80&w=800"
        >
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            <div className="space-y-6">
                {isLoading ? (
                    <div className="space-y-4">
                        <div className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
                        <div className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
                    </div>
                ) : (
                    <>
                        {renderRoutineSection('Despertar Solar', <Sun size={20} />, 'morning', morningRoutine)}
                        {renderRoutineSection('Recolhimento Lunar', <Moon size={20} />, 'night', nightRoutine)}
                    </>
                )}
            </div>
        </PortalView>
    );
};
