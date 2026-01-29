import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { Sparkles, ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import { PortalView } from '../../../components/Common';
import { api } from '../../../services/api';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';

export const OracleGrimoire: React.FC<{ user: User }> = ({ user }) => {
    const { go } = useBuscadorFlow();
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.oracle.history().then(data => {
            setHistory(data);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load oracles", err);
            setIsLoading(false);
        });
    }, []);

    return (
        <PortalView title="Grimório de Luz" subtitle="HISTÓRICO ARQUETÍPICO" onBack={() => go('ORACLE_PORTAL')}>
            <div className="flex flex-col h-full bg-[#fcfdfd] px-6 py-8 pb-32">
                
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                        <BookOpen size={30} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif italic text-nature-900">Suas Revelações</h3>
                        <p className="text-[10px] text-nature-400 uppercase font-black tracking-widest">Memórias do Destino</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-nature-100 border-t-amber-400 rounded-full animate-spin"></div>
                        <p className="text-xs text-nature-400 font-serif italic">Folheando pergaminhos...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                        <Sparkles size={64} className="text-nature-200" />
                        <p className="font-serif italic text-nature-500">Seu grimório ainda está em branco.<br/>Consulte o oráculo hoje.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {history.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-[2rem] p-6 border border-nature-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-nature-50 rounded-full border border-nature-100">
                                        <Calendar size={12} className="text-nature-400" />
                                        <span className="text-[9px] font-bold text-nature-600 uppercase tracking-widest">
                                            {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                        </span>
                                    </div>
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-tighter rounded-full border border-amber-200">
                                        {item.card.element}
                                    </span>
                                </div>

                                <h4 className="text-xl font-serif italic text-nature-900 mb-2 relative z-10">
                                    {item.card.name}
                                </h4>
                                <p className="text-sm text-nature-600 leading-relaxed italic relative z-10">
                                    "{item.card.insight}"
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PortalView>
    );
};
