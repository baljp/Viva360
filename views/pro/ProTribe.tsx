
import React, { useState } from 'react';
import { ViewState, Professional } from '../../types';
import { Zap, RefreshCw, Users, Search, Plus, ArrowRightLeft, Filter, Heart, MessageCircle } from 'lucide-react';
import { PortalView, ZenToast, DynamicAvatar } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';

export const ProTribe: React.FC<{ user: Professional }> = ({ user }) => {
    const { go, notify } = useGuardiaoFlow();
    const [activeTab, setActiveTab] = useState<'market' | 'my-offers'>('market');
    const [filter, setFilter] = useState('all');

    // Mock Data for Exchanges
    const exchanges = [
        { id: 1, name: 'Mentoria de Carreira', type: 'offer', owner: 'Mestre Carlos', avatar: 'C', wish: 'Design de Logo', karma: 150, category: 'Mentoria' },
        { id: 2, name: 'Sessão de Reiki', type: 'offer', owner: 'Ana Luz', avatar: 'A', wish: 'Edição de Vídeo', karma: 80, category: 'Terapia' },
        { id: 3, name: 'Consultoria Financeira', type: 'offer', owner: 'João B.', avatar: 'J', wish: 'Yoga Personal', karma: 120, category: 'Consultoria' },
    ];

    const handlePropose = (item: any) => {
        notify("Proposta Enviada", `Você ofereceu troca para ${item.owner}.`, "success");
    };

    return (
    <PortalView 
        title="Rede Viva" 
        subtitle="COMUNIDADE DE ESCAMBO" 
        onBack={() => go('DASHBOARD')}
        footer={
            activeTab === 'market' ? (
                <div className="flex gap-2">
                     <button className="flex-1 py-4 bg-indigo-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2">
                        <Filter size={14}/> Filtrar
                     </button>
                     <button onClick={() => setActiveTab('my-offers')} className="flex-1 py-4 bg-white border border-nature-100 text-nature-900 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-sm">
                        Minhas Ofertas
                     </button>
                </div>
            ) : (
                 <button onClick={() => setActiveTab('market')} className="w-full py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg">
                    Voltar ao Mural
                 </button>
            )
        }
    >
      <div className="space-y-6">
        
        {/* HERO: CREDITS */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
           <div className="relative z-10 flex justify-between items-end">
               <div>
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-300 mb-1">Seu Saldo de Troca</p>
                   <h3 className="text-5xl font-serif italic leading-none">{(typeof user.swapCredits === 'number' ? user.swapCredits : 120)} <span className="text-lg not-italic text-indigo-300 font-sans font-bold">Créditos</span></h3>
               </div>
               <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                   <ArrowRightLeft size={24} className="text-indigo-200" />
               </div>
           </div>
           
           <div className="mt-8 flex gap-3">
               <button onClick={() => notify("Nova Oferta", "Tela de criação de oferta abriria aqui.", "info")} className="flex-1 bg-white text-indigo-900 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                   <Plus size={14}/> Anunciar Serviço
               </button>
           </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-6 px-4 border-b border-nature-100 pb-2">
            <button onClick={() => setActiveTab('market')} className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'market' ? 'text-indigo-900 border-b-2 border-indigo-900' : 'text-nature-300'}`}>
                Mural Global
            </button>
            <button onClick={() => setActiveTab('my-offers')} className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'my-offers' ? 'text-indigo-900 border-b-2 border-indigo-900' : 'text-nature-300'}`}>
                Meus Anúncios
            </button>
        </div>

        {/* CONTENT */}
        <div className="space-y-4 pb-20">
            {activeTab === 'market' && (
                <>
                <div className="bg-white p-3 rounded-2xl border border-nature-100 flex items-center gap-2 shadow-sm">
                    <Search size={18} className="text-nature-300 ml-2"/>
                    <input type="text" placeholder="O que você procura hoje?" className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-nature-900 placeholder:text-nature-300"/>
                </div>

                {exchanges.map((item) => (
                    <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm hover:border-indigo-200 transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold border border-white shadow-sm">
                                    {item.avatar}
                                </div>
                                <div>
                                    <h4 className="font-bold text-nature-900 text-sm">{item.owner}</h4>
                                    <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">{item.category}</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-bold uppercase">
                                {item.karma} Cr
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-nature-50/50 p-4 rounded-2xl mb-4">
                            <div className="flex-1">
                                <p className="text-[8px] font-bold uppercase text-nature-400 tracking-wider mb-0.5">OFERECE</p>
                                <p className="font-serif italic text-nature-900 leading-tight">{item.name}</p>
                            </div>
                            <ArrowRightLeft size={16} className="text-nature-300"/>
                            <div className="flex-1 text-right">
                                <p className="text-[8px] font-bold uppercase text-nature-400 tracking-wider mb-0.5">PEDE</p>
                                <p className="font-serif italic text-indigo-900 leading-tight">{item.wish}</p>
                            </div>
                        </div>

                        <button onClick={() => handlePropose(item)} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                            <MessageCircle size={14}/> Propor Troca
                        </button>
                    </div>
                ))}
                </>
            )}

            {activeTab === 'my-offers' && (
                <div className="text-center py-12 opacity-50 space-y-4">
                    <RefreshCw size={48} className="mx-auto text-nature-300"/>
                    <p className="text-sm italic">Você ainda não anunciou nenhum serviço para troca.</p>
                    <button className="text-indigo-600 font-bold text-xs uppercase tracking-widest underline">Criar Primeiro Anúncio</button>
                </div>
            )}
        </div>

      </div>
    </PortalView>
    );
};
