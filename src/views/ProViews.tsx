import React, { useState } from 'react';
import { ViewState } from '../types';
import { MOCK_TRANSACTIONS, MOCK_APPOINTMENTS, MOCK_VACANCIES } from '../constants';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Wallet, Calendar, ArrowUpRight, TrendingUp, ChevronRight, User, CircleDollarSign, Leaf, Clock, MapPin, Bell, MoreHorizontal, FileText, ClipboardList, Share2, Search, Plus, Briefcase, CheckCircle } from 'lucide-react';
import { EmptyState, SuccessModal } from '../components/Common';

interface ProProps {
    user: any; // Using User type from types.ts
    view: ViewState;
    setView: (view: ViewState) => void;
}

// --- SUB-COMPONENT: Organic Stat Card ---
const OrganicStat: React.FC<{ label: string; value: string; trend?: string; icon: React.ReactNode; colorBg: string; colorText: string }> = ({ label, value, trend, icon, colorBg, colorText }) => (
    <div className={`relative overflow-hidden rounded-[2rem] p-5 flex flex-col justify-between h-36 border border-white/50 shadow-sm transition-transform hover:scale-[1.02] ${colorBg}`}>
        {/* Decorative Circle */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>

        <div className="flex justify-between items-start z-10">
            <div className={`p-2.5 rounded-2xl bg-white/80 backdrop-blur-sm ${colorText}`}>
                {icon}
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-xs font-bold bg-white/60 px-2 py-1 rounded-full text-nature-600">
                    <TrendingUp size={12} /> {trend}
                </div>
            )}
        </div>

        <div className="z-10">
            <h3 className="text-3xl font-semibold text-nature-800 tracking-tight">{value}</h3>
            <p className="text-xs font-medium text-nature-500 uppercase tracking-wider mt-1">{label}</p>
        </div>
    </div>
);

// --- OPPORTUNITIES / CAREER VIEW ---
const ProOpportunities: React.FC = () => {
    const [applied, setApplied] = useState<string | null>(null);

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-24">
            <div className="px-2">
                <h2 className="text-2xl font-light text-nature-800">Carreira & <span className="font-semibold">Vagas</span></h2>
                <p className="text-sm text-nature-500">Expanda sua atuação em novos espaços.</p>
            </div>

            <div className="relative mb-2">
                <Search className="absolute left-5 top-4 text-nature-400" size={20} />
                <input type="text" placeholder="Busque por especialidade..." className="w-full bg-white border-0 pl-12 pr-4 py-4 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-primary-200 text-nature-700 placeholder:text-nature-300 shadow-sm" />
            </div>

            <div className="space-y-4">
                {MOCK_VACANCIES.map(vac => (
                    <div key={vac.id} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm hover:border-primary-200 transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-nature-800 text-lg">{vac.role}</h3>
                                <p className="text-sm text-primary-600 font-medium">{vac.spaceName}</p>
                            </div>
                            <span className="bg-nature-50 text-nature-500 text-[10px] px-2 py-1 rounded-md border border-nature-100">{vac.type}</span>
                        </div>

                        <p className="text-xs text-nature-500 mb-4 leading-relaxed">{vac.description}</p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {vac.requirements.map((req, i) => (
                                <span key={i} className="text-[10px] bg-nature-50 text-nature-600 px-2 py-1 rounded-md">{req}</span>
                            ))}
                        </div>

                        <button
                            onClick={() => setApplied(vac.id)}
                            disabled={applied === vac.id}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${applied === vac.id ? 'bg-green-100 text-green-700 cursor-default' : 'bg-nature-900 text-white hover:bg-black'}`}
                        >
                            {applied === vac.id ? 'Candidatura Enviada' : 'Candidatar-se'}
                        </button>
                    </div>
                ))}

                {MOCK_VACANCIES.length === 0 && (
                    <EmptyState title="Nenhuma vaga no momento" description="Fique de olho, novos espaços estão sempre buscando talentos." icon={<Briefcase size={32} />} />
                )}
            </div>

            <SuccessModal
                isOpen={!!applied}
                onClose={() => setApplied(null)}
                title="Boa sorte!"
                message="Sua candidatura foi enviada ao Espaço. Mantenha seu perfil atualizado."
            />
        </div>
    );
};

const ProDashboard: React.FC<{ user: any, onViewAgenda: () => void, onViewRecords: () => void, onViewOpportunities: () => void }> = ({ user, onViewAgenda, onViewRecords, onViewOpportunities }) => {
    // In a real scenario, we'd fetch these from /api/appointments?userId=user.id
    const [stats, setStats] = useState({ revenue: 'R$ 0', records: '0' });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">

            {/* 1. HERO HEADER */}
            <div className="relative bg-[#e8efec] rounded-[3rem] p-8 overflow-hidden shadow-sm border border-white">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary-200 rounded-bl-[5rem] opacity-40 blur-2xl"></div>
                <div className="absolute bottom-[-10px] left-10 w-24 h-24 bg-amber-100 rounded-full opacity-60 blur-xl"></div>
                <div className="absolute top-8 right-8 text-primary-400 opacity-20 transform rotate-12"><Leaf size={80} strokeWidth={0.5} /></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-nature-500 text-sm font-medium mb-1">Bem-vinda de volta,</p>
                            <h2 className="text-3xl font-light text-nature-800">{user.name.split(' ')[0]} <span className="font-semibold">{user.name.split(' ')[1] || ''}</span></h2>
                        </div>
                        <button className="bg-white p-3 rounded-full text-nature-400 hover:text-primary-600 shadow-sm transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
                        </button>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-5 shadow-lg shadow-nature-200/20 border border-white/50 flex items-center justify-between group cursor-pointer hover:bg-white transition-all">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-lg">
                                    09<span className="text-[10px] align-top">:00</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                                <p className="text-xs text-nature-400 font-bold uppercase tracking-wider mb-0.5">Próxima Sessão</p>
                                <h3 className="font-semibold text-nature-800 text-lg">Ana Silva</h3>
                                <p className="text-xs text-nature-500 flex items-center gap-1"><Leaf size={10} /> Reiki & Alinhamento</p>
                            </div>
                        </div>
                        <button className="w-10 h-10 rounded-full bg-nature-100 flex items-center justify-center text-nature-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. METRICS GRID */}
            <div className="grid grid-cols-2 gap-4">
                <OrganicStat
                    label="Receita Mensal"
                    value="R$ 2.4k"
                    trend="+12%"
                    icon={<CircleDollarSign size={20} />}
                    colorBg="bg-gradient-to-br from-white to-primary-50"
                    colorText="text-primary-600"
                />
                <OrganicStat
                    label="Prontuários"
                    value="14"
                    trend="Atualizados"
                    icon={<ClipboardList size={20} />}
                    colorBg="bg-gradient-to-br from-white to-amber-50"
                    colorText="text-amber-600"
                />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                <button onClick={onViewRecords} className="flex-shrink-0 bg-white border border-nature-100 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold text-nature-600 shadow-sm hover:border-primary-200">
                    <FileText size={18} /> Prontuário 360°
                </button>
                <button onClick={onViewAgenda} className="flex-shrink-0 bg-white border border-nature-100 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold text-nature-600 shadow-sm hover:border-primary-200">
                    <Calendar size={18} /> Agenda Mestre
                </button>
                <button onClick={onViewOpportunities} className="flex-shrink-0 bg-white border border-nature-100 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold text-nature-600 shadow-sm hover:border-primary-200">
                    <Briefcase size={18} /> Vagas
                </button>
            </div>

            {/* 3. AGENDA TIMELINE PREVIEW */}
            <div>
                <h3 className="font-semibold text-nature-800 text-lg mb-4 px-2">Agenda de Hoje</h3>
                <div className="space-y-3 relative">
                    <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-nature-100 rounded-full"></div>
                    {MOCK_APPOINTMENTS.length > 0 ? (
                        MOCK_APPOINTMENTS.map((app, i) => (
                            <div key={app.id} className="relative pl-14 group">
                                <div className={`absolute left-0 top-3 w-14 text-right pr-4 text-xs font-bold ${i === 0 ? 'text-nature-800' : 'text-nature-400'}`}>
                                    {new Date(app.date).getHours()}:00
                                </div>
                                <div className={`absolute left-[26px] top-4 w-2 h-2 rounded-full border-2 border-white ${i === 0 ? 'bg-primary-500 scale-125 shadow-sm' : 'bg-nature-300'}`}></div>
                                <div className="bg-white p-4 rounded-[2rem] border border-nature-50 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i % 2 === 0 ? 'bg-primary-50 text-primary-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {app.clientId === 'client1' ? 'AS' : 'JP'}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-nature-800 text-sm">{app.clientId === 'client1' ? 'Ana Silva' : 'João Paulo'}</h4>
                                            <p className="text-xs text-nature-500">{app.serviceName}</p>
                                        </div>
                                    </div>
                                    <div className="text-nature-300 hover:text-nature-600">
                                        <MoreHorizontal size={20} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <EmptyState title="Agenda Livre" description="Aproveite o tempo para estudar ou descansar." icon={<Calendar size={32} />} />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- PRO RECORDS (PRONTUÁRIO 360) ---
const ProRecords: React.FC = () => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-24">
            <div className="px-2">
                <h2 className="text-2xl font-light text-nature-800">Prontuário <span className="font-semibold">360°</span></h2>
                <p className="text-sm text-nature-500">Gestão integrada de pacientes.</p>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-5 top-4 text-nature-400" size={20} />
                <input type="text" placeholder="Buscar paciente..." className="w-full bg-white border-0 pl-12 pr-4 py-4 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-primary-200 text-nature-700 placeholder:text-nature-300 shadow-sm" />
            </div>

            {/* Patient Card */}
            <div className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden">
                <div className="bg-[#f0f9ff] p-6 border-b border-nature-100 flex justify-between items-start">
                    <div className="flex gap-4">
                        <img src="https://picsum.photos/100/100" className="w-16 h-16 rounded-[1.5rem] object-cover" alt="" />
                        <div>
                            <h3 className="font-bold text-nature-800 text-lg">Ana Silva</h3>
                            <p className="text-xs text-nature-500 mb-2">Última sessão: Ontem</p>
                            <div className="flex gap-2">
                                <span className="bg-white px-2 py-0.5 rounded-md text-[10px] font-bold text-blue-600 border border-blue-100">Ansiedade</span>
                                <span className="bg-white px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-600 border border-amber-100">Foco</span>
                            </div>
                        </div>
                    </div>
                    <button className="bg-white p-2 rounded-full text-primary-600 hover:bg-primary-50"><Share2 size={18} /></button>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-nature-800 text-sm">Notas de Evolução</h4>
                        <button className="text-xs flex items-center gap-1 text-primary-600 font-bold bg-primary-50 px-2 py-1 rounded-lg hover:bg-primary-100"><Plus size={12} /> Nova Nota</button>
                    </div>
                    <div className="space-y-4">
                        <div className="border-l-2 border-primary-200 pl-4 py-1">
                            <p className="text-xs text-nature-400 font-bold mb-1">10 OUT • SESSÃO 12</p>
                            <p className="text-sm text-nature-600 leading-relaxed">Paciente relatou melhora significativa no sono após uso do óleo de lavanda. Trabalhamos respiração diafragmática.</p>
                        </div>
                        <div className="border-l-2 border-nature-200 pl-4 py-1 opacity-60">
                            <p className="text-xs text-nature-400 font-bold mb-1">03 OUT • SESSÃO 11</p>
                            <p className="text-sm text-nature-600 leading-relaxed">Queixa de tensão nos ombros. Realizado Reiki focado no Chakra Laríngeo.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProFinancial: React.FC = () => (
    <div className="space-y-6 animate-in fade-in pb-24">
        <h2 className="text-2xl font-light text-nature-800 px-2">Gestão <span className="font-semibold">Financeira</span></h2>
        <div className="bg-nature-800 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <p className="text-nature-300 text-sm mb-1 uppercase tracking-wider">Saldo Disponível</p>
            <h3 className="text-4xl font-light mb-8 tracking-tight">R$ 2.450,00</h3>
            <div className="flex gap-4">
                <button className="bg-primary-500 hover:bg-primary-400 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-colors flex items-center gap-2 shadow-lg">
                    <ArrowUpRight size={18} /> Solicitar Saque
                </button>
            </div>
        </div>
        <div className="space-y-4">
            <h3 className="font-semibold text-nature-800 px-2">Histórico</h3>
            {MOCK_TRANSACTIONS.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-[2rem] border border-nature-100 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${t.type === 'income' ? 'border-green-100 bg-green-50 text-green-600' : 'border-red-100 bg-red-50 text-red-600'}`}><Wallet size={20} /></div>
                        <div><h4 className="font-medium text-sm text-nature-900">{t.description}</h4><p className="text-xs text-nature-400">{new Date(t.date).toLocaleDateString()}</p></div>
                    </div>
                    <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-nature-800'}`}>{t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(0)}</span>
                </div>
            ))}
        </div>
    </div>
);

const ProAgenda: React.FC = () => (
    <div className="space-y-6 animate-in slide-in-from-right pb-24">
        <h2 className="text-2xl font-bold text-nature-800 px-2">Agenda Mestre</h2>
        <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
            <div className="flex justify-between mb-6">
                <h3 className="font-semibold text-nature-800">Outubro 2023</h3>
                <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-nature-50 flex items-center justify-center text-nature-600"><ChevronRight className="rotate-180" size={16} /></button>
                    <button className="w-8 h-8 rounded-full bg-nature-50 flex items-center justify-center text-nature-600"><ChevronRight size={16} /></button>
                </div>
            </div>
            {/* Simple Grid visualizer */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs text-nature-400 font-bold uppercase">
                <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
                {[...Array(31)].map((_, i) => (
                    <div key={i} className={`aspect-square flex items-center justify-center rounded-xl ${i === 13 ? 'bg-primary-600 text-white shadow-md' : i === 14 || i === 16 ? 'bg-primary-50 text-primary-700' : 'text-nature-600 hover:bg-nature-50'}`}>
                        {i + 1}
                    </div>
                ))}
            </div>
        </div>

        <div>
            <h3 className="font-semibold text-nature-800 px-2 mb-3">Bloqueios & Ausências</h3>
            <button className="w-full bg-white border border-dashed border-nature-300 p-4 rounded-2xl text-nature-500 font-medium hover:border-primary-400 hover:text-primary-600 transition-all">
                + Adicionar Bloqueio
            </button>
        </div>
    </div>
);

export const ProViews: React.FC<ProProps> = ({ view, setView }) => {
    switch (view) {
        case ViewState.PRO_HOME: return <ProDashboard onViewAgenda={() => setView(ViewState.PRO_AGENDA)} onViewRecords={() => setView(ViewState.PRO_RECORDS)} onViewOpportunities={() => setView(ViewState.PRO_OPPORTUNITIES)} />;
        case ViewState.PRO_FINANCE: return <ProFinancial />;
        case ViewState.PRO_AGENDA: return <ProAgenda />;
        case ViewState.PRO_RECORDS: return <ProRecords />;
        case ViewState.PRO_OPPORTUNITIES: return <ProOpportunities />;
        default: return <ProDashboard onViewAgenda={() => setView(ViewState.PRO_AGENDA)} onViewRecords={() => setView(ViewState.PRO_RECORDS)} onViewOpportunities={() => setView(ViewState.PRO_OPPORTUNITIES)} />;
    }
};