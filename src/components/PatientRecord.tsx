import React, { useState } from 'react';
import { User, PlantStage, PlantState } from '../types';
import { DynamicAvatar, Card } from './Common';
import { FileText, Lock, Globe, Share2, Activity, Zap, Cloud, Sparkles, RefreshCw } from 'lucide-react';

interface PatientRecordProps {
    patient: Partial<User> & { plantState?: PlantState };
    notes: string;
    onSaveNotes: (notes: string) => void;
    isSaving: boolean;
    lastSaved: Date | null;
}

export const PatientRecord: React.FC<PatientRecordProps> = ({ patient, notes, onSaveNotes, isSaving, lastSaved }) => {
    const [layer, setLayer] = useState<'public' | 'shared' | 'private'>('shared');

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Layer Switcher */}
            <div className="flex p-1 bg-nature-100 rounded-2xl mx-auto w-fit">
                {[
                    { id: 'public', label: 'Identidade', icon: Globe },
                    { id: 'shared', label: 'Ecosssistema', icon: Share2 },
                    { id: 'private', label: 'Notas', icon: Lock },
                ].map(l => (
                    <button 
                        key={l.id}
                        onClick={() => setLayer(l.id as any)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                            layer === l.id ? 'bg-white shadow-sm text-nature-900' : 'text-nature-400 hover:text-nature-600'
                        }`}
                    >
                        <l.icon size={14} />
                        {l.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {/* PUBLIC LAYER */}
                {layer === 'public' && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <DynamicAvatar user={patient} size="xl" className="border-4 border-white shadow-2xl" />
                            <div className="text-center">
                                <h3 className="text-2xl font-serif font-medium text-nature-900">{patient.name}</h3>
                                <p className="text-xs text-nature-400 font-medium mt-1">{patient.email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4 text-center">
                                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Desde</p>
                                <p className="text-lg font-serif text-nature-900">Jan 2024</p>
                            </Card>
                            <Card className="p-4 text-center">
                                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Sessões</p>
                                <p className="text-lg font-serif text-nature-900">5</p>
                            </Card>
                        </div>
                    </div>
                )}

                {/* SHARED LAYER */}
                {layer === 'shared' && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <Card className="p-8 bg-gradient-to-br from-primary-50 to-white border-primary-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-white rounded-xl text-primary-600 shadow-sm"><Activity size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-nature-900">Estado Atual</h4>
                                    <p className="text-[10px] text-nature-400 uppercase tracking-widest">Sincronizado do Jardim da Alma</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/60 p-4 rounded-2xl border border-white/50">
                                    <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Planta</p>
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={16} className={patient.plantState === 'THIRSTY' ? 'text-amber-500' : 'text-emerald-500'} />
                                        <span className="text-sm font-bold text-nature-900 capitalize">{patient.plantStage || 'Semente'}</span>
                                    </div>
                                    {patient.plantState === 'THIRSTY' && <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block">Precisa de Luz</span>}
                                </div>
                                
                                <div className="bg-white/60 p-4 rounded-2xl border border-white/50">
                                    <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Último Humor</p>
                                    <div className="flex items-center gap-2">
                                        <Zap size={16} className="text-indigo-500" />
                                        <span className="text-sm font-bold text-nature-900 capitalize">{patient.lastMood || 'Desconhecido'}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="bg-nature-50 p-6 rounded-[2rem] border border-nature-100 italic text-nature-500 text-sm text-center">
                            "A jornada é contínua, e cada passo ressoa no todo."
                        </div>
                    </div>
                )}

                {/* PRIVATE LAYER */}
                {layer === 'private' && (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300 h-full">
                        <div className="flex justify-between items-center px-2">
                            <h4 className="font-bold text-nature-900 text-xs uppercase flex items-center gap-2 tracking-wider"><FileText size={14} className="text-nature-400"/> Anotações Privadas</h4>
                            <div className="flex items-center gap-2 bg-nature-50 px-3 py-1.5 rounded-full border border-nature-100">
                                {isSaving ? <RefreshCw size={12} className="animate-spin text-primary-500" /> : <Cloud size={12} className="text-emerald-500" />}
                                <span className="text-[8px] font-bold text-nature-400 uppercase">{isSaving ? 'Sincronizando...' : lastSaved ? `Salvo às ${lastSaved.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : 'Pronto'}</span>
                            </div>
                        </div>
                        <textarea 
                            value={notes} 
                            onChange={e => onSaveNotes(e.target.value)}
                            placeholder="Registre suas percepções, intuições e recomendações..."
                            className="w-full h-80 bg-white p-8 rounded-[2rem] text-sm/relaxed text-nature-700 italic border border-nature-100 focus:border-primary-200 focus:ring-4 focus:ring-primary-500/5 outline-none resize-none transition-all placeholder:text-nature-300 shadow-sm"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
