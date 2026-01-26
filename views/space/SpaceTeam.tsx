import React from 'react';
import { Users, Search, Timer, CheckCircle, Star, ChevronRight, UserPlus } from 'lucide-react';
import { ViewState, Professional } from '../../types';
import { PortalView, DynamicAvatar } from '../../components/Common';

interface SpaceTeamProps {
    view: ViewState;
    setView: (v: ViewState) => void;
    team: Professional[];
}

export const SpaceTeam: React.FC<SpaceTeamProps> = ({ view, setView, team }) => {
    return (
        <PortalView title="Círculo de Guardiões" subtitle="GESTÃO DE EQUIPE" onBack={() => setView(ViewState.SPACE_HOME)}>
            <div className="space-y-8">
                <div className="bg-indigo-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <Users size={140} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                    <div className="relative z-10 grid grid-cols-2 gap-8">
                            <div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-300 mb-2">Tribo Ativa</p><h3 className="text-4xl font-serif italic">{team.length} Mestres</h3></div>
                            <div className="flex flex-col justify-end items-end"><div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div><span className="text-[10px] font-bold uppercase tracking-widest">{team.filter((p: any) => p.isOccupied).length} em Ritual</span></div></div>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input type="text" placeholder="Buscar mestre pelo dom ou nome..." className="w-full bg-white border border-nature-100 py-4 pl-14 pr-6 rounded-2xl text-sm shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5" />
                </div>

                <div className="space-y-4">
                    {team.map((pro: any) => (
                        <button key={pro.id} className="w-full bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between group text-left transition-all active:scale-95">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <DynamicAvatar user={pro} size="lg" className="border-2 border-indigo-50" />
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${pro.isOccupied ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{pro.isOccupied ? <Timer size={10}/> : <CheckCircle size={10}/>}</div>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-nature-900 text-sm truncate">{pro.name}</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase mt-0.5 truncate">{pro.specialty[0]}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center gap-1 text-amber-500"><Star size={8} fill="currentColor"/><span className="text-[9px] font-bold">{pro.rating}</span></div>
                                        <span className="text-[8px] text-nature-300">•</span>
                                        <span className="text-[9px] text-nature-400 font-bold uppercase">{pro.totalHealingHours}h de Luz</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-nature-200 group-hover:text-indigo-500 transition-colors" />
                        </button>
                    ))}
                    <button onClick={() => setView(ViewState.SPACE_RECRUITMENT)} className="w-full py-6 border-2 border-dashed border-indigo-100 rounded-[2.5rem] text-indigo-600 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-indigo-50 mt-4 transition-all"><UserPlus size={18} /> Expandir o Círculo</button>
                </div>
            </div>
        </PortalView>
    );
};
