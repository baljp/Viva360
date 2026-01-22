import React, { useState } from 'react';
import { Search, MapPin, Star, Heart, Activity, Sparkles, X, ChevronRight, Home } from 'lucide-react';
import { Professional } from '../types';
import { api } from '../services/api';
import { DynamicAvatar } from './Common';

interface AdvancedSearchProps {
    searchType: 'professionals' | 'products';
    onClose: () => void;
    onSelectProfessional: (pro: Professional) => void;
}

export default function AdvancedSearchScreen({ searchType, onClose, onSelectProfessional }: AdvancedSearchProps) {
    const [activeTab, setActiveTab] = useState<'guardians' | 'sanctuaries' | 'emotions'>('guardians');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Mock data for search simulation
    const EMOTIONS = [
        { id: 'e1', name: 'Ansiedade', color: 'bg-indigo-100 text-indigo-700' },
        { id: 'e2', name: 'Estresse', color: 'bg-rose-100 text-rose-700' },
        { id: 'e3', name: 'Tristeza', color: 'bg-blue-100 text-blue-700' },
        { id: 'e4', name: 'Falta de Foco', color: 'bg-amber-100 text-amber-700' },
        { id: 'e5', name: 'Insônia', color: 'bg-purple-100 text-purple-700' },
        { id: 'e6', name: 'Cansaço Físico', color: 'bg-orange-100 text-orange-700' },
        { id: 'e7', name: 'Desconexão', color: 'bg-teal-100 text-teal-700' },
        { id: 'e8', name: 'Irritabilidade', color: 'bg-red-100 text-red-700' },
        { id: 'e9', name: 'Medo', color: 'bg-gray-100 text-gray-700' },
        { id: 'e10', name: 'Luto', color: 'bg-slate-100 text-slate-700' },
    ];

    const SANCTUARIES = [
        { id: 's1', name: 'Santuário Tambaú', location: 'João Pessoa, PB', rating: 4.9, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=200' },
        { id: 's2', name: 'Espaço Luz', location: 'Recife, PE', rating: 4.8, image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=200' },
    ];

    const handleSearch = async (term: string) => {
        setQuery(term);
        if (!term) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        
        // Simulate API call
        setTimeout(async () => {
            if (activeTab === 'guardians') {
                const pros = await api.professionals.list();
                const filtered = pros.filter(p => p.name.toLowerCase().includes(term.toLowerCase()) || p.specialty.some(s => s.toLowerCase().includes(term.toLowerCase())));
                setResults(filtered);
            } else if (activeTab === 'sanctuaries') {
                const filtered = SANCTUARIES.filter(s => s.name.toLowerCase().includes(term.toLowerCase()));
                setResults(filtered);
            } else {
                // Emotional Search Logic: Map emotion to specialties
                const emotionMap: Record<string, string[]> = {
                    'Ansiedade': ['Meditação', 'Yoga', 'Psicologia'],
                    'Estresse': ['Massagem', 'Acupuntura', 'Reiki'],
                    'Insônia': ['Aromaterapia', 'Meditação'],
                    'Cansaço Físico': ['Massagem', 'Fisioterapia'],
                    // ... others
                };
                
                const relatedSpecialties = emotionMap[term] || [];
                const pros = await api.professionals.list();
                
                // If term matches an emotion, filter by mapped specialties, otherwise broad search
                const filtered = relatedSpecialties.length > 0 
                    ? pros.filter(p => p.specialty.some(s => relatedSpecialties.includes(s)))
                    : pros.filter(p => p.specialty.some(s => s.toLowerCase().includes(term.toLowerCase())));
                    
                setResults(filtered);
            }
            setIsSearching(false);
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white p-6 pb-4 border-b border-nature-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-nature-50 transition-colors text-nature-400">
                        <X size={24} />
                    </button>
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-400" />
                        <input 
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder={activeTab === 'emotions' ? "O que você está sentindo?" : "Busque por nome, especialidade..."} 
                            autoFocus
                            className="w-full bg-nature-50 py-4 pl-12 pr-6 rounded-[2rem] outline-none text-nature-800 placeholder:text-nature-400 font-medium" 
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'guardians', label: 'Guardiões', icon: Users },
                        { id: 'sanctuaries', label: 'Santuários', icon: Home },
                        { id: 'emotions', label: 'Emoções', icon: Heart },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setQuery(''); setResults([]); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-nature-900 text-white shadow-lg shadow-nature-900/10 scale-105' 
                                    : 'bg-white border border-nature-200 text-nature-400 hover:border-nature-300'
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {query.length === 0 && activeTab === 'emotions' && (
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest pl-2">Sintomas Comuns</h4>
                        <div className="flex flex-wrap gap-3">
                            {EMOTIONS.map(e => (
                                <button key={e.id} onClick={() => handleSearch(e.name)} className={`px-5 py-3 rounded-[2rem] text-sm font-medium ${e.color} transition-transform active:scale-95`}>
                                    {e.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isSearching ? (
                     <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-nature-200 border-t-primary-500 rounded-full animate-spin"/></div>
                ) : (
                    <>
                        {activeTab === 'sanctuaries' && results.map((s: any) => (
                             <button key={s.id} className="w-full bg-white p-4 rounded-[2.5rem] border border-nature-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all text-left">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-nature-100 overflow-hidden"><img src={s.image} className="w-full h-full object-cover"/></div>
                                <div>
                                    <h4 className="font-bold text-nature-900">{s.name}</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1"><MapPin size={10}/> {s.location}</p>
                                </div>
                            </button>
                        ))}

                        {(activeTab === 'guardians' || activeTab === 'emotions') && results.map((pro: Professional) => (
                            <button key={pro.id} onClick={() => onSelectProfessional(pro)} className="w-full bg-white p-5 rounded-[2.5rem] border border-nature-100 flex items-center gap-5 shadow-sm active:scale-[0.98] transition-all hover:border-primary-200 text-left hover:shadow-md">
                                <DynamicAvatar user={pro} size="lg" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-nature-900 truncate text-base">{pro.name}</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-tighter truncate mt-0.5">{pro.specialty.join(' • ')}</p>
                                    <div className="flex items-center gap-1 mt-2 text-amber-500 font-bold text-[10px]">
                                        <Star size={10} fill="currentColor"/> {pro.rating.toFixed(1)}
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-nature-200" />
                            </button>
                        ))}
                        
                        {query && results.length === 0 && (
                            <div className="text-center py-10 text-nature-400 text-sm italic">
                                Sintonize sua busca... nada encontrado.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

import { Users } from 'lucide-react';
