import React from 'react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { PortalView } from '../../components/Common';
import { Star, Award, Calendar, Shield, Crown, MessageCircle, MapPin } from 'lucide-react';

export default function SpaceProDetails() {
    const { back, go } = useSantuarioFlow();
    
    const navigateToEvaluation = () => {
        go('SERVICE_EVALUATION');
    };

    // Mock Data
    const pro = {
        name: 'Mestra Ana Luz',
        role: 'Mestre',
        specialties: ['Reiki', 'Cristaloterapia', 'Leitura de Aura'],
        karma: 950,
        joined: 'Desde 2022',
        bio: 'Terapeuta holística com mais de 10 anos de experiência. Dedicada à cura através da energia sutil e dos cristais.',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400',
        stats: {
            sessions: 1240,
            rating: 4.9,
            students: 45
        }
    };

    return (
        <PortalView 
            title="Perfil do Mestre" 
            subtitle="GUARDIÃO" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1519681393784-d8e5b5a45742?q=80&w=800"
        >
            <div className="px-4 pb-24 -mt-12 relative z-10">
                {/* Profile Card */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-nature-100 text-center relative overflow-hidden mb-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-nature-100 mx-auto mb-4 relative overflow-hidden border-4 border-white shadow-lg">
                        <img src={pro.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <h2 className="font-serif italic text-2xl text-nature-900">{pro.name}</h2>
                        <Crown size={16} className="text-amber-500 fill-amber-500" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-nature-400 mb-4">{pro.role}</p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {pro.specialties.map(s => (
                            <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">{s}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-nature-50 pt-6">
                        <div>
                            <p className="text-lg font-bold text-nature-900">{pro.stats.sessions}</p>
                            <p className="text-[8px] text-nature-400 uppercase font-bold">Sessões</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-nature-900 flex items-center justify-center gap-1">{pro.stats.rating} <Star size={10} className="fill-amber-400 text-amber-400"/></p>
                            <p className="text-[8px] text-nature-400 uppercase font-bold">Avaliação</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-nature-900">{pro.stats.students}</p>
                            <p className="text-[8px] text-nature-400 uppercase font-bold">Alunos</p>
                        </div>
                    </div>
                </div>

                {/* About */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm mb-6">
                    <h3 className="font-bold text-nature-900 text-sm mb-3 flex items-center gap-2"><Shield size={14}/> Sobre</h3>
                    <p className="text-sm text-nature-600 leading-relaxed italic">"{pro.bio}"</p>
                </div>

                {/* Performance / Availability */}
                <div className="bg-nature-900 text-white p-6 rounded-[2.5rem] shadow-lg relative overflow-hidden">
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="font-bold text-lg">Agenda Viva</h3>
                            <p className="text-[10px] text-nature-300 font-bold uppercase tracking-widest">Disponibilidade</p>
                        </div>
                        <Calendar size={24} className="opacity-50"/>
                    </div>
                    <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar relative z-10">
                         {['Seg', 'Qua', 'Sex'].map(d => (
                             <div key={d} className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/10">
                                 <span className="text-[10px] font-bold block opacity-60 uppercase">{d}</span>
                                 <span className="text-sm font-bold block">14h-18h</span>
                             </div>
                         ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6">
                    <button onClick={() => go('REPUTATION_OVERVIEW')} className="flex-1 py-4 bg-white border border-nature-100 text-nature-900 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-sm hover:bg-nature-50 transition-all">
                        Ver Avaliações
                    </button>
                    <button onClick={() => navigateToEvaluation()} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
                        <MessageCircle size={16}/> Avaliar
                    </button>
                </div>
            </div>
        </PortalView>
    );
}
