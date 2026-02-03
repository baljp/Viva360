import React, { useState } from 'react';
import { Tag, MessageSquare } from 'lucide-react';
import { StarRating } from './StarRating';
import { BottomSheet } from './BottomSheet';

export const ReviewFormModal: React.FC<{ isOpen: boolean, onClose: () => void, targetName: string, onSubmit: (rating: number, comment: string, tags: string[]) => void }> = ({ isOpen, onClose, targetName, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    
    const availableTags = ['Empático', 'Pontual', 'Ambiente Zen', 'Transformador', 'Mãos de Fada', 'Profissional', 'Acolhedor', 'Técnico'];

    const handleSubmit = () => {
        if (rating === 0) return;
        onSubmit(rating, comment, selectedTags);
        onClose();
        // Reset form
        setRating(0);
        setComment('');
        setSelectedTags([]);
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Avaliar Experiência">
            <div className="space-y-8 pb-8 text-center">
                <div className="space-y-2">
                    <p className="text-sm text-nature-500">Como foi sua conexão com <strong className="text-nature-900">{targetName}</strong>?</p>
                    <div className="flex justify-center py-4">
                        <StarRating rating={rating} onRate={setRating} size={40} interactive />
                    </div>
                    {rating > 0 && <p className="text-xs font-bold text-amber-500 uppercase tracking-widest animate-in fade-in">{rating === 5 ? 'Conexão Sublime' : rating >= 4 ? 'Harmonioso' : rating === 3 ? 'Equilibrado' : 'Sopro de Ajuste'}</p>}
                </div>

                <div className="space-y-3 text-left">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2 flex items-center gap-2"><Tag size={12}/> Quais frequências você sentiu?</label>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => toggleTag(tag)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedTags.includes(tag) ? 'bg-nature-900 text-white border-nature-900' : 'bg-white text-nature-500 border-nature-100 hover:border-nature-300'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 text-left">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2 flex items-center gap-2"><MessageSquare size={12}/> Deixe um comentário</label>
                    <textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Compartilhe como você se sentiu..."
                        className="w-full bg-nature-50 border border-nature-100 p-4 rounded-3xl text-sm outline-none focus:ring-2 focus:ring-primary-100 resize-none h-32"
                    />
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={rating === 0}
                    className="btn-primary w-full"
                >
                    Enviar Avaliação
                </button>
            </div>
        </BottomSheet>
    );
};
