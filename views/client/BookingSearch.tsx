
import React, { useState, useMemo } from 'react';
import { ViewState, Professional, User } from '../../types';
import { Activity, Brain, Sparkle, Search, MapPin, Clock, ChevronRight, Star, ShieldCheck, Play, ArrowUpRight } from 'lucide-react';
import { DynamicAvatar, PortalView, ZenToast } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { SPECIALTIES } from '../../constants'; 
import { MicroJourneyModal } from './map/MicroJourneyModal';

export const BookingSearch: React.FC<{ pros?: Professional[], isLoading?: boolean, user: User, updateUser: (u: User) => void }> = ({ pros = [], isLoading = false, user, updateUser }) => {
    const { go, selectProfessional } = useBuscadorFlow();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Tudo");
    const [activeJourney, setActiveJourney] = useState<'Corpo' | 'Mente' | 'Espírito' | null>(null);
    const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

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
        setToast({ title: "Jardim Nutrido", message: "Sua micro-jornada fortaleceu sua essência." });
    };

    // Determine Orientation based on "Mock" random logic or user state (Using random for demo feel)
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
    <PortalView title="Mapa da Cura" subtitle="SINTONIZE SEU DOM" onBack={() => go('DASHBOARD')}>
      {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
      
      {activeJourney && (
          <MicroJourneyModal type={activeJourney} user={user} onClose={() => setActiveJourney(null)} onComplete={handleJourneyComplete} />
      )}

      <div className="space-y-8 pb-12">
        
        {/* Block 1: Orientação Viva */}
        <div className={`rounded-[2.5rem] p-8 space-y-4 relative overflow-hidden ${orientation.color}`}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkle size={100} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkle size={16} className="animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Caminho Sugerido</span>
                </div>
                <h3 className="text-2xl font-serif italic mb-2">{orientation.title}</h3>
                <p className="text-sm font-medium opacity-80 leading-relaxed max-w-[80%]">{orientation.desc}</p>
                
                <button 
                    onClick={() => setActiveJourney(orientation.type)}
                    className="mt-6 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2"
                >
                    <Play size={14} fill="currentColor" /> Iniciar Trilha
                </button>
            </div>
        </div>

        {/* Block 2: Onde você precisa de luz? (Agora portais para Micro-Jornadas) */}
        <div>
           <div className="flex items-center justify-between px-4 mb-4">
               <h3 className="text-lg font-serif italic text-nature-900">Micro-Jornadas</h3>
               <span className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Guiadas • 3 min</span>
           </div>
           <div className="grid grid-cols-3 gap-3 px-2">
              {[
                { label: 'Corpo', icon: Activity, color: 'bg-rose-100 text-rose-600', hover: 'hover:bg-rose-200' },
                { label: 'Mente', icon: Brain, color: 'bg-indigo-100 text-indigo-600', hover: 'hover:bg-indigo-200' },
                { label: 'Espírito', icon: Sparkle, color: 'bg-amber-100 text-amber-600', hover: 'hover:bg-amber-200' }
              ].map(area => (
                <button 
                    key={area.label} 
                    onClick={() => setActiveJourney(area.label as any)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] transition-all duration-300 ${area.color} ${area.hover} group`}
                >
                   <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/40 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform"><area.icon size={20}/></div>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{area.label}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Block 3: Search */}
        <div className="relative group mx-2">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-300 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Busque por técnica ou guardião..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-nature-100 py-5 pl-14 pr-6 rounded-[2rem] text-sm shadow-sm focus:ring-4 focus:ring-primary-500/5 outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-2">
          {(Array.isArray(SPECIALTIES) ? ["Tudo", ...SPECIALTIES.slice(0, 10)] : ["Tudo"]).map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat ? 'bg-nature-900 text-white border-nature-900 shadow-md' : 'bg-white text-nature-400 border-nature-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Block 4: Guardiões Recomendados (Agora contextual) */}
        <div className="space-y-4 px-2">
          <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Guardiões da Luz</h4>
                <div className="flex items-center gap-1 text-[9px] font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-1 rounded-lg">
                    <Sparkle size={10} />
                    Recomendados para você
                </div>
          </div>

          {isLoading ? (
            <div className="space-y-4"><div className="h-32 w-full bg-white rounded-3xl animate-pulse"></div><div className="h-32 w-full bg-white rounded-3xl animate-pulse"></div></div>
          ) : filteredPros.map(pro => (
              <button 
                key={pro.id} 
                onClick={() => {
                  selectProfessional(pro.id);
                  go('BOOKING_SELECT');
                }}
                className="w-full bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group text-left relative overflow-hidden"
              >
                {/* Dynamic Recommendation Badge Logic (Mock) */}
                {orientation.type === 'Mente' && pro.specialty?.includes('Psicologia') && (
                     <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">Ideal para hoje</div>
                )}

                <div className="relative">
                   <DynamicAvatar user={pro} size="lg" className="border-2 border-primary-50" />
                   {pro.isVerified && <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white"><ShieldCheck size={10} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-nature-900 text-sm truncate">{pro.name}</h4>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg"><Star size={10} className="text-amber-500 fill-amber-500" /><span className="text-[10px] font-bold text-amber-700">{pro.rating}</span></div>
                  </div>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1 truncate">{(pro.specialty || []).join(', ')}</p>
                  <div className="flex items-center gap-4 mt-3 text-nature-400">
                     <div className="flex items-center gap-1"><MapPin size={10} /><span className="text-[9px] font-bold uppercase">{pro.location || 'Online'}</span></div>
                     <div className="flex items-center gap-1"><Clock size={10} /><span className="text-[9px] font-bold uppercase">60 min</span></div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-nature-50 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                    <ArrowUpRight size={16} />
                </div>
              </button>
          ))}
        </div>
      </div>
    </PortalView>
    );
};
