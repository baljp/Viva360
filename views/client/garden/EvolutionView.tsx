import React from 'react';
import { User } from '../../../types';
import { SoulCard } from '../../../src/components/SoulCard';
import { PortalView } from '../../../components/Common';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';

export const EvolutionView: React.FC<{ user: User }> = ({ user }) => {
    const { back } = useBuscadorFlow();
    const snaps = user.snaps || [];

    return (
        <PortalView title="Evolução" subtitle="MEMÓRIAS DA ALMA" onBack={back} heroImage="https://images.unsplash.com/photo-1470252649378-b736a029c69d?q=80&w=800">
            <div className="space-y-8 px-2 pb-12">
                
                {/* Header Stats */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-1">Total de Momentos</p>
                    <h3 className="text-4xl font-serif italic text-nature-900">{snaps.length}</h3>
                </div>

                {/* Timeline */}
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-nature-100 z-0"></div>

                    <div className="space-y-12">
                        {snaps.map((snap, index) => (
                            <div key={snap.id} className="relative z-10 flex gap-6">
                                {/* Dot */}
                                <div className="flex-none pt-8">
                                    <div className="w-3 h-3 bg-nature-900 rounded-full border-4 border-white shadow-md"></div>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 space-y-2">
                                    <div className="px-2">
                                        <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest leading-none">
                                            {new Date(snap.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="w-full max-w-[280px]">
                                        <SoulCard snap={snap} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {snaps.length === 0 && (
                            <div className="py-20 text-center opacity-40">
                                <p className="text-sm italic font-serif">Sua jornada de memórias começa hoje.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PortalView>
    );
};
