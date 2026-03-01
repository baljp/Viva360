import React from 'react';
import { User } from '../../../types';
import { PortalView } from '../../../components/Common';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { gardenService } from '../../../services/gardenService';
import { Heart, Zap, Users, Shield, Sparkles } from 'lucide-react';

export const EvolutionAnalytics: React.FC<{ user: User }> = ({ user }) => {
    const { go } = useBuscadorFlow();
    const evolution = gardenService.calculateEvolution(user);

    const metrics = [
        { label: 'Sintonias da Alma', value: `${evolution.positivity}%`, sub: 'Positividade Predominante', icon: <Heart className="text-rose-500" />, color: 'bg-rose-50' },
        { label: 'Presença Contínua', value: `${user.streak || 0} dias`, sub: 'Recorde Pessoal: 12 dias', icon: <Shield className="text-amber-500" />, color: 'bg-amber-50' },
        { label: 'Energia Vital', value: evolution.total > 70 ? 'Radiante' : 'Equilibrada', sub: 'Fluxo Energético', icon: <Zap className="text-primary-500" />, color: 'bg-primary-50' },
        { label: 'Raízes Coletivas', value: `${user.constellation?.length || 0}`, sub: 'Conexões de Apoio', icon: <Users className="text-indigo-500" />, color: 'bg-indigo-50' }
    ];

    return (
        <PortalView title="Métricas" subtitle="HARMONIA INTERIOR" onBack={() => go('EVOLUTION')} heroImage="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800">
            <div className="flex flex-col h-full bg-nature-50/20 px-6 pt-8 pb-32">
                
                <div className="bg-white p-8 rounded-[3rem] border border-white shadow-xl shadow-nature-900/5 mb-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <Sparkles size={20} className="text-amber-400 opacity-50" />
                    </div>
                    <p className="text-[10px] font-black text-nature-400 uppercase tracking-[0.2em] mb-2">Clareza Emocional</p>
                    <h3 className="text-5xl font-serif italic text-nature-900 mb-4">{evolution.total}%</h3>
                    <p className="text-xs text-nature-500 leading-relaxed px-4">
                        Sua evolução reflete o cuidado diário com seu jardim interior e sua tribo.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-white shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                            <div className={`w-16 h-16 ${m.color} rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                                {m.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-nature-900">{m.value}</h4>
                                <p className="text-[10px] text-nature-500 font-bold uppercase tracking-widest">{m.label}</p>
                                <p className="text-[9px] text-nature-300 uppercase tracking-widest mt-1">{m.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dynamic Emotional Distribution */}
                <div className="mt-8 bg-nature-900 p-8 rounded-[3rem] text-white">
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-6">Mapa dos Sentires</h4>
                    {evolution.total > 0 && evolution.breakdown && evolution.breakdown.length > 0 ? (
                        <div className="space-y-4">
                            {(evolution.breakdown as { label: string; percent: number }[]).slice(0, 5).map((mood, idx: number) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                                        <span>{mood.label}</span>
                                        <span>{mood.percent}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${['bg-amber-400', 'bg-blue-400', 'bg-rose-400', 'bg-emerald-400', 'bg-indigo-400'][idx % 5]}`} 
                                            style={{ width: `${mood.percent}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 opacity-50">
                            <p className="text-xs">Ainda não há registros suficientes para traçar seu mapa emocional.</p>
                            <p className="text-[10px] mt-2 uppercase tracking-widest">Continue nutrindo seu jardim.</p>
                        </div>
                    )}
                </div>

            </div>
        </PortalView>
    );
};
