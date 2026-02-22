import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Sun, Moon, CheckCircle, GripVertical, Droplets, Book, BatteryCharging, Coffee, Music, Wind, Loader2 } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';

const ICONS: Record<string, any> = { Droplets, Book, BatteryCharging, Coffee, Music, Wind, Sun, Moon };

export const RitualBuilderView: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
    const [period, setPeriod] = useState<'morning' | 'night'>('morning');
    const [steps, setSteps] = useState<any[]>([]);
    const [newStep, setNewStep] = useState('');
    const [loadingSteps, setLoadingSteps] = useState(true);

    useEffect(() => {
        setLoadingSteps(true);
        api.rituals.get(period).then(setSteps).finally(() => setLoadingSteps(false));
    }, [period]);

    const handleAdd = () => {
        if (!newStep) return;
        const newItm = { id: Date.now().toString(), title: newStep, duration: 10, icon: 'Sun' };
        const updated = [...steps, newItm];
        setSteps(updated);
        api.rituals.save(period, updated);
        setNewStep('');
    };

    const handleRemove = (id: string) => {
        const updated = steps.filter(s => s.id !== id);
        setSteps(updated);
        api.rituals.save(period, updated);
    };

    return (
        <PortalView title="Construtor de Rituais" subtitle="DESIGN DE HÁBITOS" onBack={() => setView(ViewState.CLIENT_HOME)}>
            <div className="space-y-6">
                <div className="bg-nature-50 p-1 rounded-2xl flex relative">
                    <div className={`absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ${period === 'night' ? 'translate-x-[calc(100%+8px)]' : ''}`}></div>
                    <button onClick={() => setPeriod('morning')} className="flex-1 relative z-10 py-3 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-nature-900 transition-colors">
                        <Sun size={14} className={period === 'morning' ? 'text-amber-500' : 'text-nature-400'}/> Manhã
                    </button>
                    <button onClick={() => setPeriod('night')} className="flex-1 relative z-10 py-3 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-nature-900 transition-colors">
                        <Moon size={14} className={period === 'night' ? 'text-indigo-500' : 'text-nature-400'}/> Noite
                    </button>
                </div>

                <div className="space-y-3">
                    {loadingSteps ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-nature-400">
                            <Loader2 size={24} className="animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Carregando rituais...</span>
                        </div>
                    ) : steps.map((step, idx) => {
                        const Icon = ICONS[step.icon] || Sun;
                        return (
                            <div key={step.id} className="bg-white p-4 rounded-2xl border border-nature-100 flex items-center gap-4 animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="text-nature-300 cursor-grab active:cursor-grabbing"><GripVertical size={16}/></div>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${period === 'morning' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                    <Icon size={20}/>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-nature-900 text-sm">{step.title}</h4>
                                    <p className="text-[10px] text-nature-400 uppercase font-bold">{step.duration} min</p>
                                </div>
                                <button aria-label="Remover passo" onClick={() => handleRemove(step.id)} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white p-2 rounded-2xl border border-nature-200 shadow-sm flex gap-2">
                    <input 
                        value={newStep}
                        onChange={e => setNewStep(e.target.value)}
                        placeholder="Novo hábito (ex: Yoga)"
                        className="flex-1 px-4 py-3 bg-transparent outline-none text-sm font-medium placeholder:text-nature-300"
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd} className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform active:scale-90 ${period === 'morning' ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                        <Plus size={24}/>
                    </button>
                </div>

                <div className="p-6 text-center space-y-2">
                    <p className="text-xs text-nature-500 italic">"Pequenos rituais constroem grandes transformações."</p>
                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-emerald-500"><CheckCircle size={12}/> Salvo Automaticamente</div>
                </div>
            </div>
        </PortalView>
    );
};
