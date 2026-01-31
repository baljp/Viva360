import React, { useState } from 'react';
import { User } from '../../../types';
import { PortalView, DynamicAvatar, ZenToast } from '../../../components/Common';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Flame, Star, Users, Send, CheckCircle2, Zap, Heart, Wind, Sun, Moon, Leaf, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRE_MADE_PACTS = [
    { id: 'morning_sync', title: 'Sintonização Matinal', desc: 'Respirar juntos por 5 min ao acordar.', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'presence_pause', title: 'Pausa de Presença', desc: '3 respirações profundas às 15h.', icon: Wind, color: 'text-sky-500', bg: 'bg-sky-50' },
    { id: 'gratitude_duo', title: 'Gratidão em Dupla', desc: 'Compartilhar 1 gratidão antes de dormir.', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'mindful_walk', title: 'Caminhada Consciente', desc: '15 min de caminhada em silêncio.', icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'holy_water', title: 'Hidratação Sagrada', desc: 'Beber água com intenção às 10h.', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'digital_detox', title: 'Desconexão Digital', desc: '1 hora offline juntos à noite.', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'sacred_read', title: 'Leitura Inspiradora', desc: 'Ler um parágrafo de luz um ao outro.', icon: Star, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'smile_share', title: 'Sorriso Grátis', desc: 'Vídeo curto sorrindo sem motivo.', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-50' },
    { id: 'sound_freq', title: 'Frequência Sonora', desc: 'Ouvir a mesma meditação binaural.', icon: Wind, color: 'text-cyan-400', bg: 'bg-cyan-50' },
    { id: 'kind_act', title: 'Ato de Bondade', desc: 'Gesto de carinho para alguém comum.', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-50' },
];

const MOCK_MEMBERS = [
    { id: '1', name: 'Lucas Paz', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Lucas' },
    { id: '2', name: 'Ana Luz', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ana' },
    { id: '3', name: 'Zeca Zen', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Zeca' },
    { id: '4', name: 'Maya Soul', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Maya' },
];

export const SoulPactInteraction: React.FC<{ user: User }> = ({ user }) => {
    const { back, jump } = useBuscadorFlow();
    const [step, setStep] = useState<'PARTNER' | 'PACT' | 'CUSTOM' | 'SUCCESS'>('PARTNER');
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [selectedPact, setSelectedPact] = useState<any>(null);
    const [customPact, setCustomPact] = useState('');
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);

    const handleSelectPartner = (p: any) => {
        setSelectedPartner(p);
        setStep('PACT');
    };

    const handleSelectPact = (p: any) => {
        setSelectedPact(p);
        if (p.id === 'custom') {
            setStep('CUSTOM');
        } else {
            setStep('SUCCESS');
        }
    };

    const handleSendPact = () => {
        setStep('SUCCESS');
    };

    return (
        <PortalView title="Pacto de Alma" subtitle="REDE DE SUSTENTAÇÃO" onBack={back}>
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            <div className="flex flex-col h-full bg-nature-50 p-6">
                
                <AnimatePresence mode="wait">
                    {step === 'PARTNER' && (
                        <motion.div 
                            key="partner"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-serif italic text-nature-900">Com quem deseja se ligar?</h3>
                                <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Escolha um guardião da sua rede</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {MOCK_MEMBERS.map(member => (
                                    <button 
                                        key={member.id}
                                        onClick={() => handleSelectPartner(member)}
                                        className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex flex-col items-center gap-4 active:scale-95 transition-all hover:border-primary-200"
                                    >
                                        <img src={member.avatar} className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100" alt={member.name} />
                                        <span className="font-bold text-nature-900 text-sm">{member.name}</span>
                                    </button>
                                ))}
                                <button 
                                    onClick={() => {
                                        const url = window.location.origin;
                                        const text = encodeURIComponent(`🌿 Olá! Sinto um chamado para que você faça parte da minha Tribo no Viva360. Vamos trilhar um caminho de luz e sintonização juntos? 🌱\n\nAcesse aqui: ${url}`);
                                        window.open(`https://wa.me/?text=${text}`, '_blank');
                                    }}
                                    className="col-span-2 bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[3rem] border border-indigo-100 shadow-sm flex flex-col items-center justify-center gap-4 hover:shadow-lg transition-all active:scale-[0.98] group"
                                >
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border border-indigo-50 group-hover:scale-110 transition-transform">
                                        <Plus size={32} className="text-indigo-500" />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm font-bold text-indigo-900 block mb-1">Ampliar o Chamado</span>
                                        <span className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Convidar novos membros para a tribo</span>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'PACT' && (
                        <motion.div 
                            key="pact"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 pb-32"
                        >
                            <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-nature-100">
                                <img src={selectedPartner?.avatar} className="w-12 h-12 rounded-xl" />
                                <div>
                                    <p className="text-[9px] text-nature-400 font-bold uppercase">Pactuando com</p>
                                    <h4 className="font-bold text-nature-900">{selectedPartner?.name}</h4>
                                </div>
                                <button onClick={() => setStep('PARTNER')} className="ml-auto text-[10px] font-bold text-primary-600 underline">Trocar</button>
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-serif italic text-nature-900">Qual será nosso compromisso?</h3>
                                <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Escolha uma ação de luz</p>
                            </div>

                            <div className="space-y-3">
                                {PRE_MADE_PACTS.map(pact => (
                                    <button 
                                        key={pact.id}
                                        onClick={() => handleSelectPact(pact)}
                                        className="w-full bg-white p-5 rounded-3xl border border-nature-100 shadow-sm flex items-center gap-5 active:scale-[0.98] transition-all text-left hover:border-primary-100"
                                    >
                                        <div className={`w-12 h-12 ${pact.bg} ${pact.color} rounded-2xl flex items-center justify-center shrink-0`}>
                                            <pact.icon size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold text-nature-900 text-sm leading-tight">{pact.title}</h5>
                                            <p className="text-[11px] text-nature-500 mt-0.5">{pact.desc}</p>
                                        </div>
                                        <Send size={16} className="text-nature-200" />
                                    </button>
                                ))}
                                <button 
                                    onClick={() => handleSelectPact({ id: 'custom', title: 'Pacto Personalizado' })}
                                    className="w-full bg-indigo-50 p-5 rounded-3xl border border-dashed border-indigo-200 flex items-center gap-5 active:scale-[0.98] transition-all text-left"
                                >
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <Plus size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-bold text-indigo-900 text-sm leading-tight">Criar Pacto Único</h5>
                                        <p className="text-[11px] text-indigo-400 mt-0.5">Defina sua própria sintonização.</p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'CUSTOM' && (
                        <motion.div 
                            key="custom"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-serif italic text-nature-900">Escreva seu Pacto</h3>
                                <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Seja claro e amoroso</p>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] border border-nature-100 shadow-xl space-y-6">
                                <textarea 
                                    value={customPact}
                                    onChange={(e) => setCustomPact(e.target.value)}
                                    placeholder="Ex: Enviar uma foto da natureza todos os dias ao meio-dia..."
                                    className="w-full h-40 bg-nature-50 border-none rounded-2xl p-6 text-sm italic text-nature-700 outline-none focus:ring-2 ring-primary-100 transition-all resize-none"
                                />
                                <button 
                                    onClick={handleSendPact}
                                    disabled={!customPact.trim()}
                                    className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    Sugerir Pacto <Send size={16}/>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'SUCCESS' && (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-4"
                        >
                            <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center relative">
                                <CheckCircle2 size={64} className="text-emerald-500 animate-in zoom-in duration-500" />
                                <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-3 rounded-full rotate-12 shadow-lg animate-bounce">
                                    <Star size={24} fill="white" />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h2 className="text-3xl font-serif italic text-nature-900">Semente Plantada!</h2>
                                <p className="text-nature-500 leading-relaxed">
                                    Sua sugestão de pacto para <strong className="text-nature-900">{selectedPartner?.name}</strong> foi enviada. Assim que aceito, sua sincronia começará!
                                </p>
                            </div>

                             <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm w-full max-w-sm">
                                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-3">Recompensa • Loop de Luz</p>
                                <div className="flex justify-center items-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <span className="text-lg font-black text-emerald-500">+25</span>
                                        <span className="text-[9px] font-black uppercase text-nature-400">Karma Viral</span>
                                    </div>
                                    <div className="w-px h-8 bg-nature-100" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-lg font-black text-indigo-500">+5</span>
                                        <span className="text-[9px] font-black uppercase text-nature-400">Elo Pacto</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-nature-50">
                                    <div className="flex justify-between text-[8px] font-bold uppercase text-nature-400 mb-1">
                                        <span>Progresso da Tribo</span>
                                        <span>32%</span>
                                    </div>
                                    <div className="w-full h-1 bg-nature-100 rounded-full overflow-hidden">
                                        <div className="w-[32%] h-full bg-emerald-400" />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => jump('TRIBE_DASH')}
                                className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all"
                            >
                                Voltar para a Tribo
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </PortalView>
    );
};
