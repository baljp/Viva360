import React, { useState } from 'react';
import { User, Professional, SpaceRoom, ViewState, Vacancy, Transaction, Product } from '../../types';
import { 
    Users, BarChart3, Sparkles, Activity, Briefcase, DoorOpen, Award, Calendar, TrendingUp, ShoppingBag, Wallet, Layers, Map, CheckCircle2, Zap, Globe, Shield, Heart, Search, Settings, Bell, MessageCircle, X, Info, Plus
} from 'lucide-react';
import { PortalCard, ZenToast, Logo, DynamicAvatar, NotificationDrawer } from '../../components/Common';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';

// --- COMPONENTS ---

const RadianceHero = ({ score, trend, onClick }: { score: number, trend: number, onClick: () => void }) => (
    <button onClick={onClick} className="w-full text-left bg-gradient-to-br from-indigo-900 via-purple-900 to-nature-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden group mb-8 active:scale-95 transition-all outline-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-12 translate-x-12 animate-pulse-slow"></div>
        <div className="relative z-10 flex justify-between items-end">
             <div>
                 <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-200">Radiance Score</p>
                    <div className="bg-emerald-500/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <TrendingUp size={10} className="text-emerald-300"/>
                        <span className="text-[9px] font-bold text-emerald-300">+{trend}%</span>
                    </div>
                 </div>
                 <h3 className="text-6xl font-serif italic text-white drop-shadow-lg leading-none">{score} <span className="text-2xl not-italic opacity-50">/100</span></h3>
             </div>
             <div className="text-right">
                 <div className="flex -space-x-3 mb-2 justify-end">
                     {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-900 bg-indigo-200"></div>)}
                     <div className="w-8 h-8 rounded-full border-2 border-indigo-900 bg-nature-800 text-white flex items-center justify-center text-[10px] font-bold">+12</div>
                 </div>
                 <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Info size={10} />
                    <p className="text-[8px] font-bold uppercase text-indigo-200 tracking-wider">Ver detalhes</p>
                 </div>
             </div>
        </div>
    </button>
);

const RadianceDetailsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 duration-500">
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2">Breakdown do Score</p>
                    <h3 className="text-3xl font-serif italic">Radiance Vitality</h3>
                </div>
                <div className="p-8 space-y-6">
                    {[
                        { label: 'Ocupação de Altares', value: 88, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Faturamento vs Meta', value: 92, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { label: 'Harmonia da Equipe', value: 95, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Satisfação das Almas', value: 98, color: 'text-rose-500', bg: 'bg-rose-50' },
                    ].map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-3xl border border-nature-50">
                            <div>
                                <h4 className="font-bold text-nature-900 text-sm">{m.label}</h4>
                                <div className="flex gap-1 mt-1">
                                    {[1,2,3,4,5].map(dot => (
                                        <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= (m.value/20) ? m.color.replace('text-', 'bg-') : 'bg-nature-100'}`}></div>
                                    ))}
                                </div>
                            </div>
                            <div className={`${m.bg} ${m.color} px-3 py-1 rounded-full font-bold text-sm tracking-tighter`}>{m.value}%</div>
                        </div>
                    ))}
                    <button onClick={onClose} className="w-full py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">Fechar</button>
                </div>
            </div>
        </div>
    );
};

const QuickStat = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-3xl border border-nature-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 text-opacity-100`}>
             <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
        <div>
            <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">{label}</p>
            <h4 className="text-lg font-bold text-nature-900">{value}</h4>
        </div>
    </div>
);

// --- TABS CONTENT ---

const OperationsTab = ({ go }: any) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => go('ROOM_CREATE')} className="w-full py-5 bg-gradient-to-r from-amber-200 to-amber-100 text-amber-900 rounded-[2.5rem] font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm border border-amber-200 hover:scale-[1.02] transition-transform">
             <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center"><Plus size={16}/></div>
             Consagrar Novo Altar
        </button>
        <div className="grid grid-cols-2 gap-4">
            <PortalCard 
                id="portal-agenda"
                title="Agenda Viva" 
                subtitle="FLUXO DIÁRIO" 
                icon={Calendar} 
                bgImage="https://images.unsplash.com/photo-1506784926709-b219a7501d2a?q=80&w=600"
                onClick={() => go('AGENDA_OVERVIEW')}
            />
            <PortalCard 
                id="portal-rooms"
                title="Salas" 
                subtitle="ESPAÇOS FÍSICOS" 
                icon={DoorOpen} 
                bgImage="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600"
                onClick={() => go('ROOMS_STATUS')}
                delay={100}
            />
        </div>
        <div onClick={() => go('PATIENTS_LIST')} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex justify-between items-center cursor-pointer hover:border-indigo-200 transition-all group">
             <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Heart size={24}/></div>
                 <div>
                     <h4 className="font-bold text-nature-900 text-lg">Pacientes</h4>
                     <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Base de Dados Viva</p>
                 </div>
             </div>
             <div className="text-right">
                 <span className="text-2xl font-bold text-nature-900">450</span>
                 <p className="text-[9px] text-emerald-500 font-bold uppercase">Active</p>
             </div>
        </div>

    </div>
);

const ManagementTab = ({ go, revenue, teamSize }: any) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <QuickStat label="Faturamento (Mês)" value={`R$ ${revenue}`} icon={TrendingUp} color="bg-emerald-500" />
        
        <div className="grid grid-cols-2 gap-4">
             <div onClick={() => go('FINANCE_OVERVIEW')} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-emerald-200 transition-all">
                <Wallet size={32} className="text-emerald-500" />
                <div>
                    <h4 className="font-bold text-nature-900">Finanças</h4>
                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Fluxo de Caixa</p>
                </div>
            </div>
            <div onClick={() => go('PROS_LIST')} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-indigo-200 transition-all">
                <Users size={32} className="text-indigo-500" />
                <div>
                    <h4 className="font-bold text-nature-900">Equipe ({teamSize})</h4>
                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Guardiões</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div onClick={() => go('GOVERNANCE')} className="bg-nature-900 text-white p-6 rounded-[2.5rem] shadow-lg flex flex-col justify-between cursor-pointer relative overflow-hidden group">
                  <div className="relative z-10">
                      <Shield size={24} className="text-indigo-300 mb-4"/>
                      <h4 className="font-bold text-lg leading-tight">Governança</h4>
                      <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Compliance</p>
                  </div>
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
             </div>
             <div onClick={() => go('TEAM_SUMMON')} className="bg-rose-50 text-rose-900 p-6 rounded-[2.5rem] border border-rose-100 shadow-sm flex flex-col justify-between cursor-pointer relative overflow-hidden hover:bg-rose-100 transition-all">
                  <div className="relative z-10">
                      <Zap size={24} className="text-rose-500 mb-4"/>
                      <h4 className="font-bold text-lg leading-tight">Convocar</h4>
                      <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest mt-1">Alerta Círculo</p>
                  </div>
             </div>
        </div>
    </div>
);

const GrowthTab = ({ go }: any) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-r from-amber-100 to-orange-50 p-6 rounded-[2.5rem] border border-amber-200 flex items-center justify-between cursor-pointer hover:shadow-lg transition-all" onClick={() => go('TEAM_INVITE')}>
            <div>
                 <h4 className="font-serif italic text-2xl text-amber-900">Expandir Egrégora</h4>
                 <p className="text-xs text-amber-700 mt-1 max-w-[200px]">Atraia novos guardiões e impulsione a vibração do espaço.</p>
                 <button className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Convidar Guardião</button>
            </div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Globe size={32} className="text-amber-500" />
            </div>
        </div>

        <div onClick={() => go('VAGAS_LIST')} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
             <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Briefcase size={22}/></div>
             <div className="flex-1">
                 <h4 className="font-bold text-nature-900">Mural de Vagas</h4>
                 <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Recrutamento</p>
             </div>
             <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">3 Abertas</div>
        </div>

        <div onClick={() => go('MARKETPLACE_MANAGE')} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
             <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600"><ShoppingBag size={22}/></div>
             <div className="flex-1">
                 <h4 className="font-bold text-nature-900">Bazar do Santuário</h4>
                 <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Produtos & Serviços</p>
             </div>
        </div>

        <div onClick={() => go('REPUTATION_OVERVIEW')} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
             <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Award size={22}/></div>
             <div className="flex-1">
                 <h4 className="font-bold text-nature-900">Reputação</h4>
                 <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Avaliações & Feedback</p>
             </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

export const SpaceDashboard: React.FC<{ 
    user: User, 
    rooms?: SpaceRoom[],
    team?: Professional[],
    vacancies?: Vacancy[],
    Transactions?: Transaction[],
    myProducts?: Product[],
}> = ({ user, rooms = [], team = [], vacancies = [], Transactions = [], myProducts = [] }) => {
    const { go } = useSantuarioFlow();
    const [activeTab, setActiveTab] = useState<'ops' | 'admin' | 'growth'>('ops');
    const [showNotifications, setShowNotifications] = useState(false);
    const [isRadianceModalOpen, setIsRadianceModalOpen] = useState(false);

    // Mock Notifications
    const [notifications, setNotifications] = useState([
        { id: '1', title: 'Manutenção', message: 'Ar condicionado Sala Gaia revisado.', type: 'alert', read: false },
        { id: '2', title: 'Novo Guardião', message: 'Mestre Carlos aceitou o convite.', type: 'ritual', read: true },
    ]);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };
    
    // Calculated Revenue
    const revenue = Transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="flex flex-col animate-in fade-in w-full bg-[#f8faf9] min-h-screen pb-32">
            <NotificationDrawer 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                notifications={notifications as any} 
                onMarkAsRead={handleMarkAsRead} 
                onMarkAllRead={() => {}} 
            />
            
            {/* Header */}
            <header className="flex items-center justify-between mt-8 mb-6 px-6 relative">
                 <div className="flex items-center gap-3">
                     <DynamicAvatar user={user} size="md" className="border-4 border-white shadow-lg" />
                     <div>
                         <p className="text-[9px] font-bold text-nature-400 uppercase tracking-[0.2em]">Santuário</p>
                         <h2 className="text-xl font-serif italic text-nature-900 leading-none">{user.name}</h2>
                     </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => go('CHAT_LIST')} className="p-2.5 bg-white rounded-xl border border-nature-100 text-nature-400 shadow-sm active:scale-95 transition-all outline-none"><MessageCircle size={18}/></button>
                    <button onClick={() => setShowNotifications(true)} className="p-2.5 bg-white rounded-xl border border-nature-100 text-nature-400 shadow-sm active:scale-95 transition-all relative">
                        <Bell size={18}/>
                        {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white"></span>}
                    </button>
                    <button onClick={() => go('GOVERNANCE')} className="p-2.5 bg-white rounded-xl border border-nature-100 text-nature-400 shadow-sm active:scale-95 transition-all outline-none"><Settings size={18}/></button>
                 </div>
            </header>

            <div className="px-4">
                <RadianceHero score={94} trend={3.2} onClick={() => setIsRadianceModalOpen(true)} />
                <RadianceDetailsModal isOpen={isRadianceModalOpen} onClose={() => setIsRadianceModalOpen(false)} />

                {/* TABS NAVIGATION */}
                <div className="flex p-1.5 bg-white rounded-[2rem] border border-nature-100 shadow-sm mb-6 sticky top-4 z-20">
                    <button 
                        onClick={() => setActiveTab('ops')}
                        className={`flex-1 py-3 rounded-3xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'ops' ? 'bg-nature-900 text-white shadow-md' : 'text-nature-400 hover:bg-nature-50'}`}
                    >
                        Operações
                    </button>
                    <button 
                        onClick={() => setActiveTab('admin')}
                        className={`flex-1 py-3 rounded-3xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-nature-900 text-white shadow-md' : 'text-nature-400 hover:bg-nature-50'}`}
                    >
                        Gestão
                    </button>
                    <button 
                        onClick={() => setActiveTab('growth')}
                        className={`flex-1 py-3 rounded-3xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'growth' ? 'bg-nature-900 text-white shadow-md' : 'text-nature-400 hover:bg-nature-50'}`}
                    >
                        Expansão
                    </button>
                </div>

                {/* TAB CONTENT */}
                <div className="min-h-[400px]">
                    {activeTab === 'ops' && <OperationsTab go={go} />}
                    {activeTab === 'admin' && <ManagementTab go={go} revenue={revenue} teamSize={team.length} />}
                    {activeTab === 'growth' && <GrowthTab go={go} />}
                </div>
            </div>
        </div>
    );
} 
