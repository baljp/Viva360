import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { Sparkles, ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import { PortalView } from '../../../components/Common';
import { OracleCardPremium } from '../../../src/components/OracleCardPremium';
import { api } from '../../../services/api';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { captureFrontendError } from '../../../lib/frontendLogger';

type OracleHistoryItem = {
    drawId?: string;
    drawnAt?: string;
    date?: string;
    card: {
        id?: string;
        name?: string;
        category?: string;
        insight?: string;
        text?: string;
        element?: string;
    };
};

export const OracleGrimoire: React.FC<{ user: User }> = ({ user }) => {
    const { go } = useBuscadorFlow();
    const [history, setHistory] = useState<OracleHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<OracleHistoryItem | null>(null);

    useEffect(() => {
        api.oracle.history().then((data: unknown) => {
            const historyList = Array.isArray(data) ? (data as OracleHistoryItem[]) : [];
            // Sort by date newest first
            const sorted = [...historyList].sort((a, b) => {
                const aDate = a.drawnAt || a.date || '';
                const bDate = b.drawnAt || b.date || '';
                return new Date(bDate).getTime() - new Date(aDate).getTime();
            });
            setHistory(sorted);
            setIsLoading(false);
        }).catch(err => {
            captureFrontendError(err, { view: 'OracleGrimoire', op: 'history' });
            setIsLoading(false);
        });
    }, []);

    return (
        <PortalView 
            title="Grimório de Luz" 
            subtitle="HISTÓRICO ARQUETÍPICO" 
            onBack={() => go('ORACLE_PORTAL')}
            onClose={() => go('DASHBOARD')}
        >
            <div className="flex flex-col h-full bg-[#fcfdfd] px-6 py-8 pb-32">
                
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                        <BookOpen size={30} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif italic text-nature-900">Suas Revelações</h3>
                        <p className="text-[10px] text-nature-400 uppercase font-black tracking-widest">Memórias do Destino</p>
                        <p className="text-[9px] text-nature-300 uppercase font-bold tracking-widest mt-1">
                            {user.grimoireMeta?.totalCards ?? history.length} cartas persistidas
                            {user.grimoireMeta?.source ? ` • ${user.grimoireMeta.source}` : ''}
                        </p>
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
                            <button 
                                key={item.drawId || `${idx}`} 
                                onClick={() => setSelectedCard(item)}
                                className="bg-white rounded-[2rem] p-6 border border-nature-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group text-left"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/20 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-nature-50/80 backdrop-blur-sm rounded-full border border-nature-100">
                                        <Calendar size={12} className="text-nature-400" />
                                        <span className="text-[10px] font-bold text-nature-600 uppercase tracking-widest">
                                            {(() => {
                                                const rawDate = item.drawnAt || item.date;
                                                if (!rawDate) return 'REVELADO';
                                                try {
                                                    const date = new Date(rawDate);
                                                    if (isNaN(date.getTime())) return 'REVELADO';
                                                    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
                                                } catch {
                                                    return 'REVELADO';
                                                }
                                            })()}
                                        </span>
                                    </div>
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-tighter rounded-full border border-amber-200">
                                        {item.card.element || 'Ar'}
                                    </span>
                                </div>

                                <h4 className="text-xl font-serif italic text-nature-900 mb-2 relative z-10">
                                    {item.card.name || item.card.category || 'Oráculo Viva360'}
                                </h4>
                                <p className="text-sm text-nature-600 leading-relaxed italic relative z-10 line-clamp-2">
                                    "{item.card.insight || item.card.text}"
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedCard && (
                <OracleCardPremium 
                    card={{
                        id: selectedCard.card.id,
                        name: selectedCard.card.name || selectedCard.card.category,
                        message: selectedCard.card.insight || selectedCard.card.text,
                        archetype: selectedCard.card.name || selectedCard.card.category,
                        element: selectedCard.card.element,
                        imageUrl: (() => {
                            const reliableImages = [
                                "https://images.unsplash.com/photo-1620668612187-578f7318182b?q=80&w=800&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1506318137071-a8bcbf6755dd?q=80&w=800&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=800&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop"
                            ];
                            const seed = (selectedCard.card.id || 'id') + (selectedCard.card.name || 'name');
                            const idx = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % reliableImages.length;
                            return reliableImages[idx];
                        })()
                    }}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </PortalView>
    );
};
