import React from 'react';
import { ViewState, Professional, User } from '../../types';
import { Zap, History, Calendar, Flower, Briefcase, Wallet, ShoppingBag, Sparkles, Plus } from 'lucide-react';
import { DynamicAvatar, PortalCard, ZenToast } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';

export const ProDashboard: React.FC<{ 
    user: Professional, 
    setView: (v: ViewState) => void, 
    updateUser: (u: User) => void,
    setToast: (t: { title: string, message: string } | null) => void,
    data?: any
}> = ({ user, setView, updateUser, setToast, data }) => {
    const { go } = useGuardiaoFlow();

    return (
    <div className="flex flex-col animate-in fade-in w-full bg-[#fcfdfc] min-h-screen pb-24">
        <header className="flex items-center justify-between mt-8 mb-8 px-6 flex-none">
            <div className="flex items-center gap-4">
                <button onClick={() => setView(ViewState.SETTINGS)} className="relative group">
                    <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-xl group-hover:scale-105 transition-transform" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center z-20 pointer-events-none shadow-md animate-pulse"><Zap size={10} className="text-white fill-white" /></div>
                </button>
                <div><p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">Bom Despertar,</p><h2 className="text-2xl font-serif italic text-nature-900 leading-none mt-1">Mestre {user.name.split(' ')[0]}</h2></div>
            </div>
            <button onClick={() => go('AGENDA_VIEW')} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all outline-none"><Calendar size={20}/></button>
        </header>

        <div className="px-4 space-y-8">
            <div className="relative h-80 rounded-[3.5rem] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => go('AGENDA_VIEW')}>
                <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-nature-900 via-nature-900/40 to-transparent"></div>
                <div className="absolute inset-x-8 bottom-8 flex justify-between items-end text-white">
                    <div className="space-y-2">
                         <div className="flex items-center gap-2 bg-emerald-500 text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit animate-pulse">Próximo Ritual • 14:00</div>
                        <h3 className="text-4xl font-serif italic leading-none">Agenda</h3>
                        <p className="text-[10px] text-primary-200 font-bold uppercase tracking-[0.2em]">3 Sessões Hoje</p>
                    </div>
                   <button className="w-16 h-16 bg-white text-nature-900 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all hover:bg-primary-50"><Calendar size={24} className="ml-1" /></button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <PortalCard title="Jardim" subtitle="PACIENTES" icon={Flower} bgImage="https://images.unsplash.com/photo-1598155523122-38423bb4d6c1?q=80&w=600" onClick={() => go('PATIENTS_LIST')} />
                <PortalCard title="Alquimia" subtitle="REDE" icon={Zap} bgImage="https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?q=80&w=600" onClick={() => go('TRIBE_PRO')} delay={100} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <PortalCard title="Crescimento" subtitle="OPORTUNIDADES" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600" onClick={() => go('VAGAS_LIST')} delay={200} />
                <PortalCard title="Abundância" subtitle="FINANÇAS" icon={Wallet} bgImage="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=600" onClick={() => go('FINANCIAL_DASHBOARD')} delay={300} />
            </div>

            <div className="bg-emerald-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => {
                setToast({ title: "Bênção Global Ativada", message: "Você enviou luz para todos os buscadores. +50 Pontos de Luz." });
                updateUser({ ...user, karma: (user.karma || 0) + 50 });
            }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 group-hover:scale-150 transition-transform duration-700 blur-[60px] opacity-20"></div>
                <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"><Sparkles className="text-emerald-400" size={28} /></div>
                        <div>
                            <h4 className="text-xl font-serif italic">Abençoar Sementes</h4>
                            <p className="text-[10px] font-bold uppercase text-emerald-300 tracking-widest mt-1">Recupere jardins da comunidade</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20 group-hover:rotate-12 transition-transform"><Plus size={20} /></div>
                </div>
            </div>

            <div className="pb-8">
                 <PortalCard 
                    title="Meu Bazar" 
                    subtitle="LOJA" 
                    icon={ShoppingBag} 
                    bgImage="https://images.unsplash.com/photo-1472851294608-415105a16863?q=80&w=600" 
                    onClick={() => go('ESCAMBO_MARKET')} 
                    delay={400} 
                />
            </div>
        </div>
    </div>
    );
};
