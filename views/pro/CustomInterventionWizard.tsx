import React, { useState } from 'react';
import { Sparkles, ChevronLeft, Send, Clock, Flame, Wind, Droplets, Mountain, Plus, X } from 'lucide-react';
import { api } from '../../services/api';

export const CustomInterventionWizard: React.FC<{ flow: any }> = ({ flow }) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'ritual' as 'ritual' | 'prescricao',
        element: 'fire' as 'fire' | 'air' | 'water' | 'earth',
        intensity: 5,
        duration: 7,
        instructions: '',
        ingredients: [] as string[]
    });
    const [newIngredient, setNewIngredient] = useState('');

    const elements = [
        { id: 'fire', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Fogo' },
        { id: 'air', icon: Wind, color: 'text-blue-400', bg: 'bg-blue-50', label: 'Ar' },
        { id: 'water', icon: Droplets, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Água' },
        { id: 'earth', icon: Mountain, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Terra' },
    ];

    const handleAddIngredient = () => {
        if (newIngredient.trim()) {
            setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, newIngredient.trim()] }));
            setNewIngredient('');
        }
    };

    const handleRemoveIngredient = (idx: number) => {
        setFormData(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== idx) }));
    };

    const handleFinish = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await api.clinical.saveIntervention(formData);
            setStep(4); // Completion screen
        } catch (err) {
            flow.notify("Erro ao Salvar", "Não foi possível selar a prática no momento.", "error");
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#fcfdfc] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="p-6 flex items-center justify-between border-b border-nature-100 bg-white sticky top-0 z-10">
                <button onClick={() => flow.go('DASHBOARD')} className="p-2 hover:bg-nature-50 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-nature-900" />
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest leading-none mb-1">Mestria Clínica</p>
                    <h2 className="text-lg font-serif italic text-nature-900 leading-none">Nova Intervenção</h2>
                </div>
                <div className="w-10 h-10 bg-nature-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={18} />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 pb-32">
                {/* Progress Dots */}
                <div className="flex gap-2 mb-8 justify-center">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step >= s ? (step === 4 ? 'w-4 bg-emerald-500' : step === s ? 'w-8 bg-nature-900' : 'w-4 bg-nature-400') : 'w-2 bg-nature-200'}`}></div>
                    ))}
                </div>

                {step === 4 && (
                    <div className="flex flex-col items-center justify-center text-center space-y-6 py-12 animate-in zoom-in fade-in duration-700">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                            <Sparkles size={36} className="text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-serif italic text-nature-900">Prática Selada</h2>
                        <p className="text-sm text-nature-500 max-w-[280px] leading-relaxed">
                            "{formData.title}" foi cristalizada na sua biblioteca clínica. Você pode aplicá-la em qualquer alma da sua egrégora.
                        </p>
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full">
                            <Sparkles size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">+25 Karma por aplicação</span>
                        </div>
                        <div className="flex flex-col gap-3 w-full max-w-xs pt-4">
                            <button
                                onClick={() => { setStep(1); setFormData({ title: '', type: 'ritual', element: 'fire', intensity: 5, duration: 7, instructions: '', ingredients: [] }); setIsSaving(false); }}
                                className="w-full py-4 bg-nature-50 text-nature-900 rounded-2xl font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                            >
                                Criar Outra Prática
                            </button>
                            <button
                                onClick={() => flow.go('DASHBOARD')}
                                className="w-full py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
                            >
                                Voltar ao Painel
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 mb-2 block">Nome da Prática</label>
                            <input 
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Meditação da Chama Violeta"
                                className="w-full p-4 bg-white border border-nature-100 rounded-2xl text-nature-900 placeholder:text-nature-300 focus:outline-none focus:ring-2 focus:ring-nature-900/10 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 mb-2 block">Tipo de Intervenção</label>
                            <div className="flex gap-3">
                                {[
                                    { id: 'ritual', label: 'Ritual Espiritual' },
                                    { id: 'prescricao', label: 'Prescrição Clínica' }
                                ].map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => setFormData({ ...formData, type: t.id as any })}
                                        className={`flex-1 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${formData.type === t.id ? 'bg-nature-900 text-white border-nature-900 shadow-lg' : 'bg-white text-nature-400 border-nature-100'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 mb-2 block">Elemento Primário</label>
                            <div className="grid grid-cols-4 gap-3">
                                {elements.map(el => (
                                    <button 
                                        key={el.id}
                                        onClick={() => setFormData({ ...formData, element: el.id as any })}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${formData.element === el.id ? 'border-nature-900 bg-nature-50 shadow-sm scale-105' : 'border-nature-100 bg-white'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${el.bg} ${el.color}`}>
                                            <el.icon size={20} />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-tighter text-nature-600">{el.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400">Intensidade Energética</label>
                                <span className="text-xs font-bold text-nature-900">{formData.intensity}/10</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value={formData.intensity}
                                onChange={(e) => setFormData({ ...formData, intensity: parseInt(e.target.value) })}
                                className="w-full accent-nature-900"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400">Duração Ciclo (Dias)</label>
                                <span className="text-xs font-bold text-nature-900">{formData.duration} dias</span>
                            </div>
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-nature-100 shadow-sm">
                                <Clock size={20} className="text-nature-400" />
                                <input 
                                    type="number" 
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                    className="flex-1 bg-transparent focus:outline-none text-nature-900 font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 mb-2 block">Ingredientes / Objetos de Poder</label>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={newIngredient}
                                        onChange={(e) => setNewIngredient(e.target.value)}
                                        placeholder="Adicionar ingrediente..."
                                        className="flex-1 p-4 bg-white border border-nature-100 rounded-2xl text-nature-900 placeholder:text-nature-300 focus:outline-none shadow-sm"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                                    />
                                    <button 
                                        onClick={handleAddIngredient}
                                        className="w-14 h-14 bg-nature-900 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.ingredients.map((ing, i) => (
                                        <div key={i} className="px-3 py-1.5 bg-nature-50 border border-nature-100 rounded-full flex items-center gap-2 group animate-in zoom-in duration-300">
                                            <span className="text-[10px] font-bold text-nature-600">{ing}</span>
                                            <button onClick={() => handleRemoveIngredient(i)} className="text-nature-300 hover:text-rose-500 transition-colors">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 mb-2 block">Instruções de Passagem</label>
                            <textarea 
                                rows={8}
                                value={formData.instructions}
                                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                placeholder="Descreva o passo a passo da intervenção..."
                                className="w-full p-4 bg-white border border-nature-100 rounded-[2rem] text-nature-900 placeholder:text-nature-300 focus:outline-none focus:ring-2 focus:ring-nature-900/10 shadow-sm resize-none"
                            ></textarea>
                        </div>

                        <div className="p-6 bg-nature-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                             <h4 className="font-serif italic text-lg mb-2">Selar Prática</h4>
                             <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mb-4">Ao selar, esta prática poderá ser enviada para qualquer alma da sua egrégora.</p>
                             <div className="flex items-center gap-2 text-primary-200">
                                 <Sparkles size={14} />
                                 <span className="text-[9px] font-bold uppercase">Garante +25 Karma por aplicação</span>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            {step <= 3 && (
            <div className="p-6 bg-white border-t border-nature-100 z-20 fixed bottom-0 left-0 right-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                <div className="flex gap-4">
                    {step > 1 && (
                        <button 
                            onClick={() => setStep(step - 1)}
                            className="flex-1 py-4 bg-nature-50 text-nature-900 rounded-2xl font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all outline-none"
                        >
                            Voltar
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            if (step < 3) setStep(step + 1);
                            else handleFinish();
                        }}
                        disabled={isSaving || (step === 1 && !formData.title.trim())}
                        className="flex-[2] py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-nature-900/20 active:scale-95 transition-all outline-none flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {step === 3 ? (
                            isSaving ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Selando...</>
                            ) : (
                                <><Send size={14} /> Selar Prática</>
                            )
                        ) : 'Continuar'}
                    </button>
                </div>
            </div>
            )}
        </div>
    );
};
