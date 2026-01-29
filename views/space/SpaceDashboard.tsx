import React, { useState } from 'react';
import { User, Professional, SpaceRoom, ViewState, Vacancy, Transaction, Product } from '../../types';
import { 
    Users, BarChart3, Sparkles, Activity, Briefcase, DoorOpen, Award, Clock, TrendingUp, ShoppingBag, Calendar, Wallet, Droplets, ChevronRight, AlertTriangle, Layers, Map, CheckCircle2, Zap
} from 'lucide-react';
import { PortalCard, ZenToast, Logo, DynamicAvatar } from '../../components/Common';
import { getDailyMessage } from '../../src/utils/dailyWisdom';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';

// --- NEW COMPONENTS FOR PREMIUM DASHBOARD ---

const RadianceCard = ({ score, trend }: { score: number, trend: number }) => (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-12 translate-x-12 animate-pulse-slow"></div>
        <div className="relative z-10">
             <div className="flex justify-between items-start mb-6">
                 <div>
                     <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-200">Radiance Score</p>
                        <div className="bg-emerald-500/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                            <TrendingUp size={10} className="text-emerald-300"/>
                            <span className="text-[9px] font-bold text-emerald-300">+{trend}% hoje</span>
                        </div>
                     </div>
                     <h3 className="text-5xl font-serif italic flex items-center gap-2 text-white drop-shadow-lg">{score}% <Sparkles size={24} className="text-amber-400 animate-pulse"/></h3>
                     <div className="flex gap-1 mt-3 opacity-60">
                         {[1,2,3,4,5,6,7].map(i => <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i > 5 ? 'w-2 bg-white/30' : 'w-4 bg-emerald-400'}`}></div>)}
                     </div>
                 </div>
                 <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
                     <Activity size={20} className="text-indigo-200" />
                 </div>
             </div>
             
             <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 hover:bg-white/15 transition-colors group/vib">
                 <p className="text-[9px] font-bold uppercase text-indigo-200 mb-2 flex justify-between">
                     Vibração do Dia <span className="text-white/60">12:00 PM</span>
                 </p>
                 <p className="text-sm text-white italic leading-relaxed mb-4">"Você é o guardião da sua própria energia. Mantenha o foco na luz."</p>
                 <button className="w-full py-3 bg-indigo-500/40 hover:bg-indigo-500/60 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white border border-indigo-400/30 flex items-center justify-center gap-2 transition-all">
                     <Zap size={12} className="fill-white"/> Ativar Ritual Sugerido
                 </button>
             </div>
        </div>
    </div>
);

const OperationalGrid = ({ teamSize, revenue, go }: any) => (
    <div className="grid grid-cols-2 gap-4">
        <div onClick={() => go('PROS_LIST')} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users size={20} />
            </div>
            <p className="text-[9px] font-bold uppercase text-nature-400 tracking-widest mb-1">Equipe Viva</p>
            <h4 className="text-2xl font-bold text-nature-900">{teamSize} <span className="text-sm font-normal text-nature-400">Almas</span></h4>
            <div className="mt-2 text-[9px] text-nature-500 font-medium flex flex-col gap-0.5">
                <span>• 3 Guardiões</span>
                <span>• 12 Facilitadores</span>
            </div>
        </div>
        <div onClick={() => go('FINANCE_OVERVIEW')} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <BarChart3 size={20} />
            </div>
            <p className="text-[9px] font-bold uppercase text-nature-400 tracking-widest mb-1">Fluxo Hoje</p>
            <h4 className="text-2xl font-bold text-nature-900">R$ {revenue}</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                <TrendingUp size={10} /> +18% vs ontem
            </div>
        </div>
    </div>
);

const AlertCenter = () => (
    <div className="bg-amber-50 rounded-[2.5rem] p-6 border border-amber-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
        <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0 animate-pulse">
                <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-bold text-nature-900 mb-1">Atenção do Santuário</h4>
                <ul className="space-y-1 mb-4">
                    <li className="text-xs text-nature-700 flex items-center gap-2">• <span className="font-bold">3 pacientes</span> aguardam acompanhamento</li>
                    <li className="text-xs text-nature-700 flex items-center gap-2">• <span className="font-bold">1 Guardião</span> com carga elevada</li>
                </ul>
                <button className="px-4 py-2 bg-nature-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:shadow-xl active:scale-95 transition-all">
                    Resolver Agora
                </button>
            </div>
        </div>
    </div>
);

const DailyMissionCard = () => (
    <div className="bg-white rounded-[2.5rem] p-6 border border-nature-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-nature-900 uppercase tracking-widest flex items-center gap-2">
                <Award size={16} className="text-indigo-500"/> Missão do Dia
            </h4>
            <span className="text-[10px] font-bold text-nature-300">1/3 Completado</span>
        </div>
        <div className="space-y-3">
            {[
                { label: 'Acolher 3 novas almas', done: true },
                { label: 'Finalizar 2 prontuários', done: false },
                { label: 'Ativar ritual das 21h', done: false },
            ].map((item, i) => (
                <div key={i} className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${item.done ? 'bg-indigo-50 border-indigo-100' : 'bg-transparent border-nature-50 hover:border-nature-200'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${item.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-nature-300'}`}>
                        {item.done && <CheckCircle2 size={12} />}
                    </div>
                    <span className={`text-xs font-medium ${item.done ? 'text-indigo-900 line-through opacity-60' : 'text-nature-700'}`}>{item.label}</span>
                </div>
            ))}
        </div>
        <button className="w-full mt-4 py-3 bg-nature-50 text-nature-900 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-nature-100 transition-colors">
            Iniciar Jornada
        </button>
    </div>
);

const MapPreviewWidget = ({ go }: any) => (
    <div className="relative h-24 bg-nature-900 rounded-[2.5rem] overflow-hidden flex items-center justify-between px-8 text-white group cursor-pointer" onClick={() => go('DASHBOARD')}>
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800')] bg-cover bg-center"></div>
        <div className="relative z-10">
            <h4 className="font-serif italic text-xl">Mapa Vivo</h4>
            <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> 467 Almas em Sintonia</p>
        </div>
        <div className="relative z-10 w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
            <Map size={20} />
        </div>
    </div>
);

// --- MAIN COMPONENT ---

export const SpaceDashboard: React.FC<{ 
    user: User, 
    rooms?: SpaceRoom[],
    team?: Professional[],
    vacancies?: Vacancy[],
    transactions?: Transaction[],
    myProducts?: Product[],
}> = ({ user, rooms = [], team = [], vacancies = [], transactions = [], myProducts = [] }) => {
    const { go } = useSantuarioFlow();
    
    // Calculated Revenue
    const revenue = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="flex flex-col animate-in fade-in w-full bg-[#fcfdfc] min-h-screen pb-32">
            
            {/* Header Minimalism */}
            <header className="flex items-center justify-between mt-8 mb-6 px-6 relative">
                 <div className="flex items-center gap-3">
                     <div className="relative pointer-events-none">
                        <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-lg" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center animate-pulse"><Award size={8} className="text-white"/></div>
                     </div>
                     <div>
                         <p className="text-[9px] font-bold text-nature-400 uppercase tracking-[0.2em]">Painel de Comando</p>
                         <h2 className="text-xl font-serif italic text-nature-900">Santuário Viva360</h2>
                     </div>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={() => go('AGENDA_OVERVIEW')} className="p-2.5 bg-white rounded-xl border border-nature-100 text-nature-400 shadow-sm active:scale-95 transition-all"><Calendar size={18}/></button>
                     <button onClick={() => {}} className="p-2.5 bg-nature-900 text-white rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all"><Layers size={18}/></button>
                 </div>
            </header>

            <div className="px-4 space-y-6">
                
                {/* 1. ESSENCE LAYER */}
                <RadianceCard score={94} trend={3} />

                {/* 2. OPERATIONAL LAYER */}
                <OperationalGrid teamSize={team.length || 15} revenue={revenue || '1.400'} go={go} />

                {/* 3. ALERTS & MISSION */}
                <div className="space-y-4">
                    <AlertCenter />
                    <DailyMissionCard />
                </div>

                {/* 4. MAP LAYER */}
                <MapPreviewWidget go={go} />

                {/* 5. PORTAL GRID (Quick Access) */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                     <div onClick={() => go('ROOMS_STATUS')} className="bg-white p-3 rounded-2xl border border-nature-100 text-center shadow-sm active:scale-95 transition-all">
                         <DoorOpen size={20} className="mx-auto text-indigo-500 mb-1"/>
                         <p className="text-[7px] font-bold uppercase text-nature-400">Salas</p>
                     </div>
                     <div onClick={() => go('VAGAS_LIST')} className="bg-white p-3 rounded-2xl border border-nature-100 text-center shadow-sm active:scale-95 transition-all">
                         <Briefcase size={20} className="mx-auto text-emerald-500 mb-1"/>
                         <p className="text-[7px] font-bold uppercase text-nature-400">Vagas</p>
                     </div>
                     <div onClick={() => go('MARKETPLACE_MANAGE')} className="bg-white p-3 rounded-2xl border border-nature-100 text-center shadow-sm active:scale-95 transition-all">
                         <ShoppingBag size={20} className="mx-auto text-amber-500 mb-1"/>
                         <p className="text-[7px] font-bold uppercase text-nature-400">Bazar</p>
                     </div>
                     <div onClick={() => go('FINANCE_OVERVIEW')} className="bg-white p-3 rounded-2xl border border-nature-100 text-center shadow-sm active:scale-95 transition-all">
                         <Wallet size={20} className="mx-auto text-rose-500 mb-1"/>
                         <p className="text-[7px] font-bold uppercase text-nature-400">Caixa</p>
                     </div>
                </div>

            </div>
        </div>
    );
} 
