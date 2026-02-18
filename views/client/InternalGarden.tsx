import React, { useState, useEffect } from 'react';
import { User, ViewState } from '../../types';
import { Droplet, Heart, Users, Sparkles, TrendingUp, History, Info, Leaf, Share2, X } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { gardenService, GardenStatus } from '../../services/gardenService';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { api } from '../../services/api';
import { DailyRitualWizard } from './garden/DailyRitualWizard';
import { generateShareCanvas, shareToSocial } from '../../src/utils/sharing';
import { useIdbImageUrl } from '../../src/hooks/useIdbImageUrl';
import { buildLocalImageKey } from '../../src/utils/idbImageStore';

export const InternalGarden: React.FC<{ user: User, updateUser: (u: User) => void, onClose?: () => void }> = ({ user, updateUser, onClose }) => {
    const { go, back, notify} = useBuscadorFlow();
    const [status, setStatus] = useState<{ status: GardenStatus; health: number; recoveryNeeded: boolean }>(gardenService.getPlantStatus(user));
    const [isRitualActive, setIsRitualActive] = useState(false);
    const [activeModal, setActiveModal] = useState<'journey' | 'tribe' | null>(!user.plantType ? 'journey' : null);

    const plantVisuals = gardenService.getPlantVisuals(user.plantStage || 'seed', status.status, user.plantType || 'oak');
    const evolution = gardenService.calculateEvolution(user);
    const evolutionState = gardenService.getEvolutionState(evolution.total);
    const latestSnap = (user.snaps || [])[0];
    const latestSnapSrc = useIdbImageUrl(latestSnap?.id ? buildLocalImageKey(String(latestSnap.id)) : null, latestSnap?.image || '');

    const handleRitualComplete = (updatedUser: User) => {
        updateUser(updatedUser);
        setStatus(gardenService.getPlantStatus(updatedUser));
        setIsRitualActive(false);
        notify('Ciclo Concluído', 'Seu jardim floresce com sua presença.', 'info');
    };

    const handleTribeAction = (action: 'BLESSING' | 'UNION' | 'PACT') => {
        setActiveModal(null);
        if (action === 'BLESSING') {
            notify('Pedido Enviado', 'Sua tribo foi notificada da sua necessidade de apoio.', 'info');
        } else if (action === 'UNION') {
            go('TRIBE_INTERACTION');
        } else if (action === 'PACT') {
            go('TRIBE_DASH');
        }
    };

    const selectJourney = async (type: string) => {
        const updatedUser = { 
            ...user, 
            journeyType: type as any,
            plantType: gardenService.getVarietyByJourney(type) as any,
            plantStage: 'seed' as any,
            plantXp: 0,
            plantHealth: 100
        };
        updateUser(updatedUser);
        // Close modal first so the user is never blocked by network latency.
        setActiveModal(null);
        try {
            await api.users.update(updatedUser);
        } catch {
            notify('Jornada iniciada localmente', 'Sincronizando seu jardim. Tente novamente se não atualizar.', 'info');
            return;
        }
        notify('Jornada Iniciada', `Sua semente de ${gardenService.getPlantLabel(updatedUser.plantType || 'oak')} foi plantada.`, 'success');
    };

    // Helper text for Vitality
    const getVitalityText = (health: number) => {
        if (health > 80) return "Florescendo";
        if (health > 50) return "Estável";
        if (health > 20) return "Em Recuperação";
        return "Crítico";
    };

    return (
        <PortalView 
            title="Jardim da Alma" 
            subtitle="NÚCLEO VIVO" 
            onBack={() => go('DASHBOARD')} 
            onClose={onClose || (() => go('DASHBOARD'))} 
            heroImage="https://images.unsplash.com/photo-1592323287019-2169b1834225?q=80&w=800"
        >
            
            {isRitualActive ? (
                <DailyRitualWizard user={user} updateUser={handleRitualComplete} onClose={() => setIsRitualActive(false)} />
            ) : (
                <>
                    <div className="flex flex-col h-full bg-gradient-to-b from-transparent to-nature-50/50 pb-32">
                        
                        {/* Living Status Bar */}
                        <div className="px-6 mt-6 grid grid-cols-2 gap-4">
                             <div className="bg-white/85 backdrop-blur-md p-5 rounded-[2rem] border border-black/5 shadow-[0_12px_30px_rgba(0,0,0,0.08)] flex items-center gap-4">
                                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-inner ${status.health > 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                    <Heart size={24} fill="currentColor" className="animate-pulse" />
                                </div>
                                <div className="min-h-[40px] flex flex-col justify-center">
                                    <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest">Vitalidade</p>
                                    <span className={`text-sm font-bold truncate leading-tight ${status.health > 50 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                        {getVitalityText(status.health)}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white/85 backdrop-blur-md p-5 rounded-[2rem] border border-black/5 shadow-[0_12px_30px_rgba(0,0,0,0.08)] flex items-center gap-4">
                                <div className="w-12 h-12 shrink-0 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                    <Leaf size={24} />
                                </div>
                                <div className="min-h-[40px] flex flex-col justify-center">
                                    <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest">Jornada</p>
                                    <span className="text-sm font-bold text-nature-900 truncate leading-tight line-clamp-2">
                                        {user.plantStage === 'seed' && user.plantType 
                                            ? `SEMENTE DE ${gardenService.getPlantLabel(user.plantType).toUpperCase()}`
                                            : user.plantStage?.toUpperCase() || 'SEMENTE'}
                                    </span>
                                </div>
                            </div>

                        </div>

                        {/* Evolution Quick Indicators */}
                        <div className="px-6 mt-4 flex justify-between gap-2">
                            {[
                                { icon: <TrendingUp size={14} />, label: 'Constância', value: `${user.streak || 0} dias`, color: 'text-amber-600' },
                                { icon: <Heart size={14} />, label: 'Humor', value: `${Math.floor(evolution.positivity)}%`, color: 'text-rose-500' },
                                { icon: <Sparkles size={14} />, label: 'Energia', value: evolution.total > 70 ? 'Alta' : 'Normal', color: 'text-primary-500' },
                                { icon: <Users size={14} />, label: 'Tribo', value: `${user.constellation?.length || 0} conexões`, color: 'text-indigo-500' }
                            ].map((stat, i) => (
                                <div key={i} className="flex-1 bg-white/40 backdrop-blur-sm p-2 rounded-2xl border border-white/50 text-center min-w-0">
                                    <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
                                    <p className="text-[10px] font-black text-nature-400 uppercase tracking-tight truncate">{stat.label}</p>
                                    <p className="text-[11px] font-bold text-nature-900 truncate">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Living Plant Stage */}
                        <div className="flex-1 flex flex-col items-center justify-center relative py-8 group">
                            {/* Interactive Aura */}
                            <div className={`absolute w-80 h-80 rounded-full blur-[100px] opacity-30 transition-all duration-[2000ms] animate-breathe ${
                                status.status === 'glowing' ? 'bg-emerald-400 scale-125' : 
                                status.status === 'withered' ? 'bg-amber-900 scale-90' : 
                                status.status === 'thirsty' ? 'bg-amber-400' : 'bg-primary-400'
                            }`} />

                            {/* The Living Plant */}
                            <div className="relative z-10 animate-float" style={{ opacity: plantVisuals.opacity, filter: plantVisuals.filter }}>
                                <span className={`cursor-pointer select-none transition-transform duration-1000 group-hover:scale-110 block drop-shadow-2xl ${plantVisuals.color}`} style={{ fontSize: plantVisuals.size }}>
                                    {plantVisuals.icon}
                                </span>
                            </div>

                            <div className="mt-8 text-center space-y-3 relative z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/30 backdrop-blur-md rounded-full border border-white/20">
                                    <Sparkles size={12} className="text-amber-400" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-nature-800">
                                        Seu Jardim hoje: {evolutionState.symbol} {evolutionState.label.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="px-6 space-y-4">
                             <button 
                                onClick={() => setIsRitualActive(true)}
                                className="w-full py-6 rounded-[2.5rem] bg-[#1f2f2a] text-[#f5f5f2] shadow-[0_18px_40px_rgba(0,0,0,0.25)] active:scale-95 transition-all relative overflow-hidden group border border-white/10"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#1f2f2a] to-[#2a3f39] group-hover:scale-105 transition-transform duration-1000"></div>
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    <Droplet size={20} className="fill-[#f5f5f2] animate-bounce" />
                                    <span className="text-xs font-bold uppercase tracking-[0.25em]">Regar com Intenção</span>
                                </div>
                                <p className="relative z-10 text-[9px] text-[#f5f5f2]/50 uppercase tracking-widest mt-1">Ritual Diário • 1 min</p>
                            </button>


                            <button 
                                onClick={async () => {
                                    const stageLabel = `${user.plantStage?.toUpperCase() || 'SEMENTE'} DE ${gardenService.getPlantLabel(user.plantType || 'oak').toUpperCase()}`;
                                    let inviteUrl: string | undefined;
                                    try {
                                        const created = await api.invites.create({ kind: 'tribo', targetRole: 'CLIENT' });
                                        inviteUrl = String((created as any)?.url || '').trim() || undefined;
                                    } catch {
                                        // ignore
                                    }
                                    const blob = await generateShareCanvas({
                                        title: 'Meu Jardim da Alma',
                                        subtitle: stageLabel,
                                        message: `${evolutionState.label} • Vitalidade ${status.health}%\n\nVem plantar a sua semente comigo.`,
                                        imageUrl: latestSnapSrc || latestSnap?.image || 'https://images.unsplash.com/photo-1592323287019-2169b1834225?q=80&w=1080',
                                        accentColor: '#10b981', // Emerald for Garden
                                        footer: 'FLORESCENDO NO VIVA360',
                                        date: new Date().toLocaleDateString('pt-BR'),
                                        format: 'story',
                                        mimeType: 'image/jpeg',
                                        overlayIcon: { text: plantVisuals.icon, size: 160 },
                                    });

                                    if (blob) {
                                        await shareToSocial(blob, {
                                            platform: 'whatsapp',
                                            title: 'Meu Jardim da Alma • Viva360',
                                            text: `🌿 ${stageLabel}\n${plantVisuals.icon} Vitalidade: ${status.health}%\n${evolutionState.label}\n\nVem plantar a sua semente comigo no Viva360.`,
                                            ...(inviteUrl ? { url: inviteUrl } : {}),
                                            filename: `viva360-jardim-${new Date().toISOString().slice(0, 10)}.jpg`,
                                        });
                                    }
                                }}
                                className="w-full py-5 rounded-2xl bg-white border border-nature-200 text-nature-600 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-nature-50 transition-colors shadow-sm"
                            >
                                <Share2 size={16} /> Compartilhar meu Jardim
                            </button>
                        </div>
                    </div>

                    {/* Journey Selection Modal */}
                    {activeModal === 'journey' && (
                        // NOTE: Must sit above PortalView (z-[150]) to avoid stacked headers/buttons at boot.
                        <div className="fixed inset-0 z-[320] flex items-end justify-center px-4 pb-12 sm:items-center sm:p-0">
                            <div
                                className="absolute inset-0 bg-nature-900/60 backdrop-blur-md transition-opacity"
                                onClick={() => setActiveModal(null)}
                            />
                            <div className="relative z-10 bg-white rounded-[3rem] p-8 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom duration-500">
                                <button 
                                    onClick={() => setActiveModal(null)}
                                    className="absolute top-8 right-8 p-3 bg-nature-50 text-nature-400 rounded-2xl hover:bg-nature-100 transition-colors z- relative"
                                >
                                    <X size={20} />
                                </button>
                                
                                <div className="text-center space-y-4 mb-8">
                                    <h3 className="text-3xl font-serif italic text-nature-900">Escolha seu Caminho</h3>
                                    <p className="text-xs text-nature-500 leading-relaxed px-8">Qual semente você deseja plantar em sua alma hoje?</p>
                                </div>
                                
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                                    {[
                                        { id: 'emocional', label: 'Cura Emocional', plant: 'Lótus', icon: '🪷', color: 'bg-rose-50 text-rose-600' },
                                        { id: 'mental', label: 'Clareza', plant: 'Girassol', icon: '🌻', color: 'bg-amber-50 text-amber-600' },
                                        { id: 'forca', label: 'Força', plant: 'Carvalho', icon: '🌳', color: 'bg-emerald-50 text-emerald-600' },
                                        { id: 'espiritual', label: 'Paz', plant: 'Lavanda', icon: '🪻', color: 'bg-purple-50 text-purple-600' },
                                        { id: 'transforma', label: 'Metamorfose', plant: 'Orquídea', icon: '🌸', color: 'bg-purple-50 text-purple-600' }
                                    ].map(j => (
                                        <button 
                                            key={j.id} 
                                            onClick={() => selectJourney(j.id)}
                                            className="w-full flex items-center gap-4 p-4 rounded-[2rem] border border-nature-100 hover:border-nature-300 transition-all group"
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${j.color}`}>{j.icon}</div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-sm text-nature-900">{j.label}</h4>
                                                <p className="text-[10px] text-nature-400 uppercase font-bold tracking-wider">Plantar {j.plant}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tribe Integration Modal */}
                    {activeModal === 'tribe' && (
                        // NOTE: Must sit above PortalView (z-[150]) to avoid stacked headers/buttons at boot.
                        <div className="fixed inset-0 z-[320] flex items-end justify-center px-4 pb-12 sm:items-center sm:p-0">
                             <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-md transition-opacity" onClick={() => setActiveModal(null)} />
                             <div className="relative z-10 bg-white rounded-[3rem] p-8 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom duration-500 space-y-6">
                                <button 
                                    onClick={() => setActiveModal(null)}
                                    className="absolute top-8 right-8 p-3 bg-nature-50 text-nature-400 rounded-2xl hover:bg-nature-100 transition-colors z-20"
                                >
                                    <X size={20} />
                                </button>
                                <div className="text-center">
                                     <h3 className="text-2xl font-serif italic text-nature-900 mb-2">Peça apoio à sua Tribo</h3>
                                     <p className="text-sm text-nature-500">Sua energia influencia o crescimento do seu jardim.</p>
                                </div>
                                <div className="space-y-3">
                                     <button onClick={() => handleTribeAction('BLESSING')} className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 font-bold text-sm flex items-center gap-4 hover:bg-indigo-100 transition-colors">
                                         <span className="text-2xl">✨</span> Enviar pedido de bênção
                                     </button>
                                     <button onClick={() => handleTribeAction('UNION')} className="w-full p-4 bg-fuchsia-50 border border-fuchsia-100 rounded-2xl text-fuchsia-900 font-bold text-sm flex items-center gap-4 hover:bg-fuchsia-100 transition-colors">
                                         <span className="text-2xl">🤲</span> Unir energia agora
                                     </button>
                                     <button onClick={() => handleTribeAction('PACT')} className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-900 font-bold text-sm flex items-center gap-4 hover:bg-emerald-100 transition-colors">
                                         <span className="text-2xl">🌱</span> Criar pacto coletivo
                                     </button>
                                </div>
                             </div>
                        </div>
                    )}
                </>
            )}
        </PortalView>
    );
};
