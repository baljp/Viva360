
import React, { useState, useMemo } from 'react';
import { Professional, User } from '../../types';
import { Activity, Brain, Sparkle, Search, MapPin, Clock, ChevronRight, Star, ShieldCheck, Play, ArrowUpRight } from 'lucide-react';
import { DynamicAvatar, PortalView } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { SPECIALTIES } from '../../constants'; 
import { MicroJourneyModal } from './map/MicroJourneyModal';

export const BookingSearch: React.FC<{ pros?: Professional[], isLoading?: boolean, user: User, updateUser: (u: User) => void }> = ({ pros = [], isLoading = false, user, updateUser }) => {
    const { go, selectProfessional, notify} = useBuscadorFlow();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Tudo");
    const [activeJourney, setActiveJourney] = useState<'Corpo' | 'Mente' | 'Espírito' | null>(null);

    const filteredPros = useMemo(() => {
        if (!Array.isArray(pros)) return [];
        return pros.filter(p => 
          (selectedCategory === "Tudo" || (p.specialty?.includes(selectedCategory))) &&
          (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.specialty?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
        );
    }, [pros, selectedCategory, searchQuery]);

    const handleJourneyComplete = (updatedUser: User) => {
        updateUser(updatedUser);
        setActiveJourney(null);
        notify('Jardim Nutrido', 'Sua micro-jornada fortaleceu sua essência.', 'info');
    };

    const orientation = useMemo(() => {
        const types = ['Corpo', 'Mente', 'Espírito'];
        const seed = new Date().getDate() % 3;
        const target = types[seed] as 'Corpo' | 'Mente' | 'Espírito';
        return {
            type: target,
            title: target === 'Corpo' ? 'Vitalidade Física' : target === 'Mente' ? 'Clareza Mental' : 'Conexão Espiritual',
            desc: target === 'Corpo' ? 'Seu corpo pede movimento e enraizamento hoje.' : target === 'Mente' ? 'Sua mente busca silêncio e foco.' : 'Seu espírito anseia por gratidão.',
            color: target === 'Corpo' ? 'bg-rose-100 text-rose-800' : target === 'Mente' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
        };
    }, []);

    return (
        <PortalView 
            title="Mapa da Cura" 
            subtitle="SINTONIZE SEU DOM" 
            onBack={() => go('DASHBOARD')}
            heroImage="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800"
        >
            
            {activeJourney && (
                <MicroJourneyModal type={activeJourney} user={user} onClose={() => setActiveJourney(null)} onComplete={handleJourneyComplete} />
            )}

            <div className="space-y-10 pb-20 px-1">
                {/* Orientation Viva */}
                <div className={`rounded-[3rem] p-8 space-y-4 relative overflow-hidden shadow-elegant ${orientation.color}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkle size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkle size={16} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Sintonização de Hoje</span>
                        </div>
                        <h3 className="text-3xl font-serif italic mb-2 leading-tight">{orientation.title}</h3>
                        <p className="text-sm font-medium opacity-80 leading-relaxed max-w-[85%]">{orientation.desc}</p>
                        
                        <button 
                            onClick={() => setActiveJourney(orientation.type)}
                            className="btn-secondary mt-6 border-transparent bg-white/40 backdrop-blur-md"
                        >
                            <Play size={14} fill="currentColor" className="mr-2" /> Iniciar Trilha
                        </button>
                    </div>
                </div>

                {/* Search Block */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary-500/5 blur-2xl rounded-[2.5rem] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-nature-300 group-focus-within:text-nature-900 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Busque por técnica ou guardião..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-nature-100 h-16 pl-16 pr-6 rounded-[2.5rem] text-sm focus:ring-4 focus:ring-primary-500/5 focus:border-nature-300 outline-none transition-all shadow-sm group-focus-within:shadow-md"
                    />
                </div>

                {/* Categories */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-2">
                       <h3 className="text-[10px] font-black text-nature-900 uppercase tracking-[0.3em]">Micro-Jornadas</h3>
                       <span className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Guiadas • 3 min</span>
                   </div>
                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Corpo', icon: Activity, color: 'bg-rose-100 text-rose-600', hover: 'hover:bg-rose-200' },
                        { label: 'Mente', icon: Brain, color: 'bg-indigo-100 text-indigo-600', hover: 'hover:bg-indigo-200' },
                        { label: 'Espírito', icon: Sparkle, color: 'bg-amber-100 text-amber-600', hover: 'hover:bg-amber-200' }
                      ].map(area => {
                        const IconComponent = area.icon;
                        return (
                            <button 
                                key={area.label} 
                                onClick={() => setActiveJourney(area.label as any)}
                                className={`flex flex-col items-center gap-3 p-5 rounded-[2.5rem] transition-all duration-300 ${area.color} ${area.hover} group shadow-sm active:scale-95`}
                            >
                               <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/40 backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform">
                                   <IconComponent size={20}/>
                               </div>
                               <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{area.label}</span>
                            </button>
                        );
                      })}
                   </div>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-nature-900 uppercase tracking-[0.3em]">Guardiões Disponíveis</h3>
                        <span className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">{filteredPros.length} Resultados</span>
                    </div>

                    <div className="grid gap-4">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-32 w-full bg-white rounded-[2.5rem] animate-pulse border border-nature-50"></div>
                            ))
                        ) : filteredPros.map(pro => (
                            <button
                                key={pro.id}
                                onClick={() => {
                                    selectProfessional(pro.id);
                                    go('BOOKING_SELECT');
                                }}
                                className="w-full bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-6 hover:shadow-xl hover:-translate-y-1 transition-all group text-left relative overflow-hidden active:scale-[0.98]"
                            >
                                {/* Recommendation Tag */}
                                {orientation.type === 'Mente' && pro.specialty?.includes('Psicologia') && (
                                     <div className="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-[0.15em] shadow-lg animate-in slide-in-from-right duration-500">Ideal Hoje</div>
                                )}

                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary-50 shadow-md relative z-10">
                                        <img src={pro.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pro.name}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={pro.name} />
                                    </div>
                                    {pro.isVerified && (
                                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg z-20 border-2 border-white">
                                            <ShieldCheck size={12} />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-serif italic text-xl text-nature-900 truncate leading-none">{pro.name}</h4>
                                        <div className="w-1 h-1 rounded-full bg-nature-200"></div>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star size={10} fill="currentColor" />
                                            <span className="text-[10px] font-black tracking-tighter">{pro.rating || '5.0'}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest truncate">{(pro.specialty || []).slice(0, 2).join(' • ')}</p>
                                    <div className="mt-3 flex items-center gap-4 text-nature-400">
                                        <div className="flex items-center gap-1.5"><MapPin size={10} className="text-nature-300"/><span className="text-[9px] font-bold uppercase tracking-widest">{pro.location || 'Online'}</span></div>
                                        <div className="flex items-center gap-1.5"><Clock size={10} className="text-nature-300"/><span className="text-[9px] font-bold uppercase tracking-widest">60 min</span></div>
                                    </div>
                                </div>

                                <div className="w-10 h-10 rounded-full bg-nature-50 flex items-center justify-center text-nature-300 group-hover:bg-nature-900 group-hover:text-white transition-all shadow-inner">
                                    <ArrowUpRight size={18} />
                                </div>
                            </button>
                        ))}
                        
                        {!isLoading && filteredPros.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-nature-100 px-10">
                                <Search size={48} className="mx-auto text-nature-100 mb-4" />
                                <p className="text-nature-400 italic font-serif text-lg leading-tight mb-2">Nenhum guardião sintonizado</p>
                                <p className="text-[10px] text-nature-300 font-bold uppercase tracking-widest max-w-[200px] mx-auto">Tente ajustar seus filtros ou mude sua busca espiritual.</p>
                                <button onClick={() => { setSearchQuery(""); setSelectedCategory("Tudo"); }} className="mt-8 btn-secondary inline-flex w-auto mx-auto border-dashed">Resetar Filtros</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PortalView>
    );
};
