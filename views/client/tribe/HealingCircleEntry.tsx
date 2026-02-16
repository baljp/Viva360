import React, { useEffect, useState } from 'react';
import { User, Event } from '../../../types';
import { PortalView, BottomSheet, DynamicAvatar } from '../../../components/Common';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { api } from '../../../services/api';
import { Users, Clock, MapPin, Sparkles, Heart, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HealingCircleEntry: React.FC<{ user: User }> = ({ user }) => {
    const { go, back, selectTribeRoomContext } = useBuscadorFlow();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const events = await api.spaces.getEvents();
                const circle = events.find(e => e.title.includes('Círculo')) || events[0];
                if (circle) {
                    setEvent(circle);
                } else {
                    // Fallback event
                    setEvent({
                        id: 'fallback-circle',
                        title: 'Círculo de Cura Sagrada',
                        description: 'Um encontro de almas para cura e expansão da consciência.',
                        image: 'https://images.unsplash.com/photo-1528644490543-950c4dfceb28?q=80&w=800',
                        price: 33.00,
                        facilitatorName: 'Ana Luz',
                        enrolled: 12,
                        capacity: 20,
                        date: new Date().toISOString()
                    } as any);
                }
            } catch (err) {
                console.error("Failed to load healing circle events", err);
                // Fallback on error
                setEvent({
                    id: 'fallback-circle-error',
                    title: 'Círculo de Cura Sagrada',
                    description: 'Um encontro de almas para cura e expansão da consciência.',
                    image: 'https://images.unsplash.com/photo-1528644490543-950c4dfceb28?q=80&w=800',
                    price: 33.00,
                    facilitatorName: 'Ana Luz',
                    enrolled: 12,
                    capacity: 20,
                    date: new Date().toISOString()
                } as any);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleJoin = () => {
        if (!event) return;
        // Persist post-checkout intent so PaymentSuccess can offer a direct entry into the circle chat.
        try {
            localStorage.setItem('viva360.post_checkout.intent', 'healing_circle');
            localStorage.setItem('viva360.post_checkout.contextId', String(event.id));
        } catch {
            // ignore
        }
        selectTribeRoomContext({ type: 'healing_circle', contextId: String(event.id) });
        go('CHECKOUT');
    };

    if (loading || !event) return <div className="h-full flex items-center justify-center"><AnimatePresence><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-primary-500"><Sparkles size={32}/></motion.div></AnimatePresence></div>;

    return (
        <PortalView title="Círculo de Cura" subtitle="RITUAL COLETIVO" onBack={back}>
            <div className="flex flex-col h-full bg-slate-950 overflow-y-auto no-scrollbar">
                
                {/* Hero / Cover */}
                <div className="relative h-72 flex-none">
                    <img src={event.image || 'https://images.unsplash.com/photo-1528644490543-950c4dfceb28?q=80&w=800'} className="w-full h-full object-cover opacity-60" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    
                    <div className="absolute bottom-8 left-8 right-8">
                         <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Zap size={10} fill="currentColor"/> Ao Vivo
                            </span>
                            <span className="px-3 py-1 bg-white/10 text-white/60 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">
                                Ritual Sagrado
                            </span>
                         </div>
                         <h2 className="text-3xl font-serif italic text-white leading-tight">{event.title}</h2>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="px-8 space-y-8 pb-32">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col gap-2">
                            <Clock size={16} className="text-primary-400" />
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Início</p>
                                <p className="text-sm font-bold text-white">19:00 Horário Brasília</p>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col gap-2">
                            <Users size={16} className="text-emerald-400" />
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Participantes</p>
                                <p className="text-sm font-bold text-white">{event.enrolled}/{event.capacity} Almas</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sobre o Encontro</h4>
                        <p className="text-slate-300 text-sm leading-relaxed italic">
                            {event.description} Unimos nossas intenções em uma teia de luz para sustentar a jornada um do outro. Um momento de vulnerabilidade, força e cura profunda.
                        </p>
                    </div>

                    <div className="bg-primary-900/40 border border-primary-500/20 rounded-[2.5rem] p-6 space-y-4">
                        <div className="flex items-start gap-4">
                             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                <ShieldCheck className="text-primary-400" size={24}/>
                             </div>
                             <div>
                                 <h4 className="font-bold text-white text-sm">Troca Energética</h4>
                                 <p className="text-xs text-slate-400 leading-relaxed">Sua contribuição sustenta a infraestrutura da Tribo e honra o facilitador.</p>
                             </div>
                        </div>
                        <div className="h-px bg-white/10 w-full" />
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-bold text-primary-400 uppercase tracking-widest mb-1">Valor Sugerido</p>
                                <p className="text-2xl font-serif italic text-white">R$ {event.price.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Karma</p>
                                <p className="text-lg font-bold text-white">+50 💎</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Facilitadora</h4>
                         <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl">
                            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200" className="w-12 h-12 rounded-2xl object-cover" alt={event.facilitatorName || 'Facilitadora'} />
                            <div className="flex-1">
                                <h5 className="font-bold text-white text-sm">{event.facilitatorName}</h5>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Guardiã da Consciência</p>
                            </div>
                            <Heart size={16} className="text-rose-500" />
                         </div>
                    </div>

                </div>

                {/* Footer Action */}
                <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                    <button 
                        onClick={handleJoin}
                        className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-bold uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        Contribuir e Entrar no Círculo <ChevronRight size={18}/>
                    </button>
                    <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-widest font-bold">Vagas limitadas por sessão</p>
                </div>
            </div>
        </PortalView>
    );
};
