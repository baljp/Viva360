import React, { useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { PortalView, ZenToast } from '../../../components/Common';
import { Sparkles, TrendingUp, Gift, ShoppingBag, Users, Zap, History, Lock, ArrowRight } from 'lucide-react';
import { User } from '../../../types';

export default function KarmaWallet({ user }: { user: User }) {
    const { back, go } = useBuscadorFlow();
    const [activeTab, setActiveTab] = useState<'history' | 'earn' | 'rewards'>('history');

    // Mock History
    const history = [
        { id: 1, action: 'Check-in Diário', amount: +5, date: 'Hoje, 08:00', type: 'earn' },
        { id: 2, action: 'Ritual Matinal', amount: +10, date: 'Hoje, 08:15', type: 'earn' },
        { id: 3, action: 'Referência (Convite)', amount: +50, date: 'Ontem', type: 'earn' },
        { id: 4, action: 'Cupom Bazar', amount: -100, date: '3 dias atrás', type: 'spend' },
    ];

    // Levels logic
    const levelParams = [
        { level: 1, name: 'Semente', min: 0, max: 100 },
        { level: 2, name: 'Raíz', min: 101, max: 500 },
        { level: 3, name: 'Broto', min: 501, max: 1000 },
        { level: 4, name: 'Flor', min: 1001, max: 2500 },
        { level: 5, name: 'Fruto', min: 2501, max: 5000 },
    ];

    const currentKarma = user.karma || 0;
    const currentLevel = levelParams.find(l => currentKarma >= l.min && currentKarma <= l.max) || levelParams[levelParams.length - 1];
    const nextLevel = levelParams.find(l => l.level === currentLevel.level + 1);
    const progress = nextLevel 
        ? ((currentKarma - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 
        : 100;

    return (
        <PortalView 
            title="Karma & Energia" 
            subtitle="SUA CARTEIRA" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800"
        >
            <div className="px-4 pb-24 space-y-6">
                
                {/* Balance Card */}
                <div className="bg-nature-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-[80px] -mr-32 -mt-32 opacity-20"></div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 mb-4">
                            <Sparkles size={12} className="text-amber-400" />
                            <span>Nível {currentLevel.level}: {currentLevel.name}</span>
                        </div>

                        <div className="text-6xl font-serif italic mb-2 tracking-tighter text-amber-50 drop-shadow-lg">
                            {currentKarma}
                        </div>
                        <p className="text-[10px] font-bold text-nature-300 uppercase tracking-[0.3em]">Saldo de Karma</p>

                        {/* Progress Bar */}
                        <div className="mt-8">
                            <div className="flex justify-between text-[9px] font-bold uppercase text-nature-400 mb-2">
                                <span>{currentLevel.name}</span>
                                <span>{nextLevel ? nextLevel.name : 'Mestre'}</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>
                            {nextLevel && (
                                <p className="text-[9px] text-nature-400 mt-2 text-right">Faltam {nextLevel.min - currentKarma} para evoluir</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="p-1 bg-white rounded-2xl flex gap-1 border border-nature-100 shadow-sm">
                    {[
                        { id: 'history', label: 'Extrato', icon: History },
                        { id: 'earn', label: 'Ganhar', icon: TrendingUp },
                        { id: 'rewards', label: 'Trocar', icon: Gift }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${activeTab === tab.id ? 'bg-nature-50 text-nature-900 ring-1 ring-nature-200' : 'text-nature-400 hover:bg-nature-50'}`}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'text-indigo-600' : 'text-nature-300'} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="animate-in slide-in-from-bottom duration-300">
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {history.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-[2rem] border border-nature-100 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.type === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {item.type === 'earn' ? <TrendingUp size={18}/> : <ShoppingBag size={18}/>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-nature-900">{item.action}</h4>
                                            <p className="text-[10px] text-nature-400 uppercase font-bold">{item.date}</p>
                                        </div>
                                    </div>
                                    <span className={`font-mono font-bold ${item.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {item.amount > 0 ? '+' : ''}{item.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'earn' && (
                        <div className="space-y-3">
                            <div onClick={() => go('METAMORPHOSIS_CHECKIN')} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500"><Zap size={24}/></div>
                                    <div>
                                        <h4 className="font-bold text-sm text-nature-900">Check-in Diário</h4>
                                        <p className="text-[10px] text-indigo-500 uppercase font-bold">+5 Karma</p>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="text-nature-300"/>
                            </div>

                            <div onClick={() => go('TRIBE_INVITE')} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><Users size={24}/></div>
                                    <div>
                                        <h4 className="font-bold text-sm text-nature-900">Convidar Amigos</h4>
                                        <p className="text-[10px] text-emerald-500 uppercase font-bold">+50 Karma</p>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="text-nature-300"/>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rewards' && (
                        <div className="space-y-3">
                            <div onClick={() => go('MARKETPLACE')} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden group cursor-pointer">
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Cupom de Desconto</p>
                                        <h3 className="font-serif text-2xl italic">10% OFF no Bazar</h3>
                                        <p className="text-xs font-bold mt-2 bg-white/20 inline-block px-3 py-1 rounded-lg">Custo: 100 Karma</p>
                                    </div>
                                    <ShoppingBag size={40} className="opacity-50 group-hover:scale-110 transition-transform"/>
                                </div>
                            </div>

                             <div className="bg-nature-100 p-6 rounded-[2.5rem] opacity-70 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-nature-200 rounded-2xl flex items-center justify-center text-nature-500"><Lock size={20}/></div>
                                    <div>
                                        <h4 className="font-bold text-sm text-nature-500">Mentoria Exclusiva</h4>
                                        <p className="text-[10px] text-nature-400 uppercase font-bold">Nível Broto Necessário</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

            </div>
        </PortalView>
    );    
}
