import React, { useState } from 'react';
import { Users, Search, Timer, CheckCircle, Star, ChevronRight, UserPlus, Zap, Crown, Shield, Sprout, Share2, Calendar } from 'lucide-react';
import { ViewState, Professional } from '../../types';
import { PortalView, DynamicAvatar, ZenToast } from '../../components/Common';

interface SpaceTeamProps {
    view: ViewState;
    setView: (v: ViewState) => void;
    team: Professional[];
    flow: any;
}

// Mock schedule data generator
const getNextSession = () => {
    const times = ['14:30', '15:00', '16:15', '17:00', '18:30'];
    return times[Math.floor(Math.random() * times.length)];
};

export const SpaceTeam: React.FC<SpaceTeamProps> = ({ view, setView, team, flow }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);

    const activeMestres = team.filter((p: any) => p.role === 'Mestre' || p.karma > 800).length;
    const activeGuardioes = team.length - activeMestres;
    const activeInSession = team.filter((p: any) => p.isOccupied).length;

    const handleInvite = (type: string) => {
        setToast({ title: 'Link Gerado', message: `Convite para ${type} copiado.` });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSummon = (group: string) => {
        setToast({ title: 'Convocação Enviada', message: `Notificação enviada para ${group} disponíveis.` });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <PortalView title="Círculo de Guardiões" subtitle="GESTÃO DE EQUIPE" onBack={() => flow.go('EXEC_DASHBOARD')}>
            {toast && <ZenToast toast={{...toast, type: 'success'}} onClose={() => setToast(null)} />}
            
            <div className="space-y-6">
                {/* 1. HEADER: STATUS DO CÍRCULO */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                             <Users size={20} />
                        </div>
                        <h3 className="font-serif italic text-xl text-nature-900">Círculo Ativo</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm"><Crown size={14} className="text-amber-500"/> {activeMestres} Mestres</div>
                             <div className="flex items-center gap-2 text-nature-600 text-xs font-medium"><Shield size={14} className="text-indigo-400"/> {activeGuardioes} Guardiões</div>
                         </div>
                         <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2 text-nature-600 text-xs font-medium"><Sprout size={14} className="text-emerald-400"/> 12 Facilitadores</div>
                             <div className="flex items-center gap-2 text-rose-600 font-bold text-xs"><div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div> {activeInSession} Em sessão</div>
                         </div>
                    </div>
                </div>

                {/* 2. BUSCA & FILTROS */}
                <div className="space-y-3">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="🔍 Buscar guardião, mestre ou facilitador..." 
                            className="w-full bg-white border border-nature-100 py-4 pl-14 pr-6 rounded-2xl text-xs font-medium shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-nature-700 placeholder:text-nature-300" 
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {['Dom', 'Disponibilidade', 'Nível'].map(f => (
                            <button key={f} className="px-4 py-2 bg-white border border-nature-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-nature-500 hover:bg-nature-50 hover:text-indigo-600 transition-colors whitespace-nowrap">
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. LISTAGEM DO CÍRCULO */}
                <div className="space-y-3">
                    {team.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((pro: any) => (
                        <div key={pro.id} className="w-full bg-white p-4 rounded-[2rem] border border-nature-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <DynamicAvatar user={pro} size="md" className="border-2 border-white shadow-sm" />
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${pro.isOccupied ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {pro.isOccupied ? <Timer size={10}/> : <CheckCircle size={10}/>}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-nature-900 text-xs">{pro.name}</h4>
                                        {pro.karma > 800 && <Crown size={10} className="text-amber-500 fill-amber-500"/>}
                                    </div>
                                    <p className="text-[9px] text-nature-400 font-bold uppercase mt-0.5">{pro.role === 'Mestre' ? 'Mestre' : 'Guardião'} · {pro.specialty[0]}</p>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${pro.isOccupied ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                        <span className={`text-[9px] font-bold ${pro.isOccupied ? 'text-rose-500' : 'text-emerald-600'}`}>
                                            {pro.isOccupied ? 'Em sessão' : 'Disponível'}
                                        </span>
                                        {!pro.isOccupied && <span className="text-[9px] text-nature-300 font-medium ml-1">· {getNextSession()}</span>}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-nature-200 group-hover:text-indigo-500 transition-colors" />
                        </div>
                    ))}
                </div>

                {/* 4. EXPANDIR O CÍRCULO */}
                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-[2.5rem] border border-indigo-100/50">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><UserPlus size={14}/> Expandir o Círculo</h4>
                    <p className="text-xs text-nature-600 mb-4 leading-relaxed">Convide novos talentos para fortalecer a egrégora.</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Guardião', icon: Shield },
                            { label: 'Facilitador', icon: Sprout },
                            { label: 'Mestre', icon: Crown }
                        ].map((role) => (
                            <button key={role.label} onClick={() => flow.go('TEAM_INVITE')} className="bg-white p-3 rounded-2xl border border-indigo-50 flex flex-col items-center gap-2 hover:border-indigo-200 hover:shadow-md transition-all active:scale-95">
                                <role.icon size={18} className="text-indigo-500" />
                                <span className="text-[9px] font-bold text-indigo-900 uppercase">{role.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 5. CONVOCAÇÃO RÁPIDA */}
                <div className="bg-nature-900 p-6 rounded-[2.5rem] text-white">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Zap size={14}/> Convocar Círculo</h4>
                    <p className="text-xs text-nature-300 mb-4 opacity-80">Chame membros disponíveis para apoio em tempo real.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => flow.go('TEAM_SUMMON')} className="py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all">Chamar Guardiões</button>
                        <button onClick={() => flow.go('TEAM_SUMMON')} className="py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all">Chamar Mestres</button>
                    </div>
                </div>

                {/* 6. AGENDA DO CÍRCULO */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar size={14}/> Próximos Atendimentos</h4>
                    <div className="space-y-3">
                        {[
                            { name: 'Lucas Paz', time: '14:30', type: 'Reiki' },
                            { name: 'Ana Luz', time: '15:00', type: 'Cura Energética' },
                            { name: 'João Sol', time: '16:15', type: 'Mentoria' }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-nature-50 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-nature-50 flex items-center justify-center text-xs font-bold text-nature-600">{item.name[0]}</div>
                                    <div>
                                        <h5 className="text-xs font-bold text-nature-900">{item.name}</h5>
                                        <p className="text-[9px] text-nature-400 uppercase">{item.type}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-nature-50 text-nature-600 rounded-lg text-[10px] font-bold">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </PortalView>
    );
};
