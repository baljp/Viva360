
import React, { useEffect, useState } from 'react';
import { Professional } from '../../types';
import { MessageCircle, Star } from 'lucide-react';
import { DynamicAvatar, PortalView, PresenceBadge, ZenSkeleton } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/useBuscadorFlow';
import { api } from '../../services/api';

export const BookingSelect: React.FC<{ pros?: Professional[] }> = ({ pros = [] }) => {
    const { go, state, selectDate } = useBuscadorFlow();
    const [presence, setPresence] = useState<'ONLINE' | 'OFFLINE' | 'UNKNOWN'>('UNKNOWN');
    
    // Find selected pro from context state or props
    const contextPro = state.data.pros.find(p => p.id === state.selectedProfessionalId);
    const pro = contextPro || (Array.isArray(pros) ? pros[0] : null);

    useEffect(() => {
        let cancelled = false;
        if (!pro?.id) return;
        const load = async () => {
            try {
                const status = await api.presence.getStatus(pro.id);
                if (!cancelled) setPresence((status || 'OFFLINE') as 'ONLINE' | 'OFFLINE' | 'UNKNOWN');
            } catch {
                if (!cancelled) setPresence('UNKNOWN');
            }
        };
        load();
        const t = window.setInterval(load, 30000);
        return () => {
            cancelled = true;
            window.clearInterval(t);
        };
    }, [pro?.id]);

    if (!pro) return (
        <PortalView title="Guardião" subtitle="BUSCANDO..." onBack={() => go('BOOKING_SEARCH')}>
            <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-700">
                <ZenSkeleton variant="avatar" className="w-32 h-32" />
                <div className="w-full space-y-4">
                    <ZenSkeleton variant="text" className="h-8 w-1/2 mx-auto" />
                    <ZenSkeleton variant="text" className="h-4 w-1/4 mx-auto" />
                    <div className="flex gap-4 justify-center pt-4">
                        <ZenSkeleton variant="card" className="w-32 h-12" />
                        <ZenSkeleton variant="card" className="w-12 h-12" />
                    </div>
                    <ZenSkeleton variant="hero" className="h-40 mt-8" />
                </div>
            </div>
        </PortalView>
    );

    return (
    <PortalView title="Guardião" subtitle={pro.name.toUpperCase()} onBack={() => go('BOOKING_SEARCH')}>
        <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
                <DynamicAvatar user={pro} size="xl" className="border-4 border-white shadow-xl" />
                <div>
                    <h3 className="text-2xl font-serif italic text-nature-900">{pro.name}</h3>
                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">{(pro.specialty || []).join(' • ')}</p>
                    <div className="mt-3">
                        <PresenceBadge status={presence} />
                    </div>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => go('BOOKING_CONFIRM')} 
                        className="btn-primary flex-1"
                    >
                        Agendar Ritual
                    </button>
                    <button 
                        onClick={() => {
                            // Simple mock behavior for messaging
                            const msg = `Olá ${pro.name}, gostaria de saber mais sobre o seu trabalho.`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="p-3 bg-nature-50 text-nature-600 rounded-2xl border border-nature-100 hover:bg-white transition-all active:scale-95 shadow-sm"
                        title="Enviar Mensagem"
                    >
                        <MessageCircle size={20}/>
                    </button>
                </div>
            </div>

            {/* Quick Date Selection */}
            <div className="px-2 space-y-4">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Janela de Atendimento</h4>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {[0, 1, 2].map(days => {
                        const d = new Date();
                        d.setDate(d.getDate() + days);
                        const isSelected = state.selectedDate?.toDateString() === d.toDateString();
                        return (
                            <div 
                                key={days}
                                onClick={() => selectDate(d)}
                                className={`flex-shrink-0 w-24 p-4 rounded-3xl border-2 transition-all cursor-pointer text-center ${isSelected ? 'border-nature-900 bg-white shadow-md' : 'border-nature-50 bg-nature-50/50'}`}
                            >
                                <p className="text-[9px] font-black text-nature-400 uppercase tracking-tighter mb-1">
                                    {days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                                </p>
                                <p className="text-lg font-serif italic text-nature-900">{d.getDate()}</p>
                                <p className="text-[9px] font-bold text-nature-400 uppercase">{d.toLocaleDateString('pt-BR', { month: 'short' })}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-4">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Biografia</h4>
                <p className="text-sm text-nature-600 italic leading-relaxed px-2">"{pro.bio || 'Dedicado à cura integral e ao despertar da consciência através de práticas ancestrais e modernas.'}"</p>
            </div>

            {/* Avaliações Section */}
            <div className="space-y-4 px-2">
                 <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Avaliações da Tribo</h4>
                     <div className="flex items-center gap-1 text-amber-500">
                         <Star size={12} fill="currentColor" />
                         <span className="text-xs font-bold">{pro.rating || 5.0}</span>
                         <span className="text-[10px] text-nature-400">({pro.reviewCount || 0})</span>
                     </div>
                 </div>

                 {pro.reviews && pro.reviews.length > 0 ? (
                     <div className="space-y-3">
                         {pro.reviews.map((review, i) => (
                             <div key={i} className="bg-white p-4 rounded-3xl border border-nature-50 shadow-sm">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="flex items-center gap-2">
                                         <div className="w-8 h-8 bg-nature-100 rounded-full flex items-center justify-center font-bold text-xs text-nature-600">
                                             {review.authorName.charAt(0)}
                                         </div>
                                         <span className="text-xs font-bold text-nature-700">{review.authorName}</span>
                                     </div>
                                     <div className="flex gap-0.5 text-amber-400">
                                         {[...Array(Math.floor(review.rating))].map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                                     </div>
                                 </div>
                                 <p className="text-xs text-nature-600 italic">"{review.comment}"</p>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="text-center py-8 text-nature-400 text-xs italic">Nenhuma avaliação ainda. Seja o primeiro!</div>
                 )}
            </div>
        </div>
    </PortalView>
    );
};
