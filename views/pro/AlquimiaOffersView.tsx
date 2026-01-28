import React, { useState } from 'react';
import { ViewState, Professional } from '../../types';
import { Zap, Search, Plus, Repeat, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { PortalView, DynamicAvatar } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';

export const AlquimiaOffersView: React.FC<{ flow: any }> = ({ flow }) => {
    const { go } = useGuardiaoFlow();
    const [activeTab, setActiveTab] = useState<'community' | 'mine' | 'active'>('community');

    // Mock Data for Alquimia Offers
    const offers = [
        { id: '1', proName: 'Ana Clara', proAvatar: '', service: 'Mentoria de Marketing', credits: 2, specialty: 'Marketing Holístico' },
        { id: '2', proName: 'Pedro Sol', proAvatar: '', service: 'Sessão de Reiki', credits: 1, specialty: 'Reiki Master' },
        { id: '3', proName: 'Sofia Lunar', proAvatar: '', service: 'Consultoria Financeira', credits: 3, specialty: 'Finanças' }
    ];

    return (
        <PortalView 
            title="Rede Alquimia" 
            subtitle="ESCAMBO PROFISSIONAL" 
            onBack={() => go('DASHBOARD')}
            heroImage="https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?q=80&w=800"
        >
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                {[
                    { id: 'community', label: 'Comunidade' },
                    { id: 'mine', label: 'Minhas Ofertas' },
                    { id: 'active', label: 'Trocas Ativas' }
                ].map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${activeTab === tab.id ? 'bg-nature-900 text-white border-nature-900 shadow-md' : 'bg-white text-nature-400 border-nature-100 hover:border-nature-300'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'community' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-serif italic mb-2">Troque Saberes</h3>
                            <p className="text-xs opacity-90 mb-6 max-w-[80%]">Ofereça seu dom e receba o que precisa para expandir seu servir.</p>
                            <button onClick={() => go('ESCAMBO_PROPOSE')} className="px-6 py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-transform"><Plus size={14}/> Criar Oferta</button>
                        </div>
                        <Repeat size={120} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Ofertas Disponíveis</h4>
                            <Search size={16} className="text-nature-300" />
                        </div>
                        {offers.map(offer => (
                            <div key={offer.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all">
                                <DynamicAvatar user={{ name: offer.proName, avatar: offer.proAvatar }} className="border-2 border-indigo-50" />
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-nature-900 text-sm truncate">{offer.service}</h5>
                                    <p className="text-[10px] text-nature-500 font-medium truncate">{offer.proName} • {offer.specialty}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{offer.credits} Créditos</span>
                                    <button onClick={() => go('ESCAMBO_CONFIRM')} className="p-2 bg-nature-50 rounded-full text-nature-300 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><ArrowRight size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'mine' && (
                 <div className="py-20 text-center space-y-4 opacity-50">
                    <Zap size={48} className="mx-auto text-nature-300" />
                    <p className="text-sm font-serif italic text-nature-400">Você ainda não criou ofertas de troca.</p>
                    <button onClick={() => go('ESCAMBO_PROPOSE')} className="text-xs font-bold text-indigo-500 uppercase tracking-widest hover:underline">Começar Agora</button>
                 </div>
            )}

            {activeTab === 'active' && (
                 <div className="py-20 text-center space-y-4 opacity-50">
                    <Repeat size={48} className="mx-auto text-nature-300" />
                    <p className="text-sm font-serif italic text-nature-400">Nenhuma troca em andamento.</p>
                 </div>
            )}
        </PortalView>
    );
};
