import React, { useState } from 'react';
import { ViewState, UserRole, User, HealthAccessGrant, AnamnesisData, Service } from '../types';
import { ChevronRight, Shield, Bell, Moon, CreditCard, Clock, FileCheck, Users, Coffee, Gift, Copy, Check, Camera, Leaf, ShieldCheck, ChevronLeft, UserCircle, MapPin, Mail, Key, MessageCircle, HelpCircle, Activity, Heart, Eye, AlertTriangle, Zap, Sliders, Briefcase, Plus, Edit2, Trash2 } from 'lucide-react';
import { FileUpload, SuccessModal, Accordion, Toggle, RangeSlider, BottomSheet, EmptyState } from '../components/Common';
import { MOCK_PROS } from '../constants';

interface SettingsProps {
    user: User;
    view: ViewState;
    setView: (view: ViewState) => void;
}

// --- SUB-VIEW: CLIENT HEALTH & PRIVACY (GDPR) ---
const ClientHealthSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [anamnesis, setAnamnesis] = useState<AnamnesisData>({
        stressLevel: 40,
        sleepQuality: 70,
        digestion: 60,
        energy: 80,
        lastUpdate: new Date().toISOString()
    });

    const [grants, setGrants] = useState<HealthAccessGrant[]>([
        { professionalId: 'pro1', professionalName: 'Sofia Luz', avatar: MOCK_PROS[0].avatar || '', grantedAt: '2023-09-10' }
    ]);

    const [token, setToken] = useState<string | null>(null);

    const handleGenerateToken = () => {
        setToken(`${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    };

    const handleRevoke = (id: string) => {
        if (confirm('Tem certeza que deseja revogar o acesso? O profissional não poderá mais ver seu histórico.')) {
            setGrants(grants.filter(g => g.professionalId !== id));
        }
    };

    return (
        <div className="h-full flex flex-col pb-24 animate-in slide-in-from-right">
            <div className="flex items-center gap-2 mb-6 px-2">
                <button onClick={onBack}><ChevronLeft size={24} className="text-nature-500" /></button>
                <h2 className="text-2xl font-light text-nature-800">Saúde & <span className="font-semibold">Privacidade</span></h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 px-1">
                
                {/* 1. Anamnese Holística */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-primary-50 p-3 rounded-full text-primary-600"><Activity size={20} /></div>
                        <div>
                            <h3 className="font-semibold text-nature-800">Anamnese Holística</h3>
                            <p className="text-xs text-nature-500">Atualizado: Hoje</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <RangeSlider label="Nível de Estresse" value={anamnesis.stressLevel} onChange={(v) => setAnamnesis({...anamnesis, stressLevel: v})} minLabel="Zen" maxLabel="Crítico" />
                        <RangeSlider label="Qualidade do Sono" value={anamnesis.sleepQuality} onChange={(v) => setAnamnesis({...anamnesis, sleepQuality: v})} minLabel="Insônia" maxLabel="Reparador" />
                        <RangeSlider label="Digestão" value={anamnesis.digestion} onChange={(v) => setAnamnesis({...anamnesis, digestion: v})} minLabel="Lenta" maxLabel="Leve" />
                        <RangeSlider label="Energia Vital" value={anamnesis.energy} onChange={(v) => setAnamnesis({...anamnesis, energy: v})} minLabel="Baixa" maxLabel="Radiante" />
                    </div>
                </div>

                {/* 2. Access Management (GDPR) */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-50 p-3 rounded-full text-blue-600"><ShieldCheck size={20} /></div>
                        <div>
                            <h3 className="font-semibold text-nature-800">Quem tem acesso?</h3>
                            <p className="text-xs text-nature-500">Gestão de consentimento (LGPD).</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {grants.length > 0 ? grants.map(grant => (
                            <div key={grant.professionalId} className="flex items-center justify-between p-3 bg-nature-50 rounded-2xl border border-nature-100">
                                <div className="flex items-center gap-3">
                                    <img src={grant.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                    <div>
                                        <p className="text-sm font-bold text-nature-800">{grant.professionalName}</p>
                                        <p className="text-[10px] text-nature-500">Desde: {new Date(grant.grantedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleRevoke(grant.professionalId)} className="text-xs text-red-500 font-bold px-3 py-1.5 bg-white rounded-lg border border-red-100 hover:bg-red-50 transition-colors">
                                    Revogar
                                </button>
                            </div>
                        )) : (
                            <p className="text-center text-sm text-nature-400 py-4">Nenhum profissional acessa seus dados.</p>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-nature-50">
                        <h4 className="font-medium text-nature-800 text-sm mb-3">Novo Acesso Temporário</h4>
                        {token ? (
                            <div className="bg-nature-800 text-white p-4 rounded-2xl text-center">
                                <p className="text-xs text-nature-300 uppercase tracking-widest mb-1">Seu Token</p>
                                <p className="text-3xl font-mono tracking-widest font-bold mb-2">{token}</p>
                                <p className="text-[10px] opacity-70">Válido por 15 minutos. Mostre ao seu terapeuta.</p>
                            </div>
                        ) : (
                            <button onClick={handleGenerateToken} className="w-full py-3 bg-primary-50 text-primary-700 font-bold rounded-xl border border-primary-100 hover:bg-primary-100 transition-colors flex items-center justify-center gap-2">
                                <Key size={16} /> Gerar Token de Acesso
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. Sensitive Data Tags */}
                <Accordion title="Dados Sensíveis de Saúde" icon={<Heart size={18} />} subtitle="Alergias, cirurgias e restrições.">
                    <div className="flex flex-wrap gap-2">
                        {['Sem Alergias', 'Cirurgia Joelho (2019)', 'Vegetariana', 'Pressão Baixa'].map(tag => (
                            <span key={tag} className="px-3 py-1.5 bg-nature-50 rounded-lg text-xs text-nature-600 border border-nature-200">{tag}</span>
                        ))}
                        <button className="px-3 py-1.5 bg-white rounded-lg text-xs text-primary-600 border border-dashed border-primary-300 flex items-center gap-1 hover:bg-primary-50">
                            <Plus size={12} /> Adicionar
                        </button>
                    </div>
                </Accordion>
            </div>
        </div>
    );
};

// --- SUB-VIEW: PRO SERVICES CONFIG ---
const ProServiceSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [services, setServices] = useState<Service[]>([
        { id: 's1', name: 'Sessão de Reiki', duration: 60, price: 150, description: 'Alinhamento energético completo.', modality: 'presential' },
        { id: 's2', name: 'Consultoria Online', duration: 45, price: 100, description: 'Orientação via vídeo.', modality: 'online' }
    ]);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleEdit = (service: Service) => {
        setEditingService({ ...service });
        setIsSheetOpen(true);
    };

    const handleNew = () => {
        setEditingService({ id: Math.random().toString(), name: '', duration: 60, price: 0, description: '', modality: 'online' });
        setIsSheetOpen(true);
    };

    const handleSave = () => {
        if (editingService) {
            if (services.find(s => s.id === editingService.id)) {
                setServices(services.map(s => s.id === editingService.id ? editingService : s));
            } else {
                setServices([...services, editingService]);
            }
            setIsSheetOpen(false);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Excluir este serviço?')) {
            setServices(services.filter(s => s.id !== id));
        }
    };

    return (
        <div className="h-full flex flex-col pb-24 animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-2">
                    <button onClick={onBack}><ChevronLeft size={24} className="text-nature-500" /></button>
                    <h2 className="text-2xl font-light text-nature-800">Meus <span className="font-semibold">Serviços</span></h2>
                </div>
                <button onClick={handleNew} className="bg-nature-900 text-white p-3 rounded-full hover:bg-black shadow-lg"><Plus size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 px-1">
                {services.length > 0 ? services.map(service => (
                    <div key={service.id} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex flex-col gap-3 group hover:border-primary-200 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-nature-800 text-lg">{service.name}</h3>
                                <p className="text-xs text-nature-500 mt-1 line-clamp-1">{service.description}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${service.modality === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                {service.modality}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-nature-50">
                            <div className="flex gap-4 text-sm text-nature-600">
                                <span className="flex items-center gap-1"><Clock size={14} /> {service.duration} min</span>
                                <span className="flex items-center gap-1 font-bold text-primary-700"><CreditCard size={14} /> R$ {service.price}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(service)} className="p-2 bg-nature-50 rounded-full text-nature-500 hover:text-primary-600 hover:bg-primary-50"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(service.id)} className="p-2 bg-nature-50 rounded-full text-nature-500 hover:text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <EmptyState title="Nenhum serviço" description="Comece adicionando o que você oferece de melhor." icon={<Briefcase size={32} />} />
                )}
            </div>

            {/* EDIT BOTTOM SHEET */}
            <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title={editingService?.name ? 'Editar Serviço' : 'Novo Serviço'}>
                <div className="space-y-6 pb-8">
                    <div>
                        <label className="text-xs font-bold text-nature-400 uppercase tracking-wider mb-2 block">Nome do Serviço</label>
                        <input type="text" value={editingService?.name} onChange={e => setEditingService({...editingService!, name: e.target.value})} className="w-full p-4 bg-nature-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-200 outline-none text-nature-800 placeholder:text-nature-300" placeholder="Ex: Reiki Tradicional" />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-nature-400 uppercase tracking-wider mb-2 block">Preço (R$)</label>
                            <input type="number" value={editingService?.price} onChange={e => setEditingService({...editingService!, price: Number(e.target.value)})} className="w-full p-4 bg-nature-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-200 outline-none text-nature-800" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-nature-400 uppercase tracking-wider mb-2 block">Duração (min)</label>
                            <div className="flex gap-2">
                                {[30, 60, 90].map(d => (
                                    <button key={d} onClick={() => setEditingService({...editingService!, duration: d})} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${editingService?.duration === d ? 'bg-nature-800 text-white border-nature-800' : 'bg-white border-nature-200 text-nature-500'}`}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-nature-400 uppercase tracking-wider mb-2 block">Modalidade</label>
                        <div className="flex bg-nature-50 p-1 rounded-2xl">
                            {['online', 'presential'].map(m => (
                                <button key={m} onClick={() => setEditingService({...editingService!, modality: m as any})} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all capitalize ${editingService?.modality === m ? 'bg-white shadow-sm text-nature-800' : 'text-nature-400 hover:text-nature-600'}`}>
                                    {m === 'presential' ? 'Presencial' : 'Online'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-nature-400 uppercase tracking-wider mb-2 block">Descrição</label>
                        <textarea value={editingService?.description} onChange={e => setEditingService({...editingService!, description: e.target.value})} className="w-full p-4 bg-nature-50 rounded-2xl border-0 focus:ring-2 focus:ring-primary-200 outline-none text-nature-800 h-24 resize-none" placeholder="Detalhes do tratamento..." />
                    </div>

                    <button onClick={handleSave} className="w-full bg-primary-600 text-white font-bold py-4 rounded-xl hover:bg-primary-700 shadow-lg">
                        Salvar Alterações
                    </button>
                </div>
            </BottomSheet>
        </div>
    );
};

// --- MAIN SETTINGS HUB ---
const SettingsHub: React.FC<SettingsProps> = ({ user, setView }) => {
    
    const HubCard: React.FC<{ title: string; desc: string; icon: React.ReactNode; colorClass: string; onClick?: () => void }> = ({ title, desc, icon, colorClass, onClick }) => (
        <button onClick={onClick} className={`text-left p-6 rounded-[2.5rem] border border-white shadow-sm flex flex-col justify-between h-44 hover:scale-[1.02] transition-transform ${colorClass}`}>
            <div className="bg-white/60 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center text-nature-800 shadow-sm">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-bold text-nature-900 leading-tight mb-1">{title}</h3>
                <p className="text-xs text-nature-600 font-medium opacity-80">{desc}</p>
            </div>
        </button>
    );

    return (
        <div className="space-y-6 pb-24 animate-in fade-in">
            <div className="px-2">
                <h2 className="text-2xl font-light text-nature-800">Centro de <span className="font-semibold">Controle</span></h2>
                <p className="text-sm text-nature-500">Gerencie sua jornada {user.role === UserRole.CLIENT ? 'pessoal' : 'profissional'}.</p>
            </div>

            {/* THE 4 PILLARS GRID */}
            <div className="grid grid-cols-2 gap-4">
                <HubCard 
                    title="Identidade" 
                    desc="Perfil & Bio" 
                    icon={<UserCircle size={24} />} 
                    colorClass="bg-[#f2f7f5]" 
                    onClick={() => setView(ViewState.SETTINGS_PROFILE_EDIT)}
                />
                
                {user.role === UserRole.CLIENT ? (
                    <HubCard 
                        title="Saúde" 
                        desc="Prontuário & LGPD" 
                        icon={<Activity size={24} className="text-red-500" />} 
                        colorClass="bg-red-50/50" 
                        onClick={() => setView(ViewState.SETTINGS_PRIVACY_HEALTH)}
                    />
                ) : (
                    <HubCard 
                        title="Operacional" 
                        desc="Serviços & Agenda" 
                        icon={<Briefcase size={24} className="text-blue-500" />} 
                        colorClass="bg-blue-50/50" 
                        onClick={() => setView(ViewState.SETTINGS_PRO_SERVICES)}
                    />
                )}

                <HubCard 
                    title="Financeiro" 
                    desc={user.role === UserRole.CLIENT ? "Cartões & Recibos" : "Split & Contas"} 
                    icon={<CreditCard size={24} className="text-amber-600" />} 
                    colorClass="bg-amber-50/50" 
                    onClick={() => {}} // Placeholder for future expansion
                />

                <HubCard 
                    title="Segurança" 
                    desc="Senha & Verificação" 
                    icon={<ShieldCheck size={24} className="text-emerald-600" />} 
                    colorClass="bg-emerald-50/50" 
                    onClick={() => setView(ViewState.VERIFICATION)}
                />
            </div>

            {/* Quick Actions List */}
            <div className="space-y-3 pt-4">
                <h3 className="font-bold text-nature-400 text-xs uppercase tracking-widest px-2">Outros Ajustes</h3>
                
                {user.role === UserRole.CLIENT && (
                    <div className="bg-white p-4 rounded-2xl border border-nature-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Moon size={18} className="text-nature-400" />
                            <span className="text-sm font-medium text-nature-700">Modo Zen (Escuro)</span>
                        </div>
                        <Toggle checked={false} onChange={() => {}} />
                    </div>
                )}

                <button onClick={() => setView(ViewState.INVITE_FRIEND)} className="w-full bg-white p-4 rounded-2xl border border-nature-100 flex items-center justify-between hover:bg-nature-50 group">
                    <div className="flex items-center gap-3">
                        <Gift size={18} className="text-nature-400 group-hover:text-primary-500" />
                        <span className="text-sm font-medium text-nature-700">Convide Amigos</span>
                    </div>
                    <ChevronRight size={16} className="text-nature-300" />
                </button>

                <button onClick={() => setView(ViewState.SUPPORT)} className="w-full bg-white p-4 rounded-2xl border border-nature-100 flex items-center justify-between hover:bg-nature-50 group">
                    <div className="flex items-center gap-3">
                        <HelpCircle size={18} className="text-nature-400 group-hover:text-primary-500" />
                        <span className="text-sm font-medium text-nature-700">Ajuda e Suporte</span>
                    </div>
                    <ChevronRight size={16} className="text-nature-300" />
                </button>
            </div>
            
            <p className="text-center text-xs text-nature-300 pt-6">Versão 2.0.0 • Viva360</p>
        </div>
    );
};

// --- REUSED VIEWS (From previous iterations, kept for routing) ---

const VerificationView: React.FC<{ onBack: () => void }> = ({ onBack }) => { return <div className="p-6 text-center">Simulação Verificação <button onClick={onBack} className="block mt-4 text-blue-500 underline mx-auto">Voltar</button></div>; }; 
const InviteView: React.FC<{ onBack: () => void }> = ({ onBack }) => { return <div className="p-6 text-center">Simulação Convite <button onClick={onBack} className="block mt-4 text-blue-500 underline mx-auto">Voltar</button></div>; };
const TermsView: React.FC<{ onBack: () => void }> = ({ onBack }) => { return <div className="p-6 text-center">Simulação Termos <button onClick={onBack} className="block mt-4 text-blue-500 underline mx-auto">Voltar</button></div>; };
const SupportView: React.FC<{ onBack: () => void }> = ({ onBack }) => { return <div className="p-6 text-center">Simulação Suporte <button onClick={onBack} className="block mt-4 text-blue-500 underline mx-auto">Voltar</button></div>; };

const ProfileEditView: React.FC<{ onBack: () => void, user: User }> = ({ onBack, user }) => (
    <div className="h-full flex flex-col pb-24 animate-in slide-in-from-right">
        <div className="flex items-center gap-2 mb-6 px-2">
            <button onClick={onBack}><ChevronLeft size={24} className="text-nature-500" /></button>
            <h2 className="text-2xl font-light text-nature-800">Editar <span className="font-semibold">Identidade</span></h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-6">
            <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-3 relative">
                     <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                     <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"><Camera className="text-white" /></div>
                </div>
                <button className="text-primary-600 text-xs font-bold uppercase tracking-wider">Alterar Foto</button>
            </div>
            <div className="space-y-4">
                <div className="bg-white p-4 rounded-[1.5rem] border border-nature-100"><label className="text-xs text-nature-400 font-bold uppercase ml-2 mb-1 block">Nome Completo</label><div className="flex items-center gap-3 px-3"><UserCircle size={20} className="text-nature-400" /><input type="text" defaultValue={user.name} className="flex-1 bg-transparent border-0 outline-none text-nature-800" /></div></div>
                <div className="bg-white p-4 rounded-[1.5rem] border border-nature-100"><label className="text-xs text-nature-400 font-bold uppercase ml-2 mb-1 block">Bio Energética</label><div className="flex items-center gap-3 px-3"><Zap size={20} className="text-nature-400" /><input type="text" placeholder="Ex: Busco paz e cura..." className="flex-1 bg-transparent border-0 outline-none text-nature-800" /></div></div>
            </div>
        </div>
        <div className="mt-4"><button onClick={onBack} className="w-full bg-nature-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all">Salvar Alterações</button></div>
    </div>
);

// --- MAIN EXPORT ---
export const SettingsViews: React.FC<SettingsProps> = (props) => {
    switch (props.view) {
        // Detailed Sub-Views
        case ViewState.SETTINGS_PRIVACY_HEALTH: return <ClientHealthSettings onBack={() => props.setView(ViewState.SETTINGS)} />;
        case ViewState.SETTINGS_PRO_SERVICES: return <ProServiceSettings onBack={() => props.setView(ViewState.SETTINGS)} />;
        case ViewState.SETTINGS_PROFILE_EDIT: return <ProfileEditView onBack={() => props.setView(ViewState.SETTINGS)} user={props.user} />;
        
        // General Views
        case ViewState.VERIFICATION: return <VerificationView onBack={() => props.setView(ViewState.SETTINGS)} />;
        case ViewState.INVITE_FRIEND: return <InviteView onBack={() => props.setView(ViewState.SETTINGS)} />;
        case ViewState.TERMS: return <TermsView onBack={() => props.setView(ViewState.SETTINGS)} />;
        case ViewState.SUPPORT: return <SupportView onBack={() => props.setView(ViewState.SETTINGS)} />;
        
        // Default Hub
        default: return <SettingsHub {...props} />;
    }
};