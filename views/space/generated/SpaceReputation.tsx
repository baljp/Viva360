import React, { useState } from 'react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext';
import { PortalView } from '../../../components/Common';
import { Star, TrendingUp, User, Calendar, MessageCircle } from 'lucide-react';
import { api } from '../../../services/api';

export default function SpaceReputation() {
    const { back } = useSantuarioFlow();
    const [activeTab, setActiveTab] = useState<'guardians' | 'space'>('guardians');

    const [reviews, setReviews] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState({ average: 0, count: 0 });

    React.useEffect(() => {
        api.spaces.getReviews().then(data => {
            if (data && data.reviews) {
                setReviews(data.reviews);
                setAnalytics({ average: parseFloat(data.average), count: data.count });
            }
        });
    }, []);

    const filteredReviews = reviews.filter((review) => {
        if (activeTab === 'space') return review.target && String(review.target).toLowerCase().includes('sala');
        return !review.target || !String(review.target).toLowerCase().includes('sala');
    });

    return (
        <PortalView 
            title="Reputação Sagrada" 
            subtitle="AVALIAÇÕES" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1534067783865-9c240166d7bd?q=80&w=800"
        >
            <div className="px-4 pb-24 space-y-6">
                
                {/* Score Overview */}
                <div className="bg-nature-900 text-white p-8 rounded-[2.5rem] text-center shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full blur-[80px] -mr-32 -mt-32 opacity-30"></div>
                     <div className="relative z-10">
                        <p className="text-xs font-bold text-nature-300 uppercase tracking-widest mb-2">Nota Geral do Santuário</p>
                        <div className="text-7xl font-serif italic mb-2 tracking-tighter">{analytics.average.toFixed(1)}</div>
                        <div className="flex justify-center gap-1 text-emerald-400 mb-6">
                            {[1,2,3,4,5].map(i => <Star key={i} size={16} fill={i <= Math.round(analytics.average/2) ? "currentColor" : "none"} />)}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                            <div>
                                <p className="text-xl font-bold">{analytics.count}</p>
                                <p className="text-[9px] font-bold text-nature-400 uppercase">Avaliações</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-emerald-400">98%</p>
                                <p className="text-[9px] font-bold text-nature-400 uppercase">Recomendam</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold">4.9</p>
                                <p className="text-[9px] font-bold text-nature-400 uppercase">Média Mestres</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toggle */}
                <div className="p-1 bg-nature-50 rounded-2xl flex gap-1">
                    <button 
                        onClick={() => setActiveTab('guardians')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'guardians' ? 'bg-white text-nature-900 shadow-sm' : 'text-nature-400'}`}
                    >
                        Guardiões
                    </button>
                    <button 
                        onClick={() => setActiveTab('space')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'space' ? 'bg-white text-nature-900 shadow-sm' : 'text-nature-400'}`}
                    >
                        Espaço
                    </button>
                </div>

                {/* Review List */}
                <div className="space-y-4">
                    {filteredReviews.map(review => (
                        <div key={review.id} className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${review.rating >= 9 ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                                        {review.rating.toFixed(1)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-nature-900 text-sm">{review.author}</h4>
                                        <p className="text-[9px] text-nature-400 uppercase font-bold flex items-center gap-1">
                                            <Calendar size={10}/> {review.date}
                                        </p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-nature-50 rounded-lg text-[9px] font-bold uppercase text-nature-500">
                                    {review.target}
                                </span>
                            </div>
                            <p className="text-sm text-nature-600 leading-relaxed pl-14">"{review.comment}"</p>
                        </div>
                    ))}
                </div>

                <div className="text-center pt-4">
                     <button onClick={() => setActiveTab((current) => current === 'guardians' ? 'space' : 'guardians')} className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline">
                        {activeTab === 'guardians' ? 'Ver avaliações do espaço' : 'Ver avaliações dos guardiões'}
                     </button>
                </div>

            </div>
        </PortalView>
    );    
}
