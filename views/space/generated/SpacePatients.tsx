import React, { useState } from 'react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext';
import { PortalView, ZenToast, DynamicAvatar } from '../../../components/Common';
import { Search, Filter, Heart, Sparkles, TrendingUp, Calendar, Shield, MapPin, ChevronRight, UserPlus } from 'lucide-react';

export const SpacePatients: React.FC = () => {
  const { go } = useSantuarioFlow();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Data
  const patients = [
    { id: '1', name: 'Ana Oliveira', health: 85, karma: 420, lastVisit: '10/01', condition: 'Estável', pro: 'Dr. Pedro' },
    { id: '2', name: 'Carlos Santos', health: 45, karma: 180, lastVisit: '15/01', condition: 'Em atenção', pro: 'Dra. Maria' },
    { id: '3', name: 'Beatriz Lima', health: 92, karma: 890, lastVisit: '12/01', condition: 'Pronto para alta', pro: 'Dr. Pedro' },
  ];

  return (
    <PortalView 
        title="Jardim do Santuário" 
        subtitle="GESTÃO DE PACIENTES" 
        onBack={() => go('EXEC_DASHBOARD')}
        heroImage="https://images.unsplash.com/photo-1598155523122-38423bb4d6c1?q=80&w=800"
    >
        <div className="space-y-6">
            {/* 1. HERO STATS */}
            <div className="bg-nature-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                             <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300">População Viva</p>
                             <h3 className="text-5xl font-serif italic">450 <span className="text-xl not-italic opacity-50">Almas</span></h3>
                        </div>
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <Heart size={20} className="text-emerald-400" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                         <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                             <TrendingUp size={14} className="text-emerald-400 mb-1" />
                             <span className="text-xs font-bold">+12</span>
                             <span className="text-[8px] uppercase font-bold opacity-60">Novos/Mês</span>
                         </div>
                         <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                             <Sparkles size={14} className="text-amber-400 mb-1" />
                             <span className="text-xs font-bold">85%</span>
                             <span className="text-[8px] uppercase font-bold opacity-60">Retenção</span>
                         </div>
                         <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                             <UserPlus size={14} className="text-indigo-400 mb-1" />
                             <span className="text-xs font-bold">2.4k</span>
                             <span className="text-[8px] uppercase font-bold opacity-60">Indicações</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* 2. SEARCH & FILTER */}
            <div className="flex gap-2">
                <div className="flex-1 bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-3 shadow-sm focus-within:border-indigo-200 transition-all group">
                    <Search size={20} className="text-nature-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome ou diagnóstico..." 
                        className="flex-1 bg-transparent border-none outline-none text-nature-900 placeholder:text-nature-300 text-sm font-medium" 
                    />
                </div>
                <button className="p-4 bg-white rounded-3xl border border-nature-100 text-nature-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                    <Filter size={20} />
                </button>
            </div>

            {/* 3. PATIENT LIST */}
            <div className="space-y-3">
                {patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((patient) => (
                    <div key={patient.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-100 transition-all active:scale-[0.98]" onClick={() => go('PATIENT_PROFILE')}>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <DynamicAvatar user={{ name: patient.name } as any} size="md" className="border-2 border-white shadow-sm" />
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${patient.health > 70 ? 'bg-emerald-500' : patient.health > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                            </div>
                            <div>
                                <h4 className="font-bold text-nature-900 text-sm">{patient.name}</h4>
                                <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest mt-0.5">{patient.condition} · {patient.pro}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="block text-xs font-bold text-nature-900">{patient.karma} Karma</span>
                                <span className="text-[9px] text-nature-400 font-bold uppercase">Último: {patient.lastVisit}</span>
                            </div>
                            <ChevronRight size={18} className="text-nature-200 group-hover:text-indigo-500 transition-colors" />
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. ACTIONS */}
            <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 flex items-center justify-between">
                <div className="flex-1">
                    <h4 className="font-bold text-indigo-900 text-sm">Exportar Relatórios</h4>
                    <p className="text-xs text-indigo-700/70">Gere métricas de evolução coletiva.</p>
                </div>
                <button className="px-5 py-3 bg-white text-indigo-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-indigo-100 shadow-sm hover:shadow-md active:scale-95 transition-all">
                    Gerar PDF
                </button>
            </div>
        </div>
    </PortalView>
  );
}
