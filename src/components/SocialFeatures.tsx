import React, { useState } from 'react';
import { User, ContentItem } from '../types';
import { Share2, Gift, Heart, Globe, TreePine } from 'lucide-react';
import { BottomSheet } from './Common';
import { IMPACT_GOAL, CURRENT_IMPACT } from '../constants';

// --- USER AURA (Generative Visual Profile) ---
export const UserAura: React.FC<{ user: User }> = ({ user }) => {
    const [showShare, setShowShare] = useState(false);
    const stats = user.consumptionStats || { physical: 33, mental: 33, energy: 33 };

    // Calculate gradient stops based on consumption
    // Physical -> Orange/Red, Mental -> Blue/Indigo, Energy -> Purple/Amber
    // This is a simplified simulation of a mesh gradient
    
    return (
        <div className="relative w-full h-80 rounded-[3rem] overflow-hidden shadow-sm border border-white group">
            {/* Generative Mesh Gradient Background */}
            <div className="absolute inset-0 bg-white">
                <div 
                    className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full blur-[80px] opacity-70 animate-pulse"
                    style={{ backgroundColor: '#fed7aa', animationDuration: '8s' }} // Physical (Orange)
                ></div>
                <div 
                    className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[80px] opacity-70 animate-pulse"
                    style={{ backgroundColor: '#bfdbfe', animationDuration: '10s', animationDelay: '1s' }} // Mental (Blue)
                ></div>
                <div 
                    className="absolute top-[30%] left-[30%] w-[60%] h-[60%] rounded-full blur-[60px] opacity-60 animate-pulse"
                    style={{ backgroundColor: '#ddd6fe', animationDuration: '12s', animationDelay: '2s' }} // Energy (Violet)
                ></div>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-8 z-10 bg-white/10 backdrop-blur-[1px]">
                <div className="flex justify-between items-start">
                    <div className="bg-white/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/50">
                        <span className="text-[10px] font-bold text-nature-800 tracking-widest uppercase">Aura da Semana</span>
                    </div>
                    <button 
                        onClick={() => setShowShare(true)}
                        className="bg-white/80 p-3 rounded-full text-nature-800 hover:scale-110 transition-transform shadow-sm"
                    >
                        <Share2 size={18} />
                    </button>
                </div>

                <div className="text-center space-y-1">
                    <div className="w-20 h-20 rounded-full border-4 border-white/50 shadow-lg overflow-hidden mx-auto mb-3">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-2xl font-serif text-nature-900 leading-tight">Equilíbrio Radiante</h3>
                    <p className="text-xs text-nature-600 font-medium">Sua energia está fluindo entre o corpo e a mente.</p>
                </div>

                <div className="flex justify-center gap-2">
                    {/* Tags based on data */}
                    {stats.physical > 30 && <span className="text-[10px] bg-orange-100/80 text-orange-800 px-3 py-1 rounded-full">Físico</span>}
                    {stats.mental > 30 && <span className="text-[10px] bg-blue-100/80 text-blue-800 px-3 py-1 rounded-full">Mental</span>}
                    {stats.energy > 20 && <span className="text-[10px] bg-purple-100/80 text-purple-800 px-3 py-1 rounded-full">Energético</span>}
                </div>
            </div>

            {/* Share Bottom Sheet */}
            <BottomSheet isOpen={showShare} onClose={() => setShowShare(false)} title="Compartilhar Vibe">
                <div className="space-y-6 pb-6 text-center">
                    <p className="text-sm text-nature-500">Mostre sua aura para o mundo.</p>
                    
                    {/* Story Preview */}
                    <div className="aspect-[9/16] w-2/3 mx-auto bg-gradient-to-br from-orange-100 via-blue-100 to-purple-100 rounded-[2rem] p-6 flex flex-col items-center justify-center relative shadow-lg overflow-hidden">
                        <div className="absolute top-8 text-xs font-bold tracking-widest text-nature-800 uppercase">Viva360</div>
                        <div className="w-24 h-24 rounded-full border-4 border-white/60 shadow-lg overflow-hidden mb-4">
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <h4 className="font-serif text-xl text-nature-900 mb-2">Minha Aura da Semana</h4>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
                            Instagram Story
                        </button>
                        <button className="bg-nature-100 text-nature-800 font-bold py-3 rounded-xl text-sm hover:bg-nature-200 transition-colors">
                            Salvar Imagem
                        </button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
};

// --- TOTEM (Journey Companion) ---
export const Totem: React.FC<{ mood: number }> = ({ mood }) => {
    // Mood: 1-2 (Low), 3 (Neutral), 4-5 (High)
    
    const isLow = mood <= 2;
    const isHigh = mood >= 4;

    return (
        <div className={`transition-all duration-1000 ease-in-out flex flex-col items-center justify-center cursor-pointer ${isLow ? 'scale-110' : 'scale-100'}`}>
            <div className="relative w-24 h-24">
                {/* Abstract Totem Shape (Owl/Bird inspired) */}
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                    {/* Base Body */}
                    <path 
                        d="M50 90 Q20 90 20 50 Q20 10 50 10 Q80 10 80 50 Q80 90 50 90 Z" 
                        className={`transition-colors duration-1000 ${isLow ? 'fill-blue-100' : isHigh ? 'fill-amber-100' : 'fill-nature-100'}`} 
                    />
                    {/* Eyes */}
                    <circle cx="35" cy="40" r={isLow ? "4" : "6"} className="fill-nature-800 transition-all duration-500" />
                    <circle cx="65" cy="40" r={isLow ? "4" : "6"} className="fill-nature-800 transition-all duration-500" />
                    {/* Beak */}
                    <path d="M50 50 L45 60 L55 60 Z" className="fill-amber-400" />
                    {/* Wings/Aura */}
                    <path 
                        d="M10 50 Q5 30 20 30" 
                        fill="none" 
                        stroke={isHigh ? "#fbbf24" : "#a8a29e"} 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        className={isHigh ? 'animate-bounce' : ''}
                    />
                    <path 
                        d="M90 50 Q95 30 80 30" 
                        fill="none" 
                        stroke={isHigh ? "#fbbf24" : "#a8a29e"} 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        className={isHigh ? 'animate-bounce' : ''}
                        style={{ animationDelay: '0.1s' }}
                    />
                </svg>
                
                {/* Glow for high mood */}
                {isHigh && <div className="absolute inset-0 bg-amber-200 rounded-full blur-xl opacity-30 animate-pulse -z-10"></div>}
            </div>
            
            {/* Totem Message */}
            <div className={`mt-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white shadow-sm transition-all duration-500 ${isLow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <p className="text-[10px] font-medium text-nature-600">Estou aqui com você.</p>
            </div>
        </div>
    );
};

// --- GIFT OF CALM (Acquisition) ---
export const GiftCard: React.FC<{ item: ContentItem; userGifts: number }> = ({ item, userGifts }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = () => {
        setSent(true);
        // Logic to generate link would go here
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-primary-100 transition-colors"
            >
                <Gift size={12} /> Presentear
            </button>

            <BottomSheet isOpen={isOpen} onClose={() => { setIsOpen(false); setSent(false); }} title="Presente de Calma">
                {sent ? (
                    <div className="text-center pb-8 animate-in zoom-in">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <Heart size={24} fill="currentColor" />
                        </div>
                        <h3 className="text-lg font-bold text-nature-800 mb-2">Link Gerado!</h3>
                        <div className="bg-nature-50 p-3 rounded-xl mb-4 border border-nature-200">
                            <p className="text-xs text-nature-500 font-mono">viva360.app/gift/x92ks</p>
                        </div>
                        <button className="w-full bg-nature-900 text-white font-bold py-3 rounded-xl">Copiar & Enviar</button>
                    </div>
                ) : (
                    <div className="pb-8">
                        <div className="flex gap-4 mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-nature-200 overflow-hidden shrink-0">
                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="font-bold text-nature-800">{item.title}</h4>
                                <p className="text-xs text-nature-500 mt-1 line-clamp-2">Envie este conteúdo gratuitamente para um amigo que precisa.</p>
                                <p className="text-xs font-bold text-primary-600 mt-2">Você tem {userGifts} presentes este mês.</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleSend}
                            disabled={userGifts <= 0}
                            className="w-full bg-nature-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                        >
                            Gerar Link de Presente
                        </button>
                    </div>
                )}
            </BottomSheet>
        </>
    );
};

// --- GLOBAL IMPACT (Charity Gamification) ---
export const GlobalImpact: React.FC = () => {
    const percentage = Math.min((CURRENT_IMPACT / IMPACT_GOAL) * 100, 100);

    return (
        <div className="bg-gradient-to-br from-[#ecfccb] to-[#dcfce7] p-6 rounded-[2.5rem] border border-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
            
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="bg-white/60 p-2.5 rounded-full text-green-700 backdrop-blur-sm">
                    <Globe size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-nature-800 text-sm">Impacto Global</h3>
                    <p className="text-[10px] text-nature-600 font-medium uppercase tracking-wide">Comunidade Viva360</p>
                </div>
            </div>

            <div className="mb-2 flex justify-between items-end relative z-10">
                <span className="text-2xl font-light text-nature-900">{CURRENT_IMPACT.toLocaleString()} <span className="text-sm text-nature-500">min</span></span>
                <span className="text-xs text-nature-500 font-bold mb-1">Meta: {IMPACT_GOAL.toLocaleString()}</span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden relative z-10">
                <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>

            <p className="text-xs text-nature-600 mt-3 leading-relaxed relative z-10">
                <TreePine size={12} className="inline mr-1 text-green-700" />
                Faltam {IMPACT_GOAL - CURRENT_IMPACT} minutos para plantarmos a <strong className="text-green-800">Floresta Viva360</strong>.
            </p>
        </div>
    );
};
