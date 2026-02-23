import React from 'react';
import { PortalView } from '../../../components/Common';
import { useSoulCards } from '../../../src/hooks/useSoulCards';
import { User, ViewState } from '../../../types';
import { Lock, Sparkles } from 'lucide-react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { MOCK_SOUL_CARDS } from '../../../src/data/mockSoulCards';

export const CollectionGrimoire: React.FC<{ user: User }> = ({ user }) => {
    const { collection } = useSoulCards(user.id);
    const { go } = useBuscadorFlow();

    // Group by Rarity for display
    const rarities = ['legendary', 'epic', 'rare', 'common'];

    return (
        <PortalView title="Grimório da Alma" subtitle="SUA COLEÇÃO ETÉREA" onBack={() => go('DASHBOARD')}>
            <div className="p-4 pb-20 space-y-8">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-2xl text-center border border-nature-100">
                        <div className="text-2xl font-bold text-nature-900">{collection.length}</div>
                        <div className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Cartas</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl text-center border border-nature-100">
                        <div className="text-2xl font-bold text-amber-500">
                            {collection.filter(c => c.rarity !== 'common').length}
                        </div>
                        <div className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Raras+</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl text-center border border-nature-100">
                        <div className="text-2xl font-bold text-indigo-500">
                            {new Set(collection.map(c => c.element)).size}
                        </div>
                        <div className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Elementos</div>
                    </div>
                </div>

                {/* Library */}
                {rarities.map(rarity => {
                    const cardsInRarity = collection.filter(c => c.rarity === rarity);
                    const allInRarity = MOCK_SOUL_CARDS.filter(c => c.rarity === rarity);
                    if (allInRarity.length === 0) return null;

                    const color = rarity === 'legendary' ? 'text-amber-500' : rarity === 'epic' ? 'text-purple-500' : rarity === 'rare' ? 'text-blue-500' : 'text-nature-500';

                    return (
                        <div key={rarity}>
                            <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${color}`}>
                                {rarity === 'legendary' && <Sparkles size={14} />}
                                {rarity} Collection
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {cardsInRarity.map((card, idx) => (
                                    <div key={idx} className="aspect-[3/4] bg-white rounded-xl border border-nature-100 shadow-sm p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                                        <div className={`absolute top-0 left-0 w-full h-1 bg-${card.visualTheme}-500`}></div>
                                        <div className="h-full flex flex-col justify-between">
                                            <div className="text-xs text-nature-400 uppercase tracking-widest font-bold">{card.element}</div>
                                            <div className="text-center font-serif italic text-nature-900">{card.archetype}</div>
                                            <div className="text-[10px] text-nature-400 text-center line-clamp-2 leading-relaxed">"{card.message}"</div>
                                        </div>
                                    </div>
                                ))}

                                {/* Slots visuais para cartas ainda não desbloqueadas */}
                                {Array.from({ length: Math.max(0, 3 - cardsInRarity.length) }).map((_, i) => (
                                    <div key={`locked-${i}`} className="aspect-[3/4] bg-nature-50 rounded-xl border border-dashed border-nature-200 flex items-center justify-center opacity-50">
                                        <Lock size={20} className="text-nature-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}


            </div>
        </PortalView>
    );
};
