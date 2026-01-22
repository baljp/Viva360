import React, { useState } from 'react';
import { Professional, SwapOffer } from '../types';
import { RefreshCw, Search, Sparkles, Filter, ArrowRight, X, Heart } from 'lucide-react';
import { NanoButton, NanoCard } from './common/NanoComponents';
import { DynamicAvatar } from './Common';

interface SwapCircleProps {
    currentUser: Professional;
    offers: SwapOffer[];
    onClose: () => void;
    onCreateOffer: (offer: string, seek: string) => void;
    onMatch: (offerId: string) => void;
}

export const SwapCircle: React.FC<SwapCircleProps> = ({ currentUser, offers, onClose, onCreateOffer, onMatch }) => {
    const [view, setView] = useState<'browse' | 'create'>('browse');
    const [newOffer, setNewOffer] = useState({ offer: '', seek: '' });

    if (view === 'create') {
        return (
            <div className="fixed inset-0 z-[160] bg-nature-50 flex flex-col animate-in slide-in-from-right duration-300">
                <header className="p-6 bg-white border-b border-nature-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-serif italic text-nature-900">Oferecer Troca</h2>
                        <p className="text-[10px] text-nature-400 uppercase tracking-widest font-bold">Alquimia</p>
                    </div>
                    <button onClick={() => setView('browse')}><X className="text-nature-400" /></button>
                </header>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-nature-700 uppercase tracking-wider">O que você oferece?</label>
                        <textarea 
                            value={newOffer.offer}
                            onChange={e => setNewOffer({...newOffer, offer: e.target.value})}
                            placeholder="Ex: 1 Sessão de Reiki, Participação em Workshop..."
                            className="w-full p-4 h-32 bg-white border border-nature-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-100 resize-none"
                        />
                    </div>
                    <div className="flex justify-center text-nature-300"><RefreshCw size={24} /></div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-nature-700 uppercase tracking-wider">O que você busca?</label>
                        <textarea 
                            value={newOffer.seek}
                            onChange={e => setNewOffer({...newOffer, seek: e.target.value})}
                            placeholder="Ex: Terapia Floral, Apoio em Evento..."
                            className="w-full p-4 h-32 bg-white border border-nature-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-100 resize-none"
                        />
                    </div>

                    <NanoButton 
                        onClick={() => { onCreateOffer(newOffer.offer, newOffer.seek); setView('browse'); }} 
                        className="w-full py-4 text-xs font-bold uppercase tracking-widest bg-nature-900 text-white"
                    >
                        Lançar Proposta
                    </NanoButton>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] bg-nature-50 flex flex-col animate-in slide-in-from-right duration-300">
            <header className="p-6 bg-white border-b border-nature-100 flex items-center gap-4">
                <button onClick={onClose}><X className="text-nature-400" /></button>
                <div>
                    <h2 className="text-xl font-serif italic text-nature-900">Círculo de Escambo</h2>
                    <p className="text-[10px] text-nature-400 uppercase tracking-widest font-bold">Economia do Cuidado</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 <div className="bg-amber-50/50 backdrop-blur-md p-6 rounded-[2rem] border border-amber-100/50 flex items-center gap-4 shadow-sm mb-4">
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-full"><Sparkles size={20}/></div>
                    <p className="text-xs text-amber-900 font-medium italic">Trocas geram +50 de Karma e fortalecem o vínculo da tribo.</p>
                </div>

                <div 
                    onClick={() => setView('create')}
                    className="p-6 bg-white border-2 border-dashed border-nature-200 rounded-[2rem] flex items-center justify-center gap-3 hover:border-primary-300 hover:text-primary-600 transition-all cursor-pointer group"
                >
                    <div className="p-2 bg-nature-50 rounded-full group-hover:bg-primary-50 transition-colors"><RefreshCw size={20} /></div>
                    <span className="text-sm font-bold uppercase tracking-wide text-nature-400 group-hover:text-primary-600">Propor Nova Troca</span>
                </div>

                {offers.map((offer, i) => (
                    <NanoCard key={i} className="p-0 overflow-hidden group">
                        <div className="p-6 border-b border-nature-50 bg-white">
                            <div className="flex items-center gap-4 mb-4">
                                <DynamicAvatar user={{ name: 'Guardião', avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${i}` } as any} size="sm" />
                                <div>
                                    <h4 className="font-bold text-nature-900 text-sm">Sara Conexões</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase">Terapeuta Integrativa</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 p-3 bg-nature-50 rounded-xl">
                                    <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest mb-1">Oferece</p>
                                    <p className="text-xs font-medium text-nature-900 line-clamp-2">{offer.offer}</p>
                                </div>
                                <ArrowRight size={16} className="text-nature-300" />
                                <div className="flex-1 p-3 bg-primary-50 rounded-xl">
                                    <p className="text-[9px] font-bold text-primary-400 uppercase tracking-widest mb-1">Busca</p>
                                    <p className="text-xs font-medium text-primary-900 line-clamp-2">{offer.seek}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-nature-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] text-nature-400 font-bold uppercase tracking-widest">
                                <Heart size={12} className="text-nature-300" />
                                <span>Compatível</span>
                            </div>
                            <button 
                                onClick={() => onMatch(offer.id)}
                                className="px-5 py-2 bg-nature-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-nature-900/10 active:scale-95 transition-all"
                            >
                                Aceitar Troca
                            </button>
                        </div>
                    </NanoCard>
                ))}
            </div>
        </div>
    );
};
