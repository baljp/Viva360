import React from 'react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext';
import { PortalView } from '../../../components/Common';
import { Star, Award, Calendar, Shield, Crown, MessageCircle } from 'lucide-react';

export default function SpaceProDetails() {
    const { state, back, go } = useSantuarioFlow();
    
    const navigateToEvaluation = () => {
        go('SERVICE_EVALUATION');
    };

    // Find real professional data
    const pro = state.data.team.find(p => p.id === state.selectedProId) || {
        name: 'Guardião não encontrado',
        role: 'Desconhecido',
        specialties: [],
        karma: 0,
        joined: '---',
        bio: 'Informações não disponíveis.',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400',
        totalHealingHours: 0,
        rating: 0,
        reviewCount: 0
    };

    // Performance metrics derived from real data
    const stats = {
        sessions: Number((pro as any).totalHealingHours || 0),
        rating: Number((pro as any).rating || 0),
        reviews: Number((pro as any).reviewCount || 0),
        karma: Number((pro as any).karma || 0),
    };
    const contract = (pro as any).contract || null;
    const isMaster = stats.karma > 800;

    return (
        <PortalView 
            title={isMaster ? 'Perfil do Mestre' : 'Perfil do Guardião'} 
            subtitle="CÍRCULO DO SANTUÁRIO" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1519681393784-d8e5b5a45742?q=80&w=800"
        >
            <div className="px-4 pb-24 -mt-12 relative z-10">
                {/* Profile Card */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-nature-100 text-center relative overflow-hidden mb-6">
                    <div className="w-24 h-24 rounded-[2rem] mx-auto mb-4 relative overflow-hidden border-4 border-white shadow-lg">
                        <img src={(pro as any).avatar || (pro as any).image} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <h2 className="font-serif italic text-2xl text-nature-900">{pro.name}</h2>
                        {isMaster && <Crown size={16} className="text-amber-500 fill-amber-500" />}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-nature-400 mb-4">{isMaster ? 'Mestre' : 'Guardião'}</p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {((pro as any).specialty || (pro as any).specialties || []).map((s: string) => (
                            <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">{s}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-nature-50 pt-6">
                        <div>
                            <p className="text-lg font-bold text-nature-900">{stats.sessions}</p>
                            <p className="text-[9px] text-nature-400 uppercase font-bold">Horas de Cura</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-nature-900 flex items-center justify-center gap-1">{stats.rating.toFixed ? stats.rating.toFixed(1) : stats.rating} <Star size={10} className="fill-amber-400 text-amber-400"/></p>
                            <p className="text-[9px] text-nature-400 uppercase font-bold">Avaliação</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-nature-900">{stats.reviews}</p>
                            <p className="text-[9px] text-nature-400 uppercase font-bold">Avaliações</p>
                        </div>
                    </div>
                </div>

                {/* Contract (Space view) */}
                {contract && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm mb-6">
                        <h3 className="font-bold text-nature-900 text-sm mb-3 flex items-center gap-2"><Award size={14}/> Vínculo com o Santuário</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-nature-50 p-4 rounded-2xl border border-nature-100">
                                <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Status</p>
                                <p className="text-sm font-black text-nature-900 mt-1">{String(contract.status || '').toUpperCase()}</p>
                            </div>
                            <div className="bg-nature-50 p-4 rounded-2xl border border-nature-100">
                                <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Repasse</p>
                                <p className="text-sm font-black text-emerald-700 mt-1">{Number(contract.revenueShare || 0)}%</p>
                            </div>
                            <div className="bg-nature-50 p-4 rounded-2xl border border-nature-100">
                                <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Horas/Semana</p>
                                <p className="text-sm font-black text-nature-900 mt-1">{Number(contract.hoursPerWeek || 0)}h</p>
                            </div>
                            <div className="bg-nature-50 p-4 rounded-2xl border border-nature-100">
                                <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Assinatura</p>
                                <p className="text-sm font-black text-nature-900 mt-1">{contract.signed ? 'Assinado' : 'Pendente'}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100">
                                Karma {stats.karma}
                            </span>
                            <span className="px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-nature-50 text-nature-700 border border-nature-100">
                                Salas {Array.isArray(contract.roomsAllowed) ? contract.roomsAllowed.length : 0}
                            </span>
                            {(contract.endDate || contract.end_date) && (
                                <span className="px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-nature-50 text-nature-700 border border-nature-100">
                                    Até {new Date(contract.endDate || contract.end_date).toLocaleDateString('pt-BR')}
                                </span>
                            )}
                        </div>
                    </div>
                )}

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
