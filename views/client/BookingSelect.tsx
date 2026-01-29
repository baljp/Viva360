
import React from 'react';
import { Professional } from '../../types';
import { MessageCircle, Star } from 'lucide-react';
import { DynamicAvatar, PortalView } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';

export const BookingSelect: React.FC<{ pros?: Professional[] }> = ({ pros = [] }) => {
    const { go, state } = useBuscadorFlow();
    
    // Find selected pro from context state or props
    const contextPro = state.data.pros.find(p => p.id === state.selectedProfessionalId);
    const pro = contextPro || (Array.isArray(pros) ? pros[0] : null);

    if (!pro) return (
        <PortalView title="Guardião" subtitle="DETALHES" onBack={() => go('BOOKING_SEARCH')}>
            <div className="text-center p-10 opacity-50">Carregando...</div>
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
                </div>
                <div className="flex gap-4">
                    <button onClick={() => go('BOOKING_CONFIRM')} className="px-6 py-3 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Agendar Ritual</button>
                    <button className="p-3 bg-nature-50 text-nature-600 rounded-2xl border border-nature-100 hover:bg-white transition-all"><MessageCircle size={20}/></button>
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
