import React, { useMemo, useState } from 'react';
import { User } from '../../types';
import { Heart, Share2, Sparkles, X } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { gardenService, GardenStatus } from '../../services/gardenService';
import { useBuscadorFlow } from '../../src/flow/useBuscadorFlow';
import { api } from '../../services/api';
import { generateShareCanvas, shareToSocial } from '../../src/utils/sharing';
import { useIdbImageUrl } from '../../src/hooks/useIdbImageUrl';
import { buildLocalImageKey } from '../../src/utils/idbImageStore';
import { buildSoulJourneyModel } from './garden/soulJourneyModel';

export const InternalGarden: React.FC<{ user: User, updateUser: (u: User) => void, onClose?: () => void }> = ({ user, updateUser, onClose }) => {
    const { go, notify} = useBuscadorFlow();
    const [status] = useState<{ status: GardenStatus; health: number; recoveryNeeded: boolean }>(gardenService.getPlantStatus(user));
    const [activeModal, setActiveModal] = useState<'journey' | 'tribe' | null>(!user.plantType ? 'journey' : null);

    const plantVisuals = gardenService.getPlantVisuals(user.plantStage || 'seed', status.status, user.plantType || 'oak');
    const evolution = gardenService.calculateEvolution(user);
    const evolutionState = gardenService.getEvolutionState(evolution.total);
    const latestSnap = (user.snaps || [])[0];
    const latestSnapSrc = useIdbImageUrl(latestSnap?.id ? buildLocalImageKey(String(latestSnap.id)) : null, latestSnap?.image || '');
    const journeyModel = useMemo(() => buildSoulJourneyModel(user), [user]);

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
            journeyType: type,
            plantType: gardenService.getVarietyByJourney(type),
            plantStage: 'seed' as const,
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
            
            <>
                    <div className="flex flex-col h-full bg-gradient-to-b from-transparent to-nature-50/50 pb-32">
                        <div className="px-6 mt-6">
                            <section className="overflow-hidden rounded-[2.5rem] border border-white/60 bg-[linear-gradient(135deg,#f6fbf8_0%,#ffffff_55%,#eef6f0_100%)] shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                                <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.9fr]">
                                    <div className="space-y-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-nature-400">Jardim da Alma</p>
                                                <h3 className="mt-2 font-serif text-3xl italic text-nature-900">
                                                    {journeyModel.stageGlyph} {journeyModel.stageLabel}
                                                </h3>
                                                <p className="mt-2 max-w-md text-sm leading-relaxed text-nature-500">
                                                    {journeyModel.latestReflection}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${journeyModel.vitalityClassName}`}>
                                                {journeyModel.vitalityLabel}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                            {journeyModel.metrics.map((metric) => (
                                                <div key={metric.label} className="rounded-[1.6rem] border border-nature-100 bg-white/80 p-4 shadow-sm">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-nature-400">{metric.label}</p>
                                                    <p className="mt-2 text-lg font-bold text-nature-900">{metric.value}</p>
                                                    <p className="mt-1 text-[11px] text-nature-400">{metric.helper}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <button
                                                onClick={() => setActiveModal('tribe')}
                                                className="rounded-[1.8rem] border border-nature-100 bg-white px-4 py-4 text-left shadow-sm transition-all active:scale-95"
                                            >
                                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                                    <Heart size={18} />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-nature-400">Cuidado Coletivo</p>
                                                <p className="mt-1 text-sm font-bold text-nature-900">Pedir apoio da tribo</p>
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const stageLabel = `${user.plantStage?.toUpperCase() || 'SEMENTE'} DE ${gardenService.getPlantLabel(user.plantType || 'oak').toUpperCase()}`;
                                                    let inviteUrl: string | undefined;
                                                    try {
                                                        const created = await api.invites.create({ kind: 'tribo', targetRole: 'CLIENT' });
                                                        inviteUrl = String((created as Record<string, unknown>)?.url || '').trim() || undefined;
                                                    } catch {
                                                        // ignore
                                                    }
                                                    const blob = await generateShareCanvas({
                                                        title: 'Meu Jardim da Alma',
                                                        subtitle: stageLabel,
                                                        message: `${evolutionState.label} • Vitalidade ${status.health}%\n\nVem plantar a sua semente comigo.`,
                                                        imageUrl: latestSnapSrc || latestSnap?.image || 'https://images.unsplash.com/photo-1592323287019-2169b1834225?q=80&w=1080',
                                                        accentColor: '#10b981',
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
                                                className="rounded-[1.8rem] border border-nature-100 bg-white px-4 py-4 text-left shadow-sm transition-all active:scale-95"
                                            >
                                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                    <Share2 size={18} />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-nature-400">Partilha Viva</p>
                                                <p className="mt-1 text-sm font-bold text-nature-900">Compartilhar meu jardim</p>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative overflow-hidden rounded-[2.2rem] bg-nature-950">
                                        {latestSnapSrc || latestSnap?.image ? (
                                            <img
                                                src={latestSnapSrc || latestSnap?.image}
                                                alt="Último registro da alma"
                                                className="h-full min-h-[320px] w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex min-h-[320px] h-full items-center justify-center bg-[radial-gradient(circle_at_top,#284438,#111827_65%)] text-7xl">
                                                {plantVisuals.icon}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50">Último reflexo</p>
                                            <p className="mt-2 text-2xl font-serif italic leading-tight">
                                                {latestSnap?.note || 'Sua próxima metamorfose começa com um único registro.'}
                                            </p>
                                            <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/60">
                                                <Heart size={14} className="text-rose-300" />
                                                <span>{journeyModel.dominantMood}</span>
                                                <span>•</span>
                                                <span>{journeyModel.entriesCount} memórias</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
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

                        <div className="px-6">
                            <div className="rounded-[2rem] border border-white/60 bg-white/80 px-5 py-5 text-center shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-nature-400">Presença do Jardim</p>
                                <p className="mt-3 text-sm leading-relaxed text-nature-500">
                                    Aqui você contempla sinais, vitalidade e o último reflexo da sua jornada. Os rituais ativos continuam no início do perfil para manter o fluxo mais limpo.
                                </p>
                            </div>
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
        </PortalView>
    );
};
