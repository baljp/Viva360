import React, { useState } from 'react';
import { User, Professional, SpaceRoom, ViewState, Vacancy, Transaction, Product } from '../../types';
import { 
    Users, BarChart3, Sparkles, Activity, Briefcase, DoorOpen, Award, Calendar, TrendingUp, ShoppingBag, Wallet, Layers, Map, CheckCircle2, Zap, Globe, Shield, Heart, Search, Settings, Bell, MessageCircle, X, Info, Plus, FileText, ChevronRight
} from 'lucide-react';
import { PortalCard, ZenToast, Logo, DynamicAvatar, NotificationDrawer } from '../../components/Common';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';

// --- COMPONENTS ---

const RadianceHero = ({ score, trend, onOpenModal }: { score: number, trend: number, onOpenModal: () => void }) => {
    const { go } = useSantuarioFlow();
    return (
        <button onClick={() => go('RADIANCE_DRILLDOWN')} className="w-full text-left bg-gradient-to-br from-indigo-900 via-purple-900 to-nature-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden group mb-8 active:scale-95 transition-all outline-none">
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
                    <p className="text-[9px] font-bold uppercase text-indigo-200 tracking-wider">Ver detalhes</p>
                 </div>
             </div>
        </div>
    </button>
    );
};

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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2">Harmonia das Energias</p>
                    <h3 className="text-3xl font-serif italic">Radiância Vital</h3>
                </div>
                <div className="p-8 space-y-6">
                    {[
                        { label: 'Altares em Fluxo', value: 88, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Abundância Manifestada', value: 92, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { label: 'União dos Guardiões', value: 95, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Ecos de Gratidão', value: 98, color: 'text-rose-500', bg: 'bg-rose-50' },
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
        <div className="grid grid-cols-2 gap-4">
            <PortalCard 
                id="portal-agenda"
                title="Agenda Viva" 
                subtitle="RITMOS DO TEMPLO" 
                icon={Calendar} 
                bgImage="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600"
                onClick={() => go('AGENDA_OVERVIEW')}
            />
            <PortalCard 
                id="portal-rooms"
                title="Altares" 
                subtitle="GEOMETRIA SAGRADA" 
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
                     <h4 className="font-bold text-nature-900 text-lg">Buscadores</h4>
                     <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Portal de Almas</p>
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
        {(() => {
            const handleExportCycle = () => {
                const blob = new Blob(['Mock Financial Data Export'], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `fechamento_viva360_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
            };
            return (
                <>
        <QuickStat label="Abundância (Mês)" value={`R$ ${revenue}`} icon={TrendingUp} color="bg-emerald-500" />
        
        <div className="grid grid-cols-2 gap-4">
             <div onClick={() => go('FINANCE_OVERVIEW')} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-emerald-200 transition-all">
                <Wallet size={32} className="text-emerald-500" />
                <div>
                    <h4 className="font-bold text-nature-900">Tesouro</h4>
                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Fluxo da Egrégora</p>
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
             <div onClick={() => go('AUDIT_LOG')} className="bg-nature-900 text-white p-6 rounded-[2.5rem] shadow-lg flex flex-col justify-between cursor-pointer relative overflow-hidden group">
                  <div className="relative z-10">
                      <Shield size={24} className="text-indigo-300 mb-4"/>
                      <h4 className="font-bold text-lg leading-tight">Proteção</h4>
                      <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Audit Trail</p>
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

        <div onClick={handleExportCycle} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-200 transition-all group">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={20}/></div>
                 <div>
                     <h4 className="font-bold text-nature-900">Encerramento de Ciclo</h4>
                     <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Suma da Abundância (CSV)</p>
                 </div>
             </div>
             <button onClick={(event) => { event.stopPropagation(); handleExportCycle(); }} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">Exportar</button>
        </div>
                </>
            );
        })()}
    </div>
);

const GrowthTab = ({ go }: any) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div onClick={() => go('VAGAS_LIST')} className="bg-indigo-900 p-8 rounded-[3.5rem] shadow-xl flex items-center gap-6 cursor-pointer hover:bg-black transition-all group relative overflow-hidden">
             <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
             <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white"><Briefcase size={32}/></div>
             <div className="flex-1 relative z-10">
                 <h4 className="text-2xl font-serif italic text-white leading-tight">Mural de Vagas</h4>
                 <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mt-1">Expansão de Guardiões</p>
             </div>
             <div className="px-4 py-2 bg-white text-indigo-900 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-400 group-hover:text-white transition-colors">Ver Mural</div>
        </div>

        <div onClick={() => go('MARKETPLACE_MANAGE')} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
             <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600"><ShoppingBag size={22}/></div>
             <div className="flex-1">
                 <h4 className="font-bold text-nature-900 text-lg">Bazar do Santuário</h4>
                 <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Produtos & Serviços</p>
             </div>
             <ChevronRight size={16} className="text-nature-300"/>
        </div>

        <div onClick={() => go('PREDICTIVE_OCCUPANCY')} className="bg-indigo-900 p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4 cursor-pointer hover:bg-black transition-all group">
             <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white"><Zap size={22} className="animate-pulse"/></div>
             <div className="flex-1">
                 <h4 className="font-bold text-white">Sintonização Espacial</h4>
                 <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Visão do Futuro (IA Phoenix)</p>
             </div>
             <ChevronRight size={20} className="text-white opacity-40 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all"/>
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

    // Mock Notifications
    const [notifications, setNotifications] = useState([
        { id: '1', title: 'Manutenção', message: 'Ar condicionado Sala Gaia revisado.', type: 'alert', read: false },
        { id: '2', title: 'Novo Guardião', message: 'Mestre Carlos aceitou o convite.', type: 'ritual', read: true },
    ]);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };
    
    // Dynamic Radiance Score Calculation
    const revenue = Transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const teamEffect = Math.min(30, team.length * 5); // Up to 30 points for team
    const revenueEffect = Math.min(40, (revenue / 1000) * 10); // Up to 40 points for revenue
    const baseline = 30; // Baseline harmony
    const radianceScore = Math.floor(baseline + teamEffect + revenueEffect);
    const trend = 2.4 + (team.length * 0.1); // Dynamic trend

    return (
        <div className="flex flex-col animate-in fade-in w-full bg-[#f8faf9] min-h-screen pb-32">
            <NotificationDrawer 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                notifications={notifications as any} 
                onMarkAsRead={handleMarkAsRead} 
                onMarkAllRead={handleMarkAllRead} 
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
                <RadianceHero score={radianceScore} trend={trend} onOpenModal={() => {}} />

                {/* TABS NAVIGATION */}
                <div className="flex p-1.5 bg-white rounded-[2rem] border border-nature-100 shadow-sm mb-6 sticky top-4 z-20">
                    <button 
                        onClick={() => setActiveTab('ops')}
                        className={`flex-1 py-3 rounded-3xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'ops' ? 'bg-nature-900 text-white shadow-md' : 'text-nature-400 hover:bg-nature-50'}`}
                    >
                        Ritmos do Templo
                    </button>
                    <button 
                        onClick={() => setActiveTab('admin')}
                        className={`flex-1 py-3 rounded-3xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-nature-900 text-white shadow-md' : 'text-nature-400 hover:bg-nature-50'}`}
                    >
                        Abundância & Zelo
                    </button>
                    <button 
                        onClick={() => setActiveTab('growth')}
                        className={`flex-1 py-3 rounded-3xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'growth' ? 'bg-nature-900 text-white shadow-md' : 'text-nature-400 hover:bg-nature-50'}`}
                    >
                        Emanação Coletiva
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
