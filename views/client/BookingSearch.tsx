
import React, { useState, useMemo } from 'react';
import { ViewState, Professional } from '../../types';
import { Activity, Brain, Sparkle, Search, MapPin, Clock, ChevronRight, Star, ShieldCheck } from 'lucide-react';
import { DynamicAvatar, PortalView } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { SPECIALTIES } from '../../constants';

export const BookingSearch: React.FC<{ data: { pros: Professional[], isLoading: boolean } }> = ({ data }) => {
    const { pros, isLoading } = data;
    const { go } = useBuscadorFlow();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Tudo");

    const filteredPros = useMemo(() => {
        return pros.filter(p => 
          (selectedCategory === "Tudo" || p.specialty.includes(selectedCategory)) &&
          (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.specialty.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
        );
    }, [pros, selectedCategory, searchQuery]);

    return (
    <PortalView title="Mapa da Cura" subtitle="SINTONIZE SEU DOM" onBack={() => go('DASHBOARD')}>
      <div className="space-y-8">
        <div className="bg-nature-100 rounded-[3.5rem] p-8 text-center space-y-6 border border-nature-200">
           <h3 className="text-xl font-serif italic text-nature-900">Onde você precisa de luz hoje?</h3>
           <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Corpo', icon: Activity, color: 'bg-rose-100 text-rose-600' },
                { label: 'Mente', icon: Brain, color: 'bg-indigo-100 text-indigo-600' },
                { label: 'Espírito', icon: Sparkle, color: 'bg-amber-100 text-amber-600' }
              ].map(area => (
                <button key={area.label} className="flex flex-col items-center gap-3 active:scale-90 transition-transform">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center ${area.color} shadow-sm`}><area.icon size={28}/></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest">{area.label}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-300 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Busque por técnica ou nome..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-nature-100 py-5 pl-14 pr-6 rounded-[2rem] text-sm shadow-sm focus:ring-4 focus:ring-primary-500/5 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {["Tudo", ...SPECIALTIES.slice(0, 10)].map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat ? 'bg-nature-900 text-white border-nature-900 shadow-md' : 'bg-white text-nature-400 border-nature-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Guardiões Recomendados</h4>
          {isLoading ? (
            <div className="space-y-4"><div className="h-32 w-full bg-white rounded-3xl animate-pulse"></div><div className="h-32 w-full bg-white rounded-3xl animate-pulse"></div></div>
          ) : filteredPros.map(pro => (
              <button 
                key={pro.id} 
                onClick={() => go('BOOKING_SELECT')}
                className="w-full bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group text-left"
              >
                <div className="relative">
                   <DynamicAvatar user={pro} size="lg" className="border-2 border-primary-50" />
                   {pro.isVerified && <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white"><ShieldCheck size={10} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-nature-900 text-sm truncate">{pro.name}</h4>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg"><Star size={10} className="text-amber-500 fill-amber-500" /><span className="text-[10px] font-bold text-amber-700">{pro.rating}</span></div>
                  </div>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1 truncate">{pro.specialty.join(', ')}</p>
                  <div className="flex items-center gap-4 mt-3 text-nature-400">
                     <div className="flex items-center gap-1"><MapPin size={10} /><span className="text-[9px] font-bold uppercase">{pro.location || 'Online'}</span></div>
                     <div className="flex items-center gap-1"><Clock size={10} /><span className="text-[9px] font-bold uppercase">60 min</span></div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-nature-200 group-hover:text-primary-500" />
              </button>
          ))}
        </div>
      </div>
    </PortalView>
    );
};
