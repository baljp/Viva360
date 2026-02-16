import React, { useState } from 'react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext';
import { PortalView, ZenToast, DynamicAvatar } from '../../../components/Common';
import { Search, Filter, Heart, Sparkles, TrendingUp, Calendar, Shield, MapPin, ChevronRight, UserPlus, MessageCircle } from 'lucide-react';
import { api } from '../../../services/api';

const SpacePatients: React.FC = () => {
  const { go, selectPatient } = useSantuarioFlow();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'stable' | 'attention'>('all');
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [patientsData, setPatientsData] = useState<any[] | null>(null);

  // Mock Data
  const fallbackPatients = [
    { id: '1', name: 'Ana Oliveira', health: 85, karma: 420, lastVisit: '10/01', condition: 'Estável', pro: 'Dr. Pedro' },
    { id: '2', name: 'Carlos Santos', health: 45, karma: 180, lastVisit: '15/01', condition: 'Em atenção', pro: 'Dra. Maria' },
    { id: '3', name: 'Beatriz Lima', health: 92, karma: 890, lastVisit: '12/01', condition: 'Pronto para alta', pro: 'Dr. Pedro' },
  ];

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await api.spaces.getPatients();
        if (mounted) setPatientsData(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setPatientsData(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const deriveHealth = (plantStage?: string) => {
    const stage = String(plantStage || '').toLowerCase();
    if (stage === 'tree') return 95;
    if (stage === 'flower') return 90;
    if (stage === 'bud') return 82;
    if (stage === 'sprout') return 72;
    if (stage === 'withered') return 40;
    return 60;
  };

  const normalizePatients = (input: any[] | null) => {
    if (!input || input.length === 0) return fallbackPatients;
    return input.map((p) => {
      const health = deriveHealth(p.plantStage);
      const lastVisit = p.lastVisitAt ? new Date(p.lastVisitAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--';
      const pro = Array.isArray(p.guardians) && p.guardians.length > 0 ? p.guardians[0] : 'Equipe';
      const condition = health > 70 ? 'Estável' : 'Em atenção';
      return {
        id: p.id,
        name: p.name || 'Buscador',
        health,
        karma: Number(p.karma || 0),
        lastVisit,
        condition,
        pro,
      };
    });
  };

  const patients = normalizePatients(patientsData);

  const filteredPatients = patients.filter((patient: any) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'stable') return patient.health > 70;
    if (statusFilter === 'attention') return patient.health <= 70;
    return true;
  });

  const handleExportPdf = () => {
    const csv = ['nome,saude,karma,ultimo_atendimento,condicao,guardiao', ...filteredPatients.map((patient) => `${patient.name},${patient.health},${patient.karma},${patient.lastVisit},"${patient.condition}","${patient.pro}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pacientes-santuario-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ title: 'Resumo gerado', message: 'O relatório dos pacientes foi exportado.' });
  };

  return (
    <PortalView 
        title="Jardim do Santuário" 
        subtitle="ZELO PELAS ALMAS" 
        onClose={() => go('EXEC_DASHBOARD')}
        heroImage="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800"
    >
        {toast ? <ZenToast toast={toast} onClose={() => setToast(null)} /> : null}
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
                             <span className="text-[9px] uppercase font-bold opacity-60">Novos/Mês</span>
                         </div>
                         <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                             <Sparkles size={14} className="text-amber-400 mb-1" />
                             <span className="text-xs font-bold">85%</span>
                             <span className="text-[9px] uppercase font-bold opacity-60">Retenção</span>
                         </div>
                         <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                             <UserPlus size={14} className="text-indigo-400 mb-1" />
                             <span className="text-xs font-bold">2.4k</span>
                             <span className="text-[9px] uppercase font-bold opacity-60">Indicações</span>
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
                        placeholder="Buscar por sintonização ou alma..." 
                        className="flex-1 bg-transparent border-none outline-none text-nature-900 placeholder:text-nature-300 text-sm font-medium" 
                    />
                </div>
                <button onClick={() => setStatusFilter((current) => current === 'all' ? 'stable' : current === 'stable' ? 'attention' : 'all')} className="p-4 bg-white rounded-3xl border border-nature-100 text-nature-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                    <Filter size={20} />
                </button>
            </div>

            {/* 3. PATIENT LIST */}
            <div className="space-y-3">
                {isLoading ? (
                    [1,2,3].map((i) => (
                        <div key={i} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm animate-pulse">
                            <div className="h-4 w-1/3 bg-nature-100 rounded mb-3"></div>
                            <div className="h-3 w-2/3 bg-nature-100 rounded"></div>
                        </div>
                    ))
                ) : filteredPatients.map((patient: any) => (
                    <div
                        key={patient.id}
                        className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-100 transition-all active:scale-[0.98]"
                        onClick={() => {
                            // Preserve flow context for detail screens.
                            selectPatient(patient.id);
                            go('PATIENT_PROFILE');
                            try {
                                // Best-effort: stash in sessionStorage so the detail screen can render even before API is wired.
                                sessionStorage.setItem('viva360.space.selectedPatient', JSON.stringify(patient));
                            } catch { /* ignore */ }
                        }}
                    >
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
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const text = encodeURIComponent(`Olá ${patient.name}, entrando em contato via Santuário Viva360. 🌱`);
                                    window.open(`https://wa.me/?text=${text}`, '_blank');
                                }}
                                className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
                                title="Contatar via WhatsApp"
                            >
                                <MessageCircle size={14} /> 
                            </button>
                            <ChevronRight size={18} className="text-nature-200 group-hover:text-indigo-500 transition-colors" />
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. ACTIONS */}
            <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 flex items-center justify-between">
                <div className="flex-1">
                    <h4 className="font-bold text-indigo-900 text-sm">Sintetizar Trajetórias</h4>
                    <p className="text-xs text-indigo-700/70">Gere métricas de evolução coletiva.</p>
                </div>
                <button onClick={handleExportPdf} className="px-5 py-3 bg-white text-indigo-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-indigo-100 shadow-sm hover:shadow-md active:scale-95 transition-all">
                    Gerar PDF
                </button>
            </div>
        </div>
    </PortalView>
  );
}
export default SpacePatients;
