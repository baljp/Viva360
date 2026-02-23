import React, { useState } from 'react';
import { PortalView } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/useGuardiaoFlow';
import { Plus, Sparkles, Clock, Star } from 'lucide-react';
import { api } from '../../services/api';

export const AlquimiaCreateOffer: React.FC = () => {
    const { go, back, notify } = useGuardiaoFlow();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        credits: 1,
        specialty: '',
        type: 'service' as 'service' | 'physical' | 'digital'
    });

    const handleSubmit = async () => {
        if (!formData.title) {
            notify("Campo Obrigatório", "Por favor, dê um título à sua oferta.", "warning");
            return;
        }
        if (!formData.specialty) {
            notify("Categoria Necessária", "Selecione uma categoria para sua oferta.", "warning");
            return;
        }
        try {
            await api.marketplace.create({
                name: formData.title,
                description: formData.description,
                price: formData.credits,
                category: formData.specialty || 'outros',
                type: formData.type,
                ownerId: 'current_user',
                image: formData.type === 'physical' 
                    ? 'https://images.unsplash.com/photo-1512418490979-92798cec1380?q=80&w=800' 
                    : (formData.type === 'digital' 
                        ? 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800'
                        : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800')
            });
            notify("Alquimia Selada", "Sua oferta já brilha no portal.", "success");
            go('ESCAMBO_MARKET');
        } catch (e) {
            console.error(e);
            notify("Erro na Criação", "Não foi possível manifestar essa oferta no momento.", "warning");
        }
    };

    return (
        <PortalView 
            title="Semeando Alquimia" 
            subtitle="CRIAÇÃO & MANIFESTAÇÃO" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800"
        >
            <div className="space-y-8 px-2 pb-10">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-[2rem] border border-indigo-200 text-center space-y-2">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-indigo-500 shadow-md mb-4"><Sparkles size={32}/></div>
                   <h3 className="font-serif italic text-xl text-indigo-900">O que você manifesta?</h3>
                   <p className="text-xs text-indigo-700 max-w-xs mx-auto">Sua energia materializada em produtos ou rituais fortalece a egrégora.</p>
                </div>

                <div className="space-y-5">
                    {/* TYPE SELECTION */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Tipo de Oferta</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'service', label: 'Ritual/Ses.' },
                                { id: 'physical', label: 'Prod. Físico' },
                                { id: 'digital', label: 'Prod. Digi.' }
                            ].map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => setFormData({...formData, type: t.id as any})}
                                    className={`py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all ${formData.type === t.id ? 'bg-indigo-900 text-white border-indigo-900 shadow-md' : 'bg-white text-nature-400 border-nature-100 shadow-sm'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Título da Oferenda</label>
                        <input 
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            placeholder="Ex: Óleo Ancestral de Lavanda"
                            className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-serif text-lg text-nature-900 placeholder:text-nature-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Categoria</label>
                        <select 
                            value={formData.specialty}
                            onChange={e => setFormData({...formData, specialty: e.target.value})}
                            className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 outline-none transition-all text-sm text-nature-700 appearance-none shadow-sm"
                        >
                            <option value="">Selecione...</option>
                            <option value="alquimia">Alquimia & Óleos</option>
                            <option value="terapias">Terapias Holísticas</option>
                            <option value="mentoria">Mentoria</option>
                            <option value="artes">Cristais & Amuletos</option>
                            <option value="conhecimento">E-books & Cursos</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Energia (R$ / Créditos)</label>
                            <div className="flex items-center gap-3 bg-white p-5 border border-nature-100 rounded-2xl shadow-sm">
                                <Plus size={20} className="text-indigo-400" />
                                <input 
                                    type="number"
                                    value={formData.credits}
                                    onChange={e => setFormData({...formData, credits: Number(e.target.value)})}
                                    className="w-full bg-transparent outline-none font-bold text-nature-900" 
                                    min={1}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">{formData.type === 'service' ? 'Duração' : 'Estoque'}</label>
                            <div className="flex items-center gap-3 bg-white p-5 border border-nature-100 rounded-2xl shadow-sm">
                                <Clock size={20} className="text-nature-300" />
                                <input 
                                    type="text"
                                    placeholder={formData.type === 'service' ? '60 min' : '10 unid.'}
                                    className="w-full bg-transparent outline-none font-bold text-nature-900 placeholder:text-nature-200"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Essência da Oferenda</label>
                        <textarea 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="Descreva a vibração e os benefícios..."
                            className="w-full p-5 bg-white border border-nature-100 rounded-3xl h-32 resize-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm leading-relaxed text-nature-600 shadow-sm"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl active:scale-95 transition-all hover:bg-black flex items-center justify-center gap-3"
                >
                    <Plus size={20} /> Manifestar Agora
                </button>
            </div>
        </PortalView>
    );
};
