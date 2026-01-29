import React, { useState, useMemo } from 'react';
import { ViewState, Professional, User } from '../../types';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { PortalView, DynamicAvatar, ZenToast } from '../../components/Common';
import { useJourneyEngine } from '../../src/hooks/useJourneyEngine';
import { Play, Search, MapPin, Sparkle, Sun, Moon, Wind, Clock, Star, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { MicroJourneyModal } from './map/MicroJourneyModal';

interface MapaDaCuraProps {
    pros?: Professional[];
    isLoading?: boolean;
    user: User;
    updateUser: (u: User) => void;
}

export const MapaDaCuraView: React.FC<MapaDaCuraProps> = ({ pros = [], isLoading, user, updateUser }) => {
    const { go, selectProfessional } = useBuscadorFlow();
    const { journey, context: journeyContext } = useJourneyEngine(user);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeMicroJourney, setActiveMicroJourney] = useState<any>(null);
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);

    // Filter Pros Logic (Universal Search)
    const filteredPros = useMemo(() => {
        if (!searchQuery) return pros;
        const q = searchQuery.toLowerCase();
        return pros.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.specialty.some(s => s.toLowerCase().includes(q)) ||
            (p.location && p.location.toLowerCase().includes(q))
        );
    }, [pros, searchQuery]);

    const handleStartJourney = (j: any) => {
        // Here we could open the modal or start a specific flow
        // For now using the existing MicroJourneyModal adapter
        setActiveMicroJourney(j.category); 
    };

    return (
        <PortalView title="Mapa da Cura" subtitle="SISTEMA OPERACIONAL DA ALMA" onBack={() => go('DASHBOARD')}>
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            {activeMicroJourney && (
                <MicroJourneyModal 
                    type={activeMicroJourney} 
                    user={user} 
                    onClose={() => setActiveMicroJourney(null)} 
                    onComplete={(u) => {
                        updateUser(u);
                        setActiveMicroJourney(null);
                        setToast({ title: "Jornada Concluída", message: "Seu jardim floresce com sua dedicação." });
                    }} 
                />
            )}

            <div className="space-y-8 pb-20">
                
                {/* 1. HERO - CAMINHO DO DIA */}
                {journey && (
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-900 text-white shadow-2xl mx-2">
                        {/* Dynamic Background Art */}
                        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1519681393784-d8e5b56524dd?w=800&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                        <div className="absolute top-0 right-0 p-12 bg-gradient-to-bl from-amber-500/20 to-transparent w-full h-full"></div>

                        <div className="relative z-10 p-8 space-y-6">
                            <div className="flex items-center gap-2 opacity-80">
                                <Sparkle size={14} className="text-amber-400 animate-pulse"/> 
                                <span className="text-[10px] font-bold uppercase tracking-widest">Caminho do Dia • {journeyContext.isMorning ? 'Manhã' : 'Noite'}</span>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif italic leading-tight">{journey.hero.title}</h2>
                                <p className="text-sm text-indigo-100/80 font-medium max-w-[80%] leading-relaxed">
                                    {journey.hero.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button 
                                    onClick={() => handleStartJourney(journeyContext.isMorning ? journey.morning : journey.night)}
                                    className="px-6 py-4 bg-white text-indigo-900 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                                >
                                    <Play size={14} fill="currentColor" /> 
                                    {journey.hero.primaryAction}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SUA JORNADA HOJE (Micro-Journeys) */}
                <div className="px-4">
                    <h3 className="text-lg font-serif italic text-nature-900 mb-4 px-2">Sua Jornada Hoje</h3>
                    <div className="space-y-3">
                        {/* Morning */}
                        <div className="bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleStartJourney(journey?.morning)}>
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Sun size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-nature-800 text-sm">Manhã • Ativação</h4>
                                <p className="text-[10px] text-nature-400 font-medium">{journey?.morning.title}</p>
                            </div>
                            <div className="text-[10px] font-bold text-nature-300 bg-nature-50 px-2 py-1 rounded-lg">{journey?.morning.duration} min</div>
                            <Play size={16} className="text-nature-300" />
                        </div>

                        {/* Day */}
                        <div className="bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleStartJourney(journey?.day)}>
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Wind size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-nature-800 text-sm">Durante o dia • Pausa</h4>
                                <p className="text-[10px] text-nature-400 font-medium">{journey?.day.title}</p>
                            </div>
                            <div className="text-[10px] font-bold text-nature-300 bg-nature-50 px-2 py-1 rounded-lg">{journey?.day.duration} min</div>
                            <Play size={16} className="text-nature-300" />
                        </div>

                        {/* Night */}
                        <div className="bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleStartJourney(journey?.night)}>
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Moon size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-nature-800 text-sm">Noite • Integração</h4>
                                <p className="text-[10px] text-nature-400 font-medium">{journey?.night.title}</p>
                            </div>
                            <div className="text-[10px] font-bold text-nature-300 bg-nature-50 px-2 py-1 rounded-lg">{journey?.night.duration} min</div>
                            <Play size={16} className="text-nature-300" />
                        </div>
                    </div>
                </div>

                {/* 3. BUSCA UNIVERSAL */}
                <div className="px-4 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Busque por emoção, técnica ou guardião..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-nature-100 py-5 pl-14 pr-6 rounded-[2rem] text-sm shadow-sm focus:ring-4 focus:ring-primary-500/5 outline-none transition-all"
                        />
                    </div>
                    
                    {/* Living Filters */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {['Disponível Agora', 'Perto de mim', 'Melhor Avaliados', 'Alta Conexão'].map(filter => (
                            <button key={filter} className="whitespace-nowrap px-4 py-2 bg-white border border-nature-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-nature-500 hover:bg-nature-50 active:scale-95 transition-all">
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. LISTAGEM DE GUARDIÕES */}
                <div className="px-4 space-y-4">
                    <h3 className="text-lg font-serif italic text-nature-900 px-2">Guardiões Disponíveis</h3>
                    
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse"></div>)}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredPros.map(pro => (
                                <div key={pro.id} className="bg-white p-4 rounded-[2rem] border border-nature-50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer" onClick={() => { selectProfessional(pro.id); go('BOOKING_SELECT'); }}>
                                    <div className="relative">
                                        <DynamicAvatar user={pro} size="md" />
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                            <h4 className="font-bold text-nature-900 text-sm truncate">{pro.name}</h4>
                                            <div className="flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400"/><span className="text-[10px] font-bold text-nature-600">{pro.rating}</span></div>
                                        </div>
                                        <p className="text-[10px] text-nature-400 uppercase font-bold tracking-wider truncate mb-1">{(pro.specialty || []).slice(0,2).join(' • ')}</p>
                                        <div className="flex items-center gap-2 text-nature-300">
                                            <MapPin size={10} /> <span className="text-[9px] font-bold uppercase tracking-widest">{pro.location || 'Online'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </PortalView>
    );
};
