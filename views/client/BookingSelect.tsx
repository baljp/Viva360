
import React from 'react';
import { Professional } from '../../types';
import { MessageCircle } from 'lucide-react';
import { DynamicAvatar, PortalView } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';

export const BookingSelect: React.FC<{ data: { pros: Professional[] } }> = ({ data }) => {
    const { pros } = data;
    const { go } = useBuscadorFlow();
    
    // For now, selecting the first pro or using context state. 
    // In a real flow, 'selectedPro' should be in the context or passed as route param.
    // We will assume the context holds it or we mock it with the first pro.
    const pro = pros[0];

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
                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">{pro.specialty.join(' • ')}</p>
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
        </div>
    </PortalView>
    );
};
