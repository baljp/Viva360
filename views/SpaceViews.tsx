import React, { useState } from 'react';
import { ViewState, ServicePackage } from '../types';
import { Building, Wallet, Heart, UserPlus, Gift, Briefcase, Plus, Settings, ChevronRight, Edit2, Users, Star } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, Cell, Tooltip } from 'recharts';
import { MOCK_PACKAGES, MOCK_VACANCIES, MOCK_SERVICES } from '../constants';
import { EmptyState, AdminCard, SuccessModal } from '../components/Common';

interface SpaceProps {
    view: ViewState;
    setView: (view: ViewState) => void;
}

// --- SUB-VIEWS ---

const SpaceManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'services' | 'packages' | 'vacancies' | 'sponsors'>('services');
    const [showSuccess, setShowSuccess] = useState(false);

    const handleCreate = () => {
        // Logic to open creation modal would go here
        setShowSuccess(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h2 className="text-2xl font-light text-nature-800">Gestão <span className="font-semibold">Integrada</span></h2>
                    <p className="text-sm text-nature-500">Administre recursos do espaço.</p>
                </div>
                <div className="bg-white border border-nature-200 p-2 rounded-xl shadow-sm"><Settings size={20} className="text-nature-400" /></div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {[
                    { id: 'services', label: 'Serviços' },
                    { id: 'packages', label: 'Pacotes' },
                    { id: 'vacancies', label: 'Vagas' },
                    { id: 'sponsors', label: 'Parcerias' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-nature-800 text-white shadow-md' : 'bg-white border border-nature-100 text-nature-500 hover:border-primary-200'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div className="animate-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'services' && (
                    <div className="space-y-4">
                        <div className="bg-[#e8efec] p-6 rounded-[2rem] border border-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-nature-800">Novo Serviço</h3>
                                <p className="text-xs text-nature-500">Adicionar modalidade.</p>
                            </div>
                            <button onClick={handleCreate} className="bg-nature-900 text-white p-3 rounded-xl shadow-lg hover:scale-105 transition-transform"><Plus size={20} /></button>
                        </div>
                        {MOCK_SERVICES.map(service => (
                            <AdminCard key={service.id} title={service.name} subtitle={`${service.duration} min • R$ ${service.price}`} actionIcon={<Edit2 size={16} />} onAction={() => {}}>
                                <p className="text-xs text-nature-500 mt-2 line-clamp-2">{service.description}</p>
                            </AdminCard>
                        ))}
                    </div>
                )}

                {activeTab === 'packages' && (
                    <div className="space-y-4">
                         <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-amber-800">Criar Combo</h3>
                                <p className="text-xs text-amber-600">Pacotes fidelizam 3x mais.</p>
                            </div>
                            <button onClick={handleCreate} className="bg-amber-600 text-white p-3 rounded-xl shadow-lg shadow-amber-200 hover:scale-105 transition-transform"><Gift size={20} /></button>
                        </div>
                        {MOCK_PACKAGES.map(pkg => (
                            <AdminCard key={pkg.id} title={pkg.name} subtitle={`${pkg.totalSessions} Sessões • -${pkg.discountPercentage}%`} actionIcon={<Edit2 size={16} />} onAction={() => {}}>
                                <div className="mt-3 flex justify-between items-end">
                                    <p className="text-xs text-nature-500 max-w-[70%]">{pkg.description}</p>
                                    <span className="text-lg font-bold text-primary-700">R$ {pkg.price}</span>
                                </div>
                            </AdminCard>
                        ))}
                    </div>
                )}

                {activeTab === 'vacancies' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-blue-800">Nova Oportunidade</h3>
                                <p className="text-xs text-blue-600">Encontre talentos.</p>
                            </div>
                            <button onClick={handleCreate} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-200 hover:scale-105 transition-transform"><Briefcase size={20} /></button>
                        </div>
                        {MOCK_VACANCIES.filter(v => v.spaceId === 'space1').length > 0 ? (
                             MOCK_VACANCIES.filter(v => v.spaceId === 'space1').map(vac => (
                                <AdminCard key={vac.id} title={vac.role} subtitle={`Postado em: ${new Date(vac.postedAt).toLocaleDateString()}`} actionIcon={<Users size={16} />} onAction={() => {}}>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {vac.requirements.slice(0, 2).map((req, i) => (
                                            <span key={i} className="text-[10px] bg-nature-50 border border-nature-100 px-2 py-1 rounded-md text-nature-600">{req}</span>
                                        ))}
                                    </div>
                                    <div className="mt-3 text-right">
                                        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">{vac.type}</span>
                                    </div>
                                </AdminCard>
                             ))
                        ) : (
                            <EmptyState title="Sem vagas abertas" description="Sua equipe está completa. Crie uma nova oportunidade para expandir." icon={<Briefcase size={32} />} />
                        )}
                    </div>
                )}

                {activeTab === 'sponsors' && (
                    <div className="space-y-4">
                         <div className="bg-white p-6 rounded-[2rem] border border-dashed border-nature-300 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors" onClick={handleCreate}>
                             <div className="bg-nature-100 p-3 rounded-full text-nature-400 mb-3"><UserPlus size={24} /></div>
                             <h3 className="font-semibold text-nature-800 text-sm">Adicionar Parceiro</h3>
                             <p className="text-xs text-nature-500">Exiba marcas nos eventos.</p>
                         </div>
                         <EmptyState title="Nenhum parceiro ativo" description="Cadastre marcas alinhadas ao seu propósito para patrocinar eventos." icon={<Star size={32} />} />
                    </div>
                )}
            </div>

            <SuccessModal 
                isOpen={showSuccess} 
                onClose={() => setShowSuccess(false)} 
                title="Criado com Sucesso" 
                message="Seu novo item já está ativo no ecossistema Viva360." 
            />
        </div>
    );
};

const SpaceDashboard: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
    const harmonyData = [
        { name: 'Seg', val: 85 },
        { name: 'Ter', val: 92 },
        { name: 'Qua', val: 88 },
        { name: 'Qui', val: 95 },
        { name: 'Sex', val: 90 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-light text-nature-800">Espaço <span className="font-semibold">Terapêutico</span></h2>
                <div className="bg-white border border-nature-200 p-2 rounded-xl shadow-sm"><Building size={20} className="text-nature-400" /></div>
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                <button onClick={() => setView(ViewState.SPACE_MANAGEMENT)} className="flex-shrink-0 bg-white border border-nature-100 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold text-nature-600 shadow-sm hover:border-primary-200">
                    <Settings size={14} /> Gestão
                </button>
                 <button onClick={() => setView(ViewState.SPACE_TEAM)} className="flex-shrink-0 bg-white border border-nature-100 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold text-nature-600 shadow-sm hover:border-primary-200">
                    <Users size={14} /> Equipe
                </button>
            </div>

            {/* HARMONY DASHBOARD (Healing Index) */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-nature-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-1">Índice de Cura</p>
                        <h3 className="text-3xl font-light text-primary-700">92<span className="text-lg text-nature-400">/100</span></h3>
                    </div>
                    <div className="bg-primary-50 p-3 rounded-full text-primary-600">
                        <Heart size={24} fill="currentColor" className="opacity-20" />
                        <Heart size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                </div>
                
                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={harmonyData}>
                            <Tooltip 
                                cursor={{fill: '#f2f7f5'}} 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                            />
                            <Bar dataKey="val" radius={[6, 6, 6, 6]}>
                                {harmonyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.val > 90 ? '#588179' : '#c5dcd5'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-nature-400 mt-2">Satisfação emocional dos clientes (NPS)</p>
            </div>

            {/* FINANCIAL SPLIT TRANSPARENCY */}
            <div className="bg-nature-800 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                <h3 className="text-lg font-light mb-6 flex items-center gap-2"><Wallet size={18} /> Split Financeiro</h3>
                
                <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <span className="text-nature-300 text-sm">Faturamento Bruto</span>
                        <span className="font-semibold text-lg">R$ 42.500</span>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-nature-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Repasse Terapeutas (70%)</span>
                            <span>R$ 29.750</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-nature-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary-400"></div> Receita Espaço (25%)</span>
                            <span className="text-primary-300 font-bold">R$ 10.625</span>
                        </div>
                        <div className="flex justify-between text-xs opacity-50">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-nature-500"></div> Taxas (5%)</span>
                            <span>R$ 2.125</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Occupancy / Professionals List */}
            <div>
                <div className="flex justify-between items-center px-2 mb-4">
                    <h3 className="font-semibold text-nature-800">Ocupação Zen</h3>
                    <button className="text-xs text-primary-600 font-bold uppercase tracking-wide">Gerir Salas</button>
                </div>
                <div className="space-y-3">
                    {[
                        { name: 'Sala Lótus', pro: 'Sofia Luz', time: '09:00 - 18:00', status: 'Em uso' },
                        { name: 'Sala Bambu', pro: 'Pedro Alq.', time: '14:00 - 20:00', status: 'Em uso' },
                        { name: 'Sala Cristal', pro: '-', time: '-', status: 'Livre' }
                    ].map((room, i) => (
                        <div key={i} className="bg-white p-4 rounded-3xl border border-nature-50 shadow-sm flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-nature-800 text-sm">{room.name}</h4>
                                <p className="text-xs text-nature-500 mt-1">{room.pro !== '-' ? `Com ${room.pro}` : 'Disponível'}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${room.status === 'Livre' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {room.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const SpaceViews: React.FC<SpaceProps> = ({ view, setView }) => {
    switch (view) {
        case ViewState.SPACE_MANAGEMENT: return <SpaceManagement />;
        default: return <SpaceDashboard setView={setView} />;
    }
};