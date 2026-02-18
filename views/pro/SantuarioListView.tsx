import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Building2, MapPin, Star, ChevronRight, Search, Plus, Sparkles, Shield, Users, Loader2 } from 'lucide-react';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';

import { api } from '../../services/api';

interface SantuarioItem {
    id: string;
    name: string;
    address: string;
    city: string;
    rating: number;
    guardiansCount: number;
    status: 'active' | 'pending' | 'invited';
    image: string;
    specialties: string[];
}

export const SantuarioListView: React.FC<{ user: User }> = ({ user }) => {
    const { go, back, notify} = useGuardiaoFlow();
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const [santuarios, setSantuarios] = useState<SantuarioItem[]>([
        {
            id: 's1',
            name: 'Espaço Gaia',
            address: 'Rua das Flores, 123',
            city: 'São Paulo, SP',
            rating: 4.8,
            guardiansCount: 12,
            status: 'active',
            image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400',
            specialties: ['Yoga', 'Meditação', 'Terapia Holística']
        },
        {
            id: 's2',
            name: 'Centro Luz Interior',
            address: 'Av. da Harmonia, 456',
            city: 'Florianópolis, SC',
            rating: 4.9,
            guardiansCount: 8,
            status: 'active',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400',
            specialties: ['Reiki', 'Constelação Familiar']
        },
        {
            id: 's3',
            name: 'Templo Serenidade',
            address: 'Rua do Silêncio, 78',
            city: 'Curitiba, PR',
            rating: 4.6,
            guardiansCount: 5,
            status: 'invited',
            image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=400',
            specialties: ['Acupuntura', 'Fitoterapia']
        }
    ]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.spaces.list();
                if (data?.length) setSantuarios(data);
            } catch (e) { /* use mock */ }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const filtered = santuarios.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase())
    );

    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
        active: { label: 'Ativo', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
        pending: { label: 'Pendente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
        invited: { label: 'Convite', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
    };

    return (
        <div className="min-h-screen bg-[#f8faf9] pb-32">
            
            <header className="bg-gradient-to-br from-nature-900 to-emerald-900 px-6 pt-14 pb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <button onClick={back} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white mb-6 active:scale-95 transition-all">←</button>
                <div className="flex items-center gap-3 mb-2">
                    <Building2 size={24} className="text-emerald-300" />
                    <h1 className="text-3xl font-serif italic text-white">Meus Santuários</h1>
                </div>
                <p className="text-emerald-200/70 text-xs font-bold uppercase tracking-widest">Espaços onde sua luz se manifesta</p>
                
                <div className="mt-6 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
                    <Search size={16} className="text-white/50" />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar santuário..." 
                        className="bg-transparent flex-1 text-white text-sm outline-none placeholder:text-white/30"
                    />
                </div>
            </header>

            <div className="px-4 -mt-4 space-y-4">
                {filtered.map(s => {
                    const cfg = statusConfig[s.status];
                    return (
                        <div 
                            key={s.id}
                            onClick={() => go('SANTUARIO_PROFILE')}
                            className="bg-white rounded-[2.5rem] overflow-hidden border border-nature-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <div className="relative h-36">
                                <img src={s.image} className="w-full h-full object-cover" alt={s.name || 'Santuário'} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{s.name}</h3>
                                        <p className="text-white/70 text-[10px] flex items-center gap-1"><MapPin size={10} /> {s.city}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.color}`}>
                                        {cfg.label}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                        <span className="text-sm font-bold text-nature-900">{s.rating}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users size={14} className="text-nature-400" />
                                        <span className="text-xs text-nature-500">{s.guardiansCount} guardiões</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {s.specialties.slice(0, 2).map((sp, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-nature-50 rounded-lg text-[9px] font-bold text-nature-500 uppercase">{sp}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="text-center py-16">
                        <Building2 size={48} className="text-nature-200 mx-auto mb-4" />
                        <p className="text-nature-400 text-sm font-bold">Nenhum santuário encontrado</p>
                    </div>
                )}

                <button 
                    onClick={() => {
                        notify('Busca Ativada', 'Procurando santuários próximos à sua frequência...', 'info');
                    }}
                    className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Search size={16} /> Descobrir Novos Santuários
                </button>
            </div>
        </div>
    );
};
