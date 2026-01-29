import React, { useState } from 'react';
import { ViewState, Professional, User } from '../../types';
import { Zap, History, Calendar, Flower, Briefcase, Wallet, ShoppingBag, Sparkles, Plus, Stethoscope, Layers, ChevronRight, Bell, MessageCircle } from 'lucide-react';
import { DynamicAvatar, PortalCard, ZenToast, Logo, NotificationDrawer } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';
import { api } from '../../services/api';

export const ProDashboard: React.FC<{ 
    user: Professional, 
    setView: (v: ViewState) => void, 
    updateUser: (u: User) => void,
    data?: any
}> = ({ user, setView, updateUser, data }) => {
    const { go, notify } = useGuardiaoFlow();
    const [activeTab, setActiveTab] = useState<'consultorio' | 'expansao'>('consultorio');
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Mock Notifications
    const [notifications, setNotifications] = useState([
        { id: '1', title: 'Paciente Check-in', message: 'Ana Silva completou o ritual diário.', type: 'ritual', read: false },
        { id: '2', title: 'Proposta de Troca', message: 'Nova oferta no Escambo Rede Viva.', type: 'alert', read: false },
    ]);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
    <div className="flex flex-col animate-in fade-in w-full bg-[#fcfdfc] min-h-screen pb-32">
        <NotificationDrawer 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                notifications={notifications as any} 
                onMarkAsRead={handleMarkAsRead} 
                onMarkAllRead={() => {}} 
        />
        <header className="flex items-center justify-between mt-8 mb-6 px-6 flex-none relative overflow-hidden">
            <Logo size="xl" className="absolute -top-10 -left-10 opacity-[0.03] rotate-12 pointer-events-none" />
            <div className="flex items-center gap-4">
                <button onClick={() => go('SETTINGS')} className="relative group">
                    <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-xl group-hover:scale-105 transition-transform" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center z-20 pointer-events-none shadow-md animate-pulse"><Zap size={10} className="text-white fill-white" /></div>
                </button>
                <div>
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em] mb-0.5">Bom Despertar,</p>
                    <h2 className="text-2xl font-serif italic text-nature-900 leading-none">Mestre {user.name.split(' ')[0]}</h2>
            </div>
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={() => go('CHAT_LIST')} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all outline-none"><MessageCircle size={20}/></button>
                 <button onClick={() => setShowNotifications(true)} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all outline-none relative">
                     <Bell size={20}/>
                     {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
                 </button>
                 <button onClick={() => go('AGENDA_VIEW')} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all outline-none"><Calendar size={20}/></button>
            </div>
        </header>

        {/* TABS DE NAVEGAÇÃO SUPERIOR */}
        <div className="px-6 mb-6">
            <div className="flex p-1 bg-nature-50 rounded-2xl">
                <button 
                    onClick={() => setActiveTab('consultorio')} 
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'consultorio' ? 'bg-white shadow-sm text-nature-900' : 'text-nature-400 hover:text-nature-600'}`}
                >
                    <Stethoscope size={14}/> Consultório
                </button>
                <button 
                    onClick={() => setActiveTab('expansao')} 
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'expansao' ? 'bg-white shadow-sm text-nature-900' : 'text-nature-400 hover:text-nature-600'}`}
                >
                    <Layers size={14}/> Expansão
                </button>
            </div>
        </div>

        <div className="px-4 space-y-8 min-h-[50vh]">
            
            {/* VIEW: CONSULTÓRIO */}
            {activeTab === 'consultorio' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    <div id="hero-agenda" className="relative h-72 rounded-[3.5rem] overflow-hidden shadow-xl group cursor-pointer" onClick={() => go('AGENDA_VIEW')}>
                        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-110" />
                        <div className="absolute inset-0 bg-nature-900/60 transition-colors group-hover:bg-nature-900/40"></div>
                        <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 bg-emerald-500 text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit animate-pulse">Hoje • 14:00</div>
                                <h3 className="text-3xl font-serif italic leading-none">Minha Agenda</h3>
                                <p className="text-[10px] text-primary-200 font-bold uppercase tracking-[0.2em] opacity-80">3 Sessões programadas</p>
                            </div>
                        </div>
                        <div className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                            <Calendar size={20} className="text-white"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <PortalCard id="portal-patients" title="Meus Pacientes" subtitle="JARDIM" icon={Flower} bgImage="https://images.unsplash.com/photo-1598155523122-38423bb4d6c1?q=80&w=600" onClick={() => go('PATIENTS_LIST')} />
                    </div>


                </div>
            )}

            {/* VIEW: EXPANSÃO */}
            {activeTab === 'expansao' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-gradient-to-br from-indigo-900 to-primary-900 rounded-[3.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                         <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md"><Briefcase size={20}/></div>
                                <div>
                                    <h4 className="text-lg font-serif italic">Oportunidades</h4>
                                    <p className="text-[9px] font-bold uppercase opacity-70 tracking-widest">Santuários buscando Guardiões</p>
                                </div>
                            </div>
                            <button onClick={() => go('VAGAS_LIST')} className="bg-white text-indigo-900 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                Explorar Vagas
                            </button>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <PortalCard id="portal-network" title="Rede Viva" subtitle="COMUNIDADE" icon={Zap} bgImage="https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?q=80&w=600" onClick={() => go('TRIBE_PRO')} />
                        <PortalCard id="portal-finance" title="Abundância" subtitle="FINANÇAS" icon={Wallet} bgImage="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=600" onClick={() => go('FINANCIAL_DASHBOARD')} />
                    </div>

                    <PortalCard 
                        id="portal-marketplace"
                        title="Alquimia" 
                        subtitle="MEU BAZAR" 
                        icon={ShoppingBag} 
                        bgImage="https://images.unsplash.com/photo-1472851294608-415105a16863?q=80&w=600" 
                        onClick={() => go('ESCAMBO_MARKET')} 
                    />



                    <div className="bg-emerald-50 rounded-[2.5rem] p-6 text-emerald-900 border border-emerald-100 flex items-center justify-between cursor-pointer active:scale-95 transition-all" onClick={async () => {
                        const updatedUser = { ...user, karma: (user.karma || 0) + 50 };
                        updateUser(updatedUser); 
                        await api.users.update(updatedUser); 
                        notify("Bênção Global Ativada", "Você enviou luz para todos os buscadores.", "success");
                    }}>
                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-emerald-100/50 rounded-2xl flex items-center justify-center text-emerald-600"><Sparkles size={20}/></div>
                             <div>
                                 <h4 className="text-sm font-bold">Abençoar Rede</h4>
                                 <p className="text-[9px] uppercase tracking-wider opacity-70">Doe 50 Karma</p>
                             </div>
                        </div>
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"><Plus size={14}/></div>
                    </div>
                </div>
            )}

        </div>
    </div>
    );
};
