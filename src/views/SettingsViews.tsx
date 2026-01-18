import React, { useState } from 'react';
import { ViewState, UserRole, User, HealthAccessGrant, AnamnesisData, Service, DataSharingRequest, CommissionRule } from '../types';
import { ChevronRight, Shield, Bell, Moon, CreditCard, Clock, FileCheck, Users, Coffee, Gift, Copy, Check, Camera, Leaf, ShieldCheck, ChevronLeft, UserCircle, MapPin, Mail, Key, MessageCircle, HelpCircle, Activity, Heart, Eye, AlertTriangle, Zap, Sliders, Briefcase, Plus, Edit2, Trash2, Lock, EyeOff, FilePlus, AlertCircle, Percent, DollarSign, Download, PieChart, Sparkles } from 'lucide-react';
import { FileUpload, SuccessModal, Accordion, Toggle, RangeSlider, BottomSheet, EmptyState, VerifiedBadge } from '../components/Common';
import { MOCK_PROS, MOCK_GRANTS, MOCK_SHARING_REQUESTS } from '../constants';

interface SettingsProps {
    user: User;
    view: ViewState;
    setView: (view: ViewState) => void;
}

// --- SUB-VIEW: CLIENT HEALTH & PRIVACY (GDPR) ---
const ClientHealthSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'access' | 'anamnesis'>('access');
    const [grants, setGrants] = useState<HealthAccessGrant[]>(MOCK_GRANTS);
    const [requests, setRequests] = useState<DataSharingRequest[]>(MOCK_SHARING_REQUESTS);
    const [token, setToken] = useState<string | null>(null);
    const [showRevokeModal, setShowRevokeModal] = useState<string | null>(null); // Stores Pro ID to revoke

    // Anamnesis State
    const [anamnesis, setAnamnesis] = useState<AnamnesisData>({
        stressLevel: 40,
        sleepQuality: 70,
        digestion: 60,
        energy: 80,
        lastUpdate: new Date().toISOString()
    });

    const handleGenerateToken = () => {
        setToken(`${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    };

    const handleTogglePermission = (proId: string, perm: keyof HealthAccessGrant['permissions']) => {
        setGrants(prev => prev.map(g => {
            if (g.professionalId === proId) {
                // Logic: If 'insertOnly' is true, 'readHistory' must be false, etc.
                const newPerms = { ...g.permissions, [perm]: !g.permissions[perm] };
                if (perm === 'insertOnly' && newPerms.insertOnly) newPerms.readHistory = false;
                if (perm === 'readHistory' && newPerms.readHistory) newPerms.insertOnly = false;
                return { ...g, permissions: newPerms };
            }
            return g;
        }));
    };

    const confirmRevoke = () => {
        if (showRevokeModal) {
            setGrants(prev => prev.filter(g => g.professionalId !== showRevokeModal));
            setShowRevokeModal(null);
        }
    };

    const handleApproveRequest = (req: DataSharingRequest) => {
        // Add new grant based on request
        const newGrant: HealthAccessGrant = {
            professionalId: req.toProId,
            professionalName: req.toProName,
            avatar: req.toProAvatar,
            role: 'Terapeuta Parceiro',
            grantedAt: new Date().toISOString(),
            permissions: { readHistory: true, insertOnly: false, emergency: false }
        };
        setGrants(prev => [newGrant, ...prev]);
        setRequests(prev => prev.filter(r => r.id !== req.id));
    };

    return (
        <div className="h-full flex flex-col pb-24 animate-in slide-in-from-right">
            <div className="flex items-center gap-2 mb-6 px-2">
                <button onClick={onBack}><ChevronLeft size={24} className="text-nature-500" /></button>
                <div>
                    <h2 className="text-2xl font-light text-nature-800">Meu Círculo de <span className="font-semibold">Cuidado</span></h2>
                    <p className="text-xs text-nature-500">Seus dados são seus. Você decide quem vê.</p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex bg-nature-100 p-1 rounded-2xl mx-1 mb-6">
                <button onClick={() => setActiveTab('access')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'access' ? 'bg-white shadow-sm text-primary-700' : 'text-nature-500'}`}>
                    Acessos & LGPD
                </button>
                <button onClick={() => setActiveTab('anamnesis')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'anamnesis' ? 'bg-white shadow-sm text-primary-700' : 'text-nature-500'}`}>
                    Minha Anamnese
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 px-1">
                
                {activeTab === 'access' && (
                    <>
                        {/* 1. INTEROPERABILITY REQUESTS */}
                        {requests.length > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-5 animate-in slide-in-from-top-4">
                                <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2"><Bell size={14} className="animate-pulse" /> Solicitações Pendentes</h3>
                                {requests.map(req => (
                                    <div key={req.id} className="bg-white/60 p-4 rounded-2xl border border-amber-200/50 mb-2">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="relative">
                                                <img src={req.toProAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5"><VerifiedBadge size={10} /></div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-nature-800 leading-tight">
                                                    <span className="font-bold">{req.fromProName}</span> indicou <span className="font-bold">{req.toProName}</span> para acessar seu prontuário.
                                                </p>
                                                <p className="text-[10px] text-nature-500 mt-1 italic">"{req.reason}"</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApproveRequest(req)} className="flex-1 bg-amber-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-amber-700">Autorizar</button>
                                            <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="flex-1 bg-white text-nature-500 border border-nature-200 text-xs font-bold py-2 rounded-lg">Recusar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 2. ACTIVE ACCESS GRANTS */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-nature-400 text-xs uppercase tracking-widest px-2">Quem tem acesso?</h3>
                            
                            {grants.length > 0 ? grants.map(grant => (
                                <div key={grant.professionalId} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm transition-all hover:border-primary-100">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <img src={grant.avatar} className="w-12 h-12 rounded-2xl object-cover bg-nature-50" alt="" />
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <h4 className="font-bold text-nature-800 text-sm">{grant.professionalName}</h4>
                                                    <VerifiedBadge size={12} />
                                                </div>
                                                <p className="text-[10px] text-nature-500">{grant.role}</p>
                                                <p className="text-[10px] text-primary-600 font-medium">Desde {new Date(grant.grantedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold border border-green-100 flex items-center gap-1">
                                            <ShieldCheck size={10} /> Ativo
                                        </div>
                                    </div>

                                    {/* Permissions Toggles */}
                                    <div className="bg-nature-50/50 rounded-2xl p-4 space-y-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${grant.permissions.readHistory ? 'bg-blue-100 text-blue-600' : 'bg-nature-200 text-nature-400'}`}><Eye size={14} /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-nature-700">Leitura Total</p>
                                                    <p className="text-[10px] text-nature-400">Ver histórico passado</p>
                                                </div>
                                            </div>
                                            <Toggle checked={grant.permissions.readHistory} onChange={() => handleTogglePermission(grant.professionalId, 'readHistory')} />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${grant.permissions.insertOnly ? 'bg-amber-100 text-amber-600' : 'bg-nature-200 text-nature-400'}`}><FilePlus size={14} /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-nature-700">Apenas Inserção</p>
                                                    <p className="text-[10px] text-nature-400">Só adiciona, não lê</p>
                                                </div>
                                            </div>
                                            <Toggle checked={grant.permissions.insertOnly} onChange={() => handleTogglePermission(grant.professionalId, 'insertOnly')} />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${grant.permissions.emergency ? 'bg-red-100 text-red-600' : 'bg-nature-200 text-nature-400'}`}><AlertTriangle size={14} /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-nature-700">Emergência 24h</p>
                                                    <p className="text-[10px] text-nature-400">Acesso total temporário</p>
                                                </div>
                                            </div>
                                            <Toggle checked={grant.permissions.emergency} onChange={() => handleTogglePermission(grant.professionalId, 'emergency')} />
                                        </div>
                                    </div>

                                    {/* Panic Button */}
                                    <button 
                                        onClick={() => setShowRevokeModal(grant.professionalId)}
                                        className="w-full py-2.5 rounded-xl border border-red-100 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Lock size={12} /> Revogar Acesso
                                    </button>
                                </div>
                            )) : (
                                <EmptyState title="Círculo Vazio" description="Nenhum profissional tem acesso aos seus dados no momento." icon={<Shield size={32} />} />
                            )}
                        </div>

                        {/* NEW ACCESS TOKEN */}
                        <div className="mt-8 pt-6 border-t border-nature-100">
                            <h4 className="font-bold text-nature-800 text-sm mb-3">Novo Acesso Temporário</h4>
                            {token ? (
                                <div className="bg-nature-800 text-white p-6 rounded-[2rem] text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                                    <p className="text-xs text-nature-300 uppercase tracking-widest mb-2">Token de Acesso</p>
                                    <p className="text-4xl font-mono tracking-widest font-bold mb-4 text-primary-200">{token}</p>
                                    <div className="bg-white/10 rounded-xl p-3 text-[10px] text-nature-200 flex items-start gap-2 text-left">
                                        <Clock size={12} className="shrink-0 mt-0.5" />
                                        Válido por 15 minutos. Mostre este código apenas ao seu terapeuta de confiança no início da consulta.
                                    </div>
                                </div>
                            ) : (
                                <button onClick={handleGenerateToken} className="w-full py-4 bg-white text-nature-700 font-bold rounded-[2rem] border border-nature-200 hover:border-primary-400 hover:text-primary-700 transition-all flex items-center justify-center gap-2 shadow-sm group">
                                    <Key size={18} className="text-nature-400 group-hover:text-primary-500" /> Gerar Token de Acesso
                                </button>
                            )}
                        </div>

                        {/* DATA DOWNLOAD */}
                        <div className="mt-8">
                            <button className="flex items-center gap-2 text-xs text-nature-400 hover:text-primary-600 transition-colors mx-auto">
                                <Download size={12} /> Baixar cópia dos meus dados (JSON)
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'anamnesis' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary-50 p-3 rounded-full text-primary-600"><Activity size={20} /></div>
                                    <div>
                                        <h3 className="font-semibold text-nature-800">Check-up Holístico</h3>
                                        <p className="text-xs text-nature-500">Autoavaliação dinâmica.</p>
                                    </div>
                                </div>
                                <div className="text-xs text-nature-400 italic">Salvo auto.</div>
                            </div>
                            
                            <div className="space-y-4">
                                <RangeSlider label="Nível de Estresse" value={anamnesis.stressLevel} onChange={(v) => setAnamnesis({...anamnesis, stressLevel: v})} minLabel="Zen" maxLabel="Crítico" />
                                <RangeSlider label="Qualidade do Sono" value={anamnesis.sleepQuality} onChange={(v) => setAnamnesis({...anamnesis, sleepQuality: v})} minLabel="Insônia" maxLabel="Reparador" />
                                <RangeSlider label="Digestão" value={anamnesis.digestion} onChange={(v) => setAnamnesis({...anamnesis, digestion: v})} minLabel="Lenta" maxLabel="Leve" />
                                <RangeSlider label="Energia Vital" value={anamnesis.energy} onChange={(v) => setAnamnesis({...anamnesis, energy: v})} minLabel="Baixa" maxLabel="Radiante" />
                            </div>
                        </div>

                        <Accordion title="Corpo Físico" icon={<Heart size={18} />} subtitle="Dores, cirurgias e restrições.">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['Sem Alergias', 'Cirurgia Joelho (2019)', 'Vegetariana', 'Pressão Baixa'].map(tag => (
                                    <span key={tag} className="px-3 py-1.5 bg-nature-50 rounded-lg text-xs text-nature-600 border border-nature-200 flex items-center gap-2">
                                        {tag} <button className="hover:text-red-500"><Trash2 size={10} /></button>
                                    </span>
                                ))}
                                <button className="px-3 py-1.5 bg-white rounded-lg text-xs text-primary-600 border border-dashed border-primary-300 flex items-center gap-1 hover:bg-primary-50">
                                    <Plus size={12} /> Adicionar
                                </button>
                            </div>
                            <textarea placeholder="Descreva dores crônicas ou observações..." className="w-full bg-nature-50 p-3 rounded-xl text-xs text-nature-700 outline-none border-0 h-20 resize-none" />
                        </Accordion>

                        <Accordion title="Mente & Emoção" icon={<Activity size={18} />} subtitle="Histórico e momento atual.">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-nature-400 uppercase">Já fez terapia?</label>
                                    <div className="flex gap-2 mt-1">
                                        <button className="flex-1 py-2 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold">Sim</button>
                                        <button className="flex-1 py-2 bg-white border border-nature-200 text-nature-500 rounded-lg text-xs">Não</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-nature-400 uppercase">Medicamentos</label>
                                    <input type="text" placeholder="Ex: Fitoterápicos..." className="w-full bg-nature-50 p-3 rounded-xl text-xs mt-1 outline-none" />
                                </div>
                            </div>
                        </Accordion>

                        <Accordion title="Espiritualidade" icon={<Sparkles size={18} />} subtitle="Crenças e práticas (Opcional).">
                            <p className="text-xs text-nature-500 mb-3">Isso ajuda o terapeuta a respeitar sua visão de mundo.</p>
                            <div className="flex flex-wrap gap-2">
                                {['Meditação', 'Reiki', 'Cristais', 'Astrologia'].map(tag => (
                                    <button key={tag} className="px-3 py-1.5 bg-white border border-nature-200 rounded-lg text-xs text-nature-500 hover:border-primary-400 hover:text-primary-600">
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </Accordion>

                        <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between border border-blue-100">
                            <div className="flex items-center gap-3">
                                <EyeOff size={18} className="text-blue-500" />
                                <div>
                                    <p className="text-sm font-bold text-blue-800">Privacidade</p>
                                    <p className="text-xs text-blue-600">Visível apenas para meus terapeutas</p>
                                </div>
                            </div>
                            <Toggle checked={true} onChange={() => {}} />
                        </div>
                    </div>
                )}
            </div>

            {/* REVOKE CONFIRMATION SHEET */}
            <BottomSheet isOpen={!!showRevokeModal} onClose={() => setShowRevokeModal(null)} title="Revogar Acesso">
                <div className="space-y-4 pb-4">
                    <div className="flex flex-col items-center text-center mb-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
                            <EyeOff size={32} />
                        </div>
                        <p className="text-nature-600 text-sm leading-relaxed">
                            Tem certeza? O profissional <span className="font-bold">perderá acesso imediato</span> ao seu histórico e não poderá mais registrar evoluções.
                        </p>
                    </div>
                    <button onClick={confirmRevoke} className="w-full bg-red-500 text-white font-bold py-4 rounded-xl hover:bg-red-600 shadow-lg shadow-red-200">
                        Sim, Revogar Acesso
                    </button>
                    <button onClick={() => setShowRevokeModal(null)} className="w-full bg-white text-nature-600 border border-nature-200 font-bold py-4 rounded-xl">
                        Cancelar
                    </button>
                </div>
            </BottomSheet>
        </div>
    );
};

// --- SUB-VIEW: SPACE COMMISSION ENGINE ---
const SpaceCommissionSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [rules, setRules] = useState<CommissionRule[]>([
        { id: '1', targetName: 'Massoterapeutas', targetType: 'role', splitPercentage: 70, isActive: true },
        { id: '2', targetName: 'Dr. Andre', targetType: 'individual', splitPercentage: 80, fixedFee: 50, isActive: true }
    ]);
    const [simulatorValue, setSimulatorValue] = useState(200);

    const handleToggleRule = (id: string) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    };

    const handleUpdateSplit = (id: string, val: number) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, splitPercentage: val } : r));
    };

    return (
        <div className="h-full flex flex-col pb-24 animate-in slide-in-from-right">
            <div className="flex items-center gap-2 mb-6 px-2">
                <button onClick={onBack}><ChevronLeft size={24} className="text-nature-500" /></button>
                <div>
                    <h2 className="text-2xl font-light text-nature-800">Motor de <span className="font-semibold">Split</span></h2>
                    <p className="text-xs text-nature-500">Regras automáticas de comissão.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 px-1">
                {/* 1. SIMULATOR */}
                <div className="bg-nature-800 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                    <h3 className="text-sm font-bold text-nature-300 uppercase tracking-widest mb-4 flex items-center gap-2"><PieChart size={16} /> Simulador Visual</h3>
                    
                    <div className="flex items-end gap-2 mb-6">
                        <div className="flex-1">
                            <label className="text-xs text-nature-400 block mb-1">Valor da Sessão</label>
                            <div className="flex items-center bg-white/10 rounded-xl px-3 py-2">
                                <span className="text-nature-400 mr-1">R$</span>
                                <input 
                                    type="number" 
                                    value={simulatorValue} 
                                    onChange={(e) => setSimulatorValue(Number(e.target.value))} 
                                    className="bg-transparent border-0 outline-none text-white font-bold w-full" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Simulation Bar */}
                    <div className="h-4 bg-white/20 rounded-full overflow-hidden flex mb-2">
                        <div style={{ width: '70%' }} className="bg-primary-400 h-full"></div>
                        <div style={{ width: '30%' }} className="bg-amber-400 h-full"></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-primary-300">70% Terapeuta (R$ {(simulatorValue * 0.7).toFixed(0)})</span>
                        <span className="text-amber-300">30% Espaço (R$ {(simulatorValue * 0.3).toFixed(0)})</span>
                    </div>
                </div>

                {/* 2. RULES LIST */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-bold text-nature-800">Regras Ativas</h3>
                        <button className="text-primary-600 text-xs font-bold uppercase flex items-center gap-1"><Plus size={12} /> Nova Regra</button>
                    </div>

                    {rules.map(rule => (
                        <div key={rule.id} className={`bg-white p-5 rounded-[2rem] border transition-all ${rule.isActive ? 'border-nature-100 shadow-sm' : 'border-nature-100 opacity-60'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${rule.targetType === 'role' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {rule.targetType === 'role' ? <Users size={18} /> : <UserCircle size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-nature-800 text-sm">{rule.targetName}</h4>
                                        <span className="text-[10px] text-nature-400 uppercase tracking-wide">{rule.targetType === 'role' ? 'Cargo / Grupo' : 'Individual'}</span>
                                    </div>
                                </div>
                                <Toggle checked={rule.isActive} onChange={() => handleToggleRule(rule.id)} />
                            </div>

                            {rule.isActive && (
                                <div className="space-y-3 bg-nature-50/50 p-3 rounded-2xl">
                                    <RangeSlider 
                                        label="Comissão do Profissional" 
                                        value={rule.splitPercentage} 
                                        onChange={(v) => handleUpdateSplit(rule.id, v)} 
                                        minLabel="0%" 
                                        maxLabel="100%" 
                                    />
                                    {rule.fixedFee && (
                                        <div className="flex justify-between items-center pt-2 border-t border-nature-200/50">
                                            <span className="text-xs font-medium text-nature-600 flex items-center gap-1"><DollarSign size={12} /> Taxa Fixa (Sala)</span>
                                            <span className="text-xs font-bold text-nature-800">R$ {rule.fixedFee}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
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
                
                {user.role === UserRole.CLIENT && (
                    <HubCard 
                        title="Saúde" 
                        desc="Prontuário & LGPD" 
                        icon={<Activity size={24} className="text-red-500" />} 
                        colorClass="bg-red-50/50" 
                        onClick={() => setView(ViewState.SETTINGS_PRIVACY_HEALTH)}
                    />
                )}

                {user.role === UserRole.PROFESSIONAL && (
                    <HubCard 
                        title="Operacional" 
                        desc="Serviços & Agenda" 
                        icon={<Briefcase size={24} className="text-blue-500" />} 
                        colorClass="bg-blue-50/50" 
                        onClick={() => setView(ViewState.SETTINGS_PRO_SERVICES)}
                    />
                )}

                {user.role === UserRole.SPACE && (
                    <HubCard 
                        title="Comissões" 
                        desc="Split & Regras" 
                        icon={<Percent size={24} className="text-amber-600" />} 
                        colorClass="bg-amber-50/50" 
                        onClick={() => setView(ViewState.SETTINGS_COMMISSION)}
                    />
                )}

                <HubCard 
                    title="Financeiro" 
                    desc={user.role === UserRole.CLIENT ? "Cartões & Recibos" : "Relatórios"} 
                    icon={<CreditCard size={24} className="text-primary-600" />} 
                    colorClass="bg-emerald-50/50" 
                    onClick={() => {}} // Placeholder
                />

                <HubCard 
                    title="Segurança" 
                    desc="Senha & Verificação" 
                    icon={<ShieldCheck size={24} className="text-nature-600" />} 
                    colorClass="bg-nature-100" 
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
        case ViewState.SETTINGS_COMMISSION: return <SpaceCommissionSettings onBack={() => props.setView(ViewState.SETTINGS)} />;
        
        // General Views
        case ViewState.VERIFICATION: return <VerificationView onBack={() => props.setView(ViewState.SETTINGS)} />;
        case ViewState.INVITE_FRIEND: return <InviteView onBack={() => props.setView(ViewState.SETTINGS)} />;
        case ViewState.TERMS: return <TermsView onBack={() => props.setView(ViewState.SETTINGS)} />;
        case ViewState.SUPPORT: return <SupportView onBack={() => props.setView(ViewState.SETTINGS)} />;
        
        // Default Hub
        default: return <SettingsHub {...props} />;
    }
};