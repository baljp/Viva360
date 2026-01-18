import React, { useState } from 'react';
import { User, Professional, ViewState } from '../types';
import { ChevronLeft, Camera, Save, Leaf, Star, Sparkles, MapPin } from 'lucide-react';

interface ProProfileEditProps {
    pro: Professional;
    onBack: () => void;
    onSave: (updatedPro: Partial<Professional>) => void;
}

const ProProfileEdit: React.FC<ProProfileEditProps> = ({ pro, onBack, onSave }) => {
    const [formData, setFormData] = useState({
        name: pro.name,
        specialty: pro.specialty.join(', '),
        bio: pro.bio,
        location: pro.location,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            specialty: formData.specialty.split(',').map(s => s.trim()),
        });
    };

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 pb-20">
            <div className="flex items-center gap-4 mb-8 px-2">
                <button onClick={onBack} className="p-2 rounded-full bg-white shadow-sm text-nature-500 hover:text-primary-600">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-2xl font-light text-nature-800">Editar <span className="font-semibold">Perfil</span></h2>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-6 px-2 overflow-y-auto">
                {/* Avatar Section */}
                <div className="relative w-32 h-32 mx-auto mb-10">
                    <img
                        src={pro.avatar || 'https://picsum.photos/200/200'}
                        className="w-full h-full object-cover rounded-[2.5rem] border-4 border-white shadow-xl"
                        alt="Avatar"
                    />
                    <button type="button" className="absolute bottom-[-10px] right-[-10px] bg-primary-600 text-white p-3 rounded-2xl shadow-lg hover:bg-primary-700 transition-all border-2 border-white">
                        <Camera size={20} />
                    </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm space-y-4">
                        <div>
                            <label className="text-xs font-bold text-nature-400 uppercase tracking-widest block mb-2 px-1">Nome Profissional</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-4 bg-nature-50 rounded-2xl border-0 outline-none text-nature-800 focus:ring-2 focus:ring-primary-200 transition-all"
                                placeholder="Ex: Sofia Luz"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-nature-400 uppercase tracking-widest block mb-2 px-1">Especialidades (separadas por vírgula)</label>
                            <input
                                type="text"
                                value={formData.specialty}
                                onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                className="w-full p-4 bg-nature-50 rounded-2xl border-0 outline-none text-nature-800 focus:ring-2 focus:ring-primary-200 transition-all"
                                placeholder="Ex: Reiki, Yoga, Meditação"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-nature-400 uppercase tracking-widest block mb-2 px-1">Localização</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full p-4 pl-12 bg-nature-50 rounded-2xl border-0 outline-none text-nature-800 focus:ring-2 focus:ring-primary-200 transition-all"
                                    placeholder="Ex: São Paulo, SP"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm">
                        <label className="text-xs font-bold text-nature-400 uppercase tracking-widest block mb-2 px-1">Bio Profissional</label>
                        <textarea
                            value={formData.bio}
                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            rows={4}
                            className="w-full p-4 bg-nature-50 rounded-2xl border-0 outline-none text-nature-800 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                            placeholder="Conte sua jornada e como você auxilia seus pacientes..."
                        />
                    </div>
                </div>

                {/* Verification Status (Read Only) */}
                <div className="bg-primary-50 p-6 rounded-[2rem] border border-primary-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-primary-700">
                        <div className="bg-white p-2.5 rounded-xl text-primary-600 shadow-sm">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Status de Verificação</p>
                            <p className="text-xs opacity-70">Perfil revisado pela curadoria Viva360</p>
                        </div>
                    </div>
                    <div className="bg-green-100 text-green-700 p-2 rounded-full border border-green-200">
                        <Star size={18} fill="currentColor" />
                    </div>
                </div>

                <button type="submit" className="w-full bg-nature-900 text-white font-bold py-5 rounded-3xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3">
                    <Save size={20} /> Salvar Alterações
                </button>
            </form>
        </div>
    );
};

export default ProProfileEdit;
