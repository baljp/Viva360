import React, { useState } from 'react';
import { Package, Sparkles, Music, Cloud, Plus, X } from 'lucide-react';
import { Product } from '../../types';
import { BottomSheet } from './BottomSheet';

export const ProductFormModal: React.FC<{ isOpen: boolean, onClose: () => void, onSubmit: (p: Omit<Product, 'id'>) => void }> = ({ isOpen, onClose, onSubmit }) => {
    const [type, setType] = useState<'physical' | 'digital_content' | 'workshop' | 'event'>('physical');
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=400');
    const [eventDate, setEventDate] = useState('');
    const [symptomInput, setSymptomInput] = useState('');
    const [symptoms, setSymptoms] = useState<string[]>([]);

    const handleSubmit = () => {
        if (!name || price <= 0) return;
        onSubmit({
            name, price, image, category, type, description, 
            eventDate: (type === 'event' || type === 'workshop') ? eventDate : undefined,
            symptoms,
            karmaReward: Math.floor(price * 0.5),
            spotsLeft: (type === 'event' || type === 'workshop') ? 20 : undefined
        });
        // Reset
        setName(''); setPrice(0); setCategory(''); setDescription(''); setSymptoms([]);
        onClose();
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Novo Item no Bazar">
            <div className="space-y-6 pb-12">
                {/* Tipo de Produto */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { id: 'physical', label: 'Físico', icon: Package },
                        { id: 'workshop', label: 'Workshop', icon: Sparkles },
                        { id: 'event', label: 'Evento/Festa', icon: Music },
                        { id: 'digital_content', label: 'Digital', icon: Cloud }
                    ].map(t => (
                        <button key={t.id} onClick={() => setType(t.id as any)} className={`px-4 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border transition-all shrink-0 ${type === t.id ? 'bg-nature-900 text-white border-nature-900 shadow-lg' : 'bg-white text-nature-400 border-nature-100'}`}>
                            <t.icon size={14} /> {t.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Nome do Produto/Evento</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Cristal de Ametista ou Workshop de Breathwork" className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary-100" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Preço (R$)</label>
                            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Categoria</label>
                            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Pedras, Cura" className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none" />
                        </div>
                    </div>

                    {(type === 'event' || type === 'workshop') && (
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Data do Encontro</label>
                            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none" />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Indicações / Sintomas</label>
                        <div className="flex gap-2">
                             <input value={symptomInput} onChange={e => setSymptomInput(e.target.value)} placeholder="Ex: Ansiedade" className="flex-1 bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none" />
                             <button onClick={() => { if(symptomInput) { setSymptoms([...symptoms, symptomInput]); setSymptomInput(''); } }} className="p-4 bg-primary-900 text-white rounded-2xl active:scale-90 transition-transform"><Plus size={20}/></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {symptoms.map(s => <span key={s} className="px-3 py-1 bg-white border border-nature-100 rounded-full text-[10px] font-bold text-nature-500 uppercase flex items-center gap-2">{s} <button onClick={() => setSymptoms(symptoms.filter(x => x !== s))}><X size={10}/></button></span>)}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Manifesto (Descrição)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Descreva a energia deste item..." className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none resize-none" />
                    </div>
                </div>

                <button onClick={handleSubmit} className="btn-cta w-full">Ofertar ao Universo</button>
            </div>
        </BottomSheet>
    );
};
