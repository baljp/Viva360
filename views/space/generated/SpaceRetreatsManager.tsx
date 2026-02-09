import React from 'react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext';
import { PortalView } from '../../../components/Common';
import { Calendar, Users, MapPin, Plus, ArrowRight } from 'lucide-react';

export default function SpaceRetreatsManager() {
    const { back, go } = useSantuarioFlow();

    const retreats = [
        { id: 1, title: 'Despertar da Consciência', dates: '12-15 Nov', spots: '8/12', revenue: 'R$ 15k', status: 'active', image: 'https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?q=80&w=600' },
        { id: 2, title: 'Silêncio Interior', dates: '05-09 Dez', spots: '2/10', revenue: 'R$ 4k', status: 'draft', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600' },
    ];

    return (
        <PortalView 
            title="Retiros" 
            subtitle="JORNADAS IMERSIVAS" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1545167622-3a6ac15600f3?q=80&w=800"
            footer={
                <button onClick={() => go('EVENT_CREATE')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Plus size={16} /> Criar Novo Retiro
                </button>
            }
        >
            <div className="space-y-6 px-4 pb-24">
                {retreats.map(retreat => (
                    <div key={retreat.id} className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden group">
                        <div className="h-32 relative">
                            <img src={retreat.image} className="w-full h-full object-cover"/>
                            <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-widest text-nature-900 shadow-sm">
                                {retreat.status === 'active' ? '🟢 Ativo' : '⚪ Rascunho'}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-serif italic text-xl text-nature-900">{retreat.title}</h3>
                                    <p className="text-xs text-nature-500 font-bold flex items-center gap-2 mt-1"><Calendar size={12}/> {retreat.dates}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-nature-400 uppercase">Previsão</p>
                                    <p className="text-sm font-bold text-emerald-600">{retreat.revenue}</p>
                                </div>
                            </div>
                            
                            <div className="w-full bg-nature-50 h-2 rounded-full overflow-hidden mb-4">
                                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '60%' }}></div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] text-nature-500 font-bold uppercase flex items-center gap-2"><Users size={12}/> {retreat.spots} Vagas preenchidas</p>
                                <button onClick={() => go('EVENT_CREATE')} className="p-2 bg-nature-50 rounded-full text-nature-400 hover:bg-nature-100 transition-colors"><ArrowRight size={16}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </PortalView>
    );    
}
