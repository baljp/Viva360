import React, { useState, useEffect } from 'react';
import { User, ViewState } from '../../types';
import { Droplet, Heart, Users, Sparkles, TrendingUp, History, Info } from 'lucide-react';
import { PortalView, ZenToast } from '../../components/Common';
import { gardenService, GardenStatus } from '../../services/gardenService';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { api } from '../../services/api';

export const InternalGarden: React.FC<{ user: User, updateUser: (u: User) => void }> = ({ user, updateUser }) => {
    const { go } = useBuscadorFlow();
    const [status, setStatus] = useState<{ status: GardenStatus; health: number; recoveryNeeded: boolean }>(gardenService.getPlantStatus(user));
    const [isWatering, setIsWatering] = useState(false);
    const [activeModal, setActiveModal] = useState<'journey' | null>(!user.plantType ? 'journey' : null);
    const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

    const plantVisuals = gardenService.getPlantVisuals(user.plantStage || 'seed', status.status, user.plantType || 'oak');

    const handleWater = async () => {
        if (isWatering || status.health >= 100) return;
        setIsWatering(true);

        const reward = gardenService.calculateWateringReward(user);
        const updatedUser: User = {
            ...user,
            lastWateredAt: new Date().toISOString(),
            plantHealth: Math.min(100, (user.plantHealth || 0) + 15),
            plantXp: (user.plantXp || 0) + reward.xp,
            karma: (user.karma || 0) + reward.karma
        };

        // Evolution logic
        const stages: string[] = ['seed', 'sprout', 'bud', 'flower', 'tree'];
        const currentIndex = stages.indexOf(user.plantStage || 'seed');
        if (updatedUser.plantXp! >= 100 && currentIndex < stages.length - 1) {
            updatedUser.plantStage = stages[currentIndex + 1] as any;
            updatedUser.plantXp = 0;
            setToast({ title: 'Evolução Detectada!', message: `Sua essência subiu para o nível ${updatedUser.plantStage}.` });
        } else {
            setToast({ title: 'Essência Nutrida', message: `+${reward.xp} PX de Consciência e +${reward.karma} Karma.` });
        }

        updateUser(updatedUser);
        await api.users.update(updatedUser);
        
        setStatus(gardenService.getPlantStatus(updatedUser));
        setTimeout(() => setIsWatering(false), 2000);
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
        await api.users.update(updatedUser);
        setActiveModal(null);
        setToast({ title: 'Jornada Iniciada', message: `Sua semente de ${updatedUser.plantType} foi plantada.` });
    };

    return (
        <PortalView title="Jardim da Alma" subtitle="SEMENTE DA ESSÊNCIA" onBack={() => go('DASHBOARD')}>
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            <div className="flex flex-col h-full bg-gradient-to-b from-transparent to-nature-50/50 pb-32">
                
                {/* Status Bar */}
                <div className="px-8 mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-3xl border border-nature-100 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500"><Heart size={20} fill={status.health > 50 ? "currentColor" : "none"} /></div>
                        <div>
                            <p className="text-[10px] font-black text-nature-400 uppercase tracking-widest leading-none">Vitalidade</p>
                            <span className="text-lg font-bold text-nature-900">{status.health}%</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-nature-100 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600"><TrendingUp size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-nature-400 uppercase tracking-widest leading-none">Progresso</p>
                            <span className="text-lg font-bold text-nature-900">{user.plantXp || 0}/100</span>
                        </div>
                    </div>
                </div>

                {/* Main Garden Stage */}
                <div className="flex-1 flex flex-col items-center justify-center relative py-12">
                    
                    {/* Background Aura */}
                    <div className={`absolute w-64 h-64 rounded-full blur-[80px] opacity-20 transition-colors duration-1000 ${
                        status.status === 'glowing' ? 'bg-emerald-400' : 
                        status.status === 'withered' ? 'bg-amber-900' : 
                        status.status === 'thirsty' ? 'bg-amber-400' : 'bg-primary-400'
                    }`} />

                    {/* Plant Visual */}
                    <div className="relative animate-float" style={{ opacity: plantVisuals.opacity, filter: plantVisuals.filter }}>
                        <span className={`cursor-default select-none transition-all duration-700 hover:scale-110 block ${plantVisuals.color}`} style={{ fontSize: plantVisuals.size }}>
                            {plantVisuals.icon}
                        </span>
                        
                        {isWatering && (
                             <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce">
                                <Droplet className="text-primary-400 fill-primary-400" size={32} />
                             </div>
                        )}
                    </div>

                    <div className="mt-12 text-center space-y-2">
                        <h3 className="text-3xl font-serif italic text-nature-900">{plantVisuals.label}</h3>
                        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${
                             status.status === 'thirsty' || status.status === 'withered' ? 'text-rose-600' : 'text-primary-500'
                        }`}>
                            Status: {status.status === 'glowing' ? 'RADIANTE' : status.status === 'thirsty' ? 'SEDE' : status.status === 'withered' ? 'MURCHA' : 'SAUDÁVEL'}
                        </p>
                    </div>

                    {status.status === 'withered' && (
                        <div className="mt-8 px-12 py-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-pulse">
                            <Info size={16} className="text-rose-500" />
                            <p className="text-[10px] text-rose-600 font-bold uppercase tracking-tight">Sua essência está enfraquecida. Peça uma bênção à sua tribo.</p>
                        </div>
                    )}
                </div>

                {/* Interaction Footer */}
                <div className="px-8 space-y-6">
                    <button 
                        onClick={handleWater}
                        disabled={isWatering || status.health >= 100}
                        className={`w-full py-6 rounded-3xl flex items-center justify-center gap-4 shadow-xl transition-all active:scale-95 relative overflow-hidden group ${
                            status.health >= 100 ? 'bg-nature-100 text-nature-400' : 'bg-nature-900 text-white hover:bg-black'
                        }`}
                    >
                        <div className="absolute inset-0 bg-primary-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <Droplet className={isWatering ? 'animate-bounce' : ''} size={24} />
                        <span className="text-xs font-bold uppercase tracking-[0.3em] relative z-10">
                            {isWatering ? 'NUTRINDO...' : status.health >= 100 ? 'ESSÊNCIA PLENA' : 'REGAR COM INTENÇÃO'}
                        </span>
                    </button>

                    <div className="grid grid-cols-2 gap-4 pb-8">
                        <button className="bg-white p-5 rounded-3xl border border-nature-100 shadow-sm flex flex-col items-center gap-2 hover:border-primary-200 transition-colors">
                            <Users size={20} className="text-primary-600" />
                            <span className="text-[9px] font-bold uppercase text-nature-400">Chamar Tribo</span>
                        </button>
                        <button className="bg-white p-5 rounded-3xl border border-nature-100 shadow-sm flex flex-col items-center gap-2 hover:border-primary-200 transition-colors" onClick={() => go('HISTORY')}>
                            <History size={20} className="text-amber-500" />
                            <span className="text-[9px] font-bold uppercase text-nature-400">Ver Evolução</span>
                        </button>
                    </div>
                </div>

                {/* Journey Selection Modal */}
                {activeModal === 'journey' && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-12 sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-nature-900/60 backdrop-blur-sm transition-opacity" onClick={() => {}} />
                        <div className="relative bg-white rounded-[3rem] p-8 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom duration-500">
                            <div className="text-center space-y-4 mb-8">
                                <h3 className="text-3xl font-serif italic text-nature-900">Escolha seu Caminho</h3>
                                <p className="text-xs text-nature-500 leading-relaxed px-4">Sua essência se manifestará de forma única conforme o foco da sua jornada no Viva360.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto px-2 py-4">
                                {[
                                    { id: 'emocional', label: 'Cura Emocional', plant: 'Lótus', icon: '🪷', color: 'text-rose-400' },
                                    { id: 'mental', label: 'Clareza & Energia', plant: 'Girassol', icon: '🌻', color: 'text-amber-500' },
                                    { id: 'forca', label: 'Estabilidade', plant: 'Carvalho', icon: '🌳', color: 'text-emerald-700' },
                                    { id: 'espiritual', label: 'Paz Interior', plant: 'Lavanda', icon: '🪻', color: 'text-purple-500' },
                                    { id: 'transforma', label: 'Metamorfose', plant: 'Fada Azul', icon: '🦋', color: 'text-blue-500' }
                                ].map(j => (
                                    <button 
                                        key={j.id} 
                                        onClick={() => selectJourney(j.id)}
                                        className="flex items-center gap-5 p-5 bg-nature-50 rounded-[2rem] border border-nature-100 hover:border-primary-300 hover:bg-white transition-all text-left"
                                    >
                                        <span className={`text-4xl ${j.color}`}>{j.icon}</span>
                                        <div>
                                            <h4 className="font-bold text-sm text-nature-900">{j.label}</h4>
                                            <p className="text-[10px] text-nature-400 uppercase font-black">Plante uma {j.plant}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </PortalView>
    );
};
