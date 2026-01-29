import React, { useState } from 'react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { PortalView, ZenToast, DynamicAvatar } from '../../components/Common';
import { Star, thumbsUp, MessageCircle, Send, Heart, Award } from 'lucide-react';

export default function ServiceEvaluation() {
    const { back, go } = useSantuarioFlow();
    const [rating, setRating] = useState(9.8);
    const [comment, setComment] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const availableTags = ['Empatia Profunda', 'Ambiente Sagrado', 'Pontualidade', 'Energia Elevada', 'Clareza', 'Transformador'];

    const toggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    const handleSubmit = () => {
        setSubmitted(true);
        setTimeout(() => go('EXEC_DASHBOARD'), 2000);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-nature-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                    <Heart size={48} className="text-white fill-white animate-pulse" />
                </div>
                <h2 className="font-serif italic text-3xl text-white mb-2">Gratidão!</h2>
                <p className="text-nature-300 max-w-xs mx-auto leading-relaxed">Sua avaliação fortalece nossa egrégora e ajuda outros buscadores.</p>
                <div className="mt-8 px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-emerald-400 font-bold text-sm">
                    +50 Pontos de Karma Recebidos
                </div>
            </div>
        );
    }

    return (
        <PortalView 
            title="Avaliação da Jornada" 
            subtitle="FEEDBACK SAGRADO" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800"
        >
            <div className="px-4 pb-24 -mt-10 relative z-10 space-y-6">
                
                {/* Entity Card */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-nature-100 text-center relative overflow-hidden">
                    <div className="w-20 h-20 rounded-2xl bg-nature-100 mx-auto mb-3 shadow-lg">
                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400" className="w-full h-full object-cover rounded-2xl"/>
                    </div>
                    <h3 className="font-serif italic text-xl text-nature-900">Mestra Ana Luz</h3>
                    <p className="text-xs font-bold text-nature-400 uppercase tracking-widest mt-1">Sessão de Reiki · 24 Out</p>
                </div>

                {/* Rating Slider */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-nature-100 shadow-sm text-center">
                    <h4 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-6">Nota da Experiência</h4>
                    
                    <div className="relative mb-8">
                        <div className="text-6xl font-bold text-indigo-900 font-serif flex items-center justify-center gap-2">
                            {rating.toFixed(1)} <span className="text-2xl text-nature-300">/ 10</span>
                        </div>
                    </div>

                    <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        step="0.1" 
                        value={rating} 
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full h-2 bg-nature-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-nature-300 uppercase">
                        <span>Poderia Melhorar</span>
                        <span>Extraordinário</span>
                    </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-nature-400 uppercase tracking-widest px-2">O que mais marcou?</h4>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button 
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${tags.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-nature-500 border-nature-100 hover:border-indigo-200'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comment */}
                <div className="bg-white p-4 rounded-[2rem] border border-nature-100 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Deixe um recado para o Mestre (opcional)..."
                        className="w-full h-32 p-2 bg-transparent outline-none text-sm text-nature-700 resize-none placeholder:text-nature-300"
                    />
                </div>

                <button 
                    onClick={handleSubmit}
                    className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
                >
                    <Send size={18} /> Enviar Avaliação
                </button>

            </div>
        </PortalView>
    );    
}
