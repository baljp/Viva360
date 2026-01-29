import React, { useState } from 'react';
import { PortalView } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';
import { Plus, Sparkles, Clock, Star } from 'lucide-react';
import { api } from '../../services/api';

export const AlquimiaCreateOffer: React.FC = () => {
    const { go, back } = useGuardiaoFlow();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        credits: 1,
        specialty: ''
    });

    const handleSubmit = async () => {
        try {
            await api.marketplace.create({
                name: formData.title,
                description: formData.description,
                price: formData.credits,
                category: formData.specialty || 'outros',
                type: 'service', // Default to service/ritual
                ownerId: 'current_user', // This will be handled by backend or api wrapper usually, but for mock:
                image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' // Default image for now
            });
            // Show success via the flow context if possible, or navigate back and show toast there
            go('ESCAMBO_MARKET');
        } catch (e) {
            console.error(e);
            alert('Erro ao criar oferta.');
        }
    };

    return (
        <PortalView 
            title="Criar Oferta" 
            subtitle="ESCAMBO DE LUZ" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800"
        >
            <div className="space-y-8 px-2">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-[2rem] border border-indigo-200 text-center space-y-2">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-indigo-500 shadow-md mb-4"><Sparkles size={32}/></div>
                   <h3 className="font-serif italic text-xl text-indigo-900">O que você oferece ao mundo?</h3>
                   <p className="text-xs text-indigo-700 max-w-xs mx-auto">Ao compartilhar seus dons, você fortalece a teia de cura e recebe abundância em retorno.</p>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Título do Serviço</label>
                        <input 
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            placeholder="Ex: Sessão de Reiki à Distância"
                            className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-serif text-lg text-nature-900 placeholder:text-nature-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Especialidade</label>
                        <select 
                            value={formData.specialty}
                            onChange={e => setFormData({...formData, specialty: e.target.value})}
                            className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 outline-none transition-all text-sm text-nature-700 appearance-none"
                        >
                            <option value="">Selecione uma categoria...</option>
                            <option value="terapias">Terapias Holísticas</option>
                            <option value="mentoria">Mentoria</option>
                            <option value="artes">Artes & Design</option>
                            <option value="gestao">Gestão & Adm</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Duração</label>
                            <div className="flex items-center gap-3 bg-white p-5 border border-nature-100 rounded-2xl">
                                <Clock size={20} className="text-nature-300" />
                                <select className="bg-transparent w-full outline-none text-sm font-bold text-nature-700">
                                    <option>30 min</option>
                                    <option>60 min</option>
                                    <option>90 min</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Valor (Créditos)</label>
                            <div className="flex items-center gap-3 bg-white p-5 border border-nature-100 rounded-2xl">
                                <Star size={20} className="text-indigo-400" />
                                <input 
                                    type="number"
                                    value={formData.credits}
                                    onChange={e => setFormData({...formData, credits: Number(e.target.value)})}
                                    className="w-full bg-transparent outline-none font-bold text-nature-900" 
                                    min={1}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Descrição</label>
                        <textarea 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="Descreva como será essa troca..."
                            className="w-full p-5 bg-white border border-nature-100 rounded-3xl h-32 resize-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm leading-relaxed text-nature-600"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-black flex items-center justify-center gap-3"
                >
                    <Plus size={20} /> Publicar Oferta
                </button>
            </div>
        </PortalView>
    );
};
