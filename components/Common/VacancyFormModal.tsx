import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

export const VacancyFormModal: React.FC<{ isOpen: boolean, onClose: () => void, onSubmit: (title: string, description: string, specialties: string[]) => void }> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [specialtyInput, setSpecialtyInput] = useState('');
    const [specialties, setSpecialties] = useState<string[]>([]);

    const handleAddSpecialty = () => {
        if (specialtyInput.trim()) {
            setSpecialties([...specialties, specialtyInput.trim()]);
            setSpecialtyInput('');
        }
    };

    const handleRemoveSpecialty = (spec: string) => {
        setSpecialties(specialties.filter(s => s !== spec));
    };

    const handleSubmit = () => {
        if (!title || !description) return;
        onSubmit(title, description, specialties);
        onClose();
        setTitle('');
        setDescription('');
        setSpecialties([]);
        setSpecialtyInput('');
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Nova Oportunidade">
            <div className="space-y-6 pb-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Título da Vaga</label>
                    <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Terapeuta Ayurveda"
                        className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Descrição da Função</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o que o Guardião irá realizar..."
                        className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-none h-24"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Especialidades Requeridas</label>
                    <div className="flex gap-2">
                        <input 
                            value={specialtyInput}
                            onChange={(e) => setSpecialtyInput(e.target.value)}
                            placeholder="Adicionar (ex: Reiki)"
                            className="flex-1 bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSpecialty()}
                        />
                        <button onClick={handleAddSpecialty} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Plus size={20} /></button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {specialties.map(s => (
                            <span key={s} className="px-3 py-1 bg-white border border-nature-100 rounded-xl text-xs flex items-center gap-2">
                                {s} <button onClick={() => handleRemoveSpecialty(s)}><X size={12} className="text-nature-400" /></button>
                            </span>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={!title || !description}
                    className="btn-primary w-full"
                >
                    Publicar Vaga
                </button>
            </div>
        </BottomSheet>
    );
};
