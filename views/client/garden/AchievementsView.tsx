import React from 'react';
import { User } from '../../../types';
import { PortalView } from '../../../components/Common';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Sparkles, Lock, CheckCircle2 } from 'lucide-react';

export const AchievementsView: React.FC<{ user: User }> = ({ user }) => {
    const { go } = useBuscadorFlow();

    const milestones = [
        { id: '1req', label: 'Primeiro Alento', sub: 'Completou o 1º Ritual', icon: '🌱', unlocked: true },
        { id: '7days', label: 'Caminho de Fogo', sub: '7 dias em constância', icon: '🔥', unlocked: (user.streak || 0) >= 7 },
        { id: '30days', label: 'Raízes Profundas', sub: '30 dias na jornada', icon: '🌳', unlocked: (user.streak || 0) >= 30 },
        { id: 'spirit', label: 'Aliança Animal', sub: 'Apoiou 10 almas na tribo', icon: '🦊', unlocked: (user.tribeInteractions || 0) >= 10 },
        { id: 'crystal', label: 'Cristal de Luz', sub: '90% de positividade semanal', icon: '💎', unlocked: false }
    ];

    return (
        <PortalView title="Conquistas" subtitle="MARCOS DA ALMA" onBack={() => go('EVOLUTION')} heroImage="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800">
            <div className="flex flex-col h-full bg-nature-50/20 px-6 pt-8 pb-32">
                
                <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-8 rounded-[3rem] text-white shadow-2xl shadow-amber-900/20 mb-10 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Coleção de Sementes</p>
                        <h3 className="text-3xl font-serif italic mb-4">Seu Tesouro Interior</h3>
                        <div className="flex gap-4 items-center">
                            <div className="px-4 py-2 bg-white/20 backdrop-blur rounded-2xl flex items-center gap-2">
                                <span className="text-xl">✨</span>
                                <span className="text-sm font-bold">1,240</span>
                            </div>
                            <div className="px-4 py-2 bg-white/20 backdrop-blur rounded-2xl flex items-center gap-2">
                                <span className="text-xl">💎</span>
                                <span className="text-sm font-bold">3</span>
                            </div>
                        </div>
                    </div>
                    <Sparkles size={120} className="absolute -bottom-8 -right-8 text-white/10 rotate-12" />
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-nature-400 uppercase tracking-[0.2em] ml-2">Jornada Evolutiva</h4>
                    {milestones.map((m) => (
                        <div key={m.id} className={`p-6 rounded-[2.5rem] border flex items-center gap-6 transition-all ${m.unlocked ? 'bg-white border-white shadow-sm' : 'bg-nature-100/50 border-transparent opacity-60'}`}>
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl ${m.unlocked ? 'bg-amber-50 shadow-inner' : 'bg-nature-200'}`}>
                                {m.unlocked ? m.icon : <Lock size={20} className="text-nature-400" />}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm ${m.unlocked ? 'text-nature-900' : 'text-nature-400'}`}>{m.label}</h4>
                                <p className="text-[10px] text-nature-500 uppercase font-black tracking-widest mt-1">{m.sub}</p>
                            </div>
                            {m.unlocked && <CheckCircle2 size={24} className="text-emerald-500 fill-emerald-50" />}
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-8 bg-indigo-900/5 rounded-[3rem] border border-indigo-100 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-4xl mb-4">🦊</div>
                    <h4 className="font-serif italic text-lg text-indigo-900 mb-2">Manifestação Animal</h4>
                    <p className="text-xs text-indigo-600/60 font-medium px-4">
                        Continue sua jornada para descobrir qual ser espiritual está se sintonizando com sua energia hoje.
                    </p>
                </div>

            </div>
        </PortalView>
    );
};
