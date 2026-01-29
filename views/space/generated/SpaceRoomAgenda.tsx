import React from 'react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { PortalView } from '../../components/Common';
import { Calendar, Clock, User, ChevronRight } from 'lucide-react';

export default function SpaceRoomAgenda() {
    const { back } = useSantuarioFlow();

    const events = [
        { id: 1, time: '09:00 - 10:30', title: 'Yoga Matinal', host: 'Clara Luz', type: 'Prática Coletiva' },
        { id: 2, time: '14:00 - 15:30', title: 'Reiki Solidário', host: 'Grupo Terapêutico', type: 'Atendimento' },
        { id: 3, time: '19:00 - 21:00', title: 'Roda de Mantras', host: 'Santuário Team', type: 'Cerimônia' },
    ];

    return (
        <PortalView 
            title="Agenda do Altar" 
            subtitle="FLUXO DE ENERGIA" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1596131397935-33ec8a7e0892?q=80&w=600"
        >
            <div className="space-y-6 px-4">
                <div className="bg-nature-50 p-6 rounded-[2.5rem] text-center mb-6">
                    <h3 className="font-serif italic text-2xl text-nature-900">Sala Cristal</h3>
                    <p className="text-xs text-nature-500 mt-2">Visualizando agenda para Hoje, 24 de Outubro</p>
                </div>

                <div className="space-y-4">
                    {events.map((evt) => (
                        <div key={evt.id} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all">
                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-nature-50 rounded-2xl shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <Clock size={16} className="mb-1 opacity-50"/>
                                <span className="text-[10px] font-bold text-center leading-tight">{evt.time.split(' - ')[0]}<br/>{evt.time.split(' - ')[1]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-nature-900 text-sm truncate">{evt.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <User size={10} className="text-nature-400"/>
                                    <p className="text-[10px] text-nature-500 uppercase font-bold truncate">{evt.host}</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-nature-50 text-nature-400 rounded-lg text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">
                                {evt.type}
                            </div>
                        </div>
                    ))}
                </div>

                <button className="w-full py-4 text-center text-xs font-bold text-nature-400 uppercase tracking-widest hover:text-nature-600 transition-colors">
                    Ver Calendário Completo
                </button>
            </div>
        </PortalView>
    );    
}
