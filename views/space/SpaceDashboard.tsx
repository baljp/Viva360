
import React, { useState } from 'react';
import { User, Professional, SpaceRoom } from '../../types';
import { ViewState } from '../../types';
import { 
    Users, BarChart3, Sparkles, Activity, Briefcase, DoorOpen, Award, Clock, TrendingUp, ShoppingBag, Calendar, Wallet, Droplets 
} from 'lucide-react';
import { PortalCard, ZenToast } from '../../components/Common';
import { getDailyMessage } from '../../src/utils/dailyWisdom';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';

// Extracted from SpaceViews.tsx
export const SpaceDashboard: React.FC<{ 
    user: User, 
    data: any 
}> = ({ user, data }) => {
    const { team = [], rooms = [] } = data || {};
    const { go } = useSantuarioFlow();

    return (
        <div className="flex flex-col animate-in fade-in w-full bg-[#fcfdfc] min-h-screen pb-24">
            <header className="flex items-center justify-between mt-8 mb-8 px-6 flex-none">
                <div className="flex items-center gap-4">
                    <div className="relative group" onClick={() => {}}>
                      <img src={user.avatar} className="w-14 h-14 rounded-[1.5rem] border-4 border-white shadow-xl object-cover cursor-pointer group-hover:scale-110 transition-transform" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-900 border-4 border-white rounded-full flex items-center justify-center shadow-md animate-pulse"><Award size={10} className="text-white" /></div>
                    </div>
                    <div><p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">Santuário Viva360</p><h2 className="text-2xl font-serif italic text-nature-900 leading-none mt-1">{user.name.split(' ')[0]}</h2></div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => go('AGENDA_OVERVIEW')} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all"><Calendar size={20}/></button>
                    <button onClick={() => go('FINANCE_OVERVIEW')} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-indigo-600 active:scale-95 transition-all"><BarChart3 size={20}/></button>
                </div>
            </header>

            <div className="px-4 space-y-8">
                <div className="bg-indigo-900 rounded-[3.5rem] p-8 text-white shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                           <div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-200">Radiance Score</p><h3 className="text-4xl font-serif italic flex items-center gap-2">94% <Sparkles size={20} className="text-amber-400"/></h3></div>
                           <TrendingUp size={24} className="text-emerald-400" />
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                            <p className="text-[8px] font-bold uppercase text-indigo-200 mb-1">Vibração do Dia</p>
                            <p className="text-xs text-white italic leading-relaxed">"{getDailyMessage()}"</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => go('PROS_LIST')} className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-left hover:bg-white/20 transition-all"><p className="text-[8px] font-bold uppercase text-indigo-300">Equipe Ativa</p><span className="text-xl font-bold">{team.length} Mestres</span></button>
                            <button onClick={() => go('FINANCE_OVERVIEW')} className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-left hover:bg-white/20 transition-all"><p className="text-[8px] font-bold uppercase text-indigo-300">Fluxo Hoje</p><span className="text-xl font-bold">R$ 1.4k</span></button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <PortalCard title="Altares" subtitle="GESTÃO DE SALAS" icon={DoorOpen} bgImage="https://images.unsplash.com/photo-1595514020176-8740771009cd?q=80&w=600" onClick={() => go('ROOMS_STATUS')} />
                    <PortalCard title="Equipe" subtitle="CONEXÃO MESTRES" icon={Users} bgImage="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600" onClick={() => go('PROS_LIST')} delay={100} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <PortalCard title="Expansão" subtitle="RECRUTAMENTO" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600" onClick={() => go('VAGAS_LIST')} delay={200} />
                    <PortalCard title="Abundância" subtitle="FINANCEIRO" icon={Wallet} bgImage="https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=600" onClick={() => go('FINANCE_OVERVIEW')} delay={300} />
                </div>

                <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-5">
                       <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center"><Droplets size={32} /></div>
                       <div>
                          <h4 className="font-serif italic text-xl">Jardim Comunitário</h4>
                          <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mt-1">Saúde Coletiva: 88%</p>
                       </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Estável</span>
                        <div className="flex gap-1 mt-1">
                            <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                            <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                            <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                            <div className="w-1 h-3 bg-emerald-200 rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="pb-8">
                     <PortalCard 
                        title="Bazar do Hub" 
                        subtitle="LOJA" 
                        icon={ShoppingBag} 
                        bgImage="https://images.unsplash.com/photo-1472851294608-415105a16863?q=80&w=600" 
                        onClick={() => go('MARKETPLACE_MANAGE')} 
                        delay={400} 
                    />
                </div>

                <div className="space-y-4 pb-8">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em] px-2 flex justify-between items-center">Monitor de Altares <span className="text-emerald-600 text-[9px] font-bold animate-pulse">AO VIVO</span></h4>
                    <div className="grid grid-cols-1 gap-3">
                        {rooms.slice(0, 3).map(room => (
                             <div key={room.id} className="bg-white p-5 rounded-3xl border border-nature-100 flex items-center justify-between group shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${room.status === 'occupied' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}><Activity size={18} className={room.status === 'occupied' ? 'animate-pulse' : ''} /></div>
                                    <div><h4 className="text-xs font-bold text-nature-900">{room.name}</h4><p className="text-[9px] text-nature-400 uppercase font-bold">{room.status === 'occupied' ? `Com ${room.currentOccupant}` : 'Disponível'}</p></div>
                                </div>
                                {room.status === 'occupied' && <div className="text-right"><span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1"><Clock size={10}/> 45min</span></div>}
                                {room.status === 'available' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                            </div>
                        ))}
                        <button onClick={() => go('ROOMS_STATUS')} className="w-full py-4 text-center text-[10px] font-bold text-nature-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Ver Todas as Salas</button>
                    </div>
                </div>
            </div>
        </div>
    );
} 
