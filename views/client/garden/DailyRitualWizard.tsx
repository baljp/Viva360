import React, { useState } from 'react';
import { User, DailyRitualSnap, MoodType } from '../../../types';
import { Camera, ArrowRight, Heart, Sparkles, Droplet, Check, Share2, X, Sun, Download, Instagram } from 'lucide-react';
import { CameraWidget, ZenToast } from '../../../components/Common';
import { SoulCard } from '../../../src/components/SoulCard';
import { gardenService } from '../../../services/gardenService';
import { api } from '../../../services/api';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';

interface DailyRitualWizardProps {
    user: User;
    onComplete: (user: User) => void;
    onClose: () => void;
}

const MOODS: { id: MoodType; label: string; icon: string; color: string }[] = [
    { id: 'SERENO', label: 'Calmo', icon: '😌', color: 'bg-emerald-100 text-emerald-600' },
    { id: 'VIBRANTE', label: 'Feliz', icon: '😄', color: 'bg-amber-100 text-amber-600' },
    { id: 'FOCADO', label: 'Motivado', icon: '⚡', color: 'bg-slate-100 text-slate-600' },
    { id: 'GRATO', label: 'Grato', icon: '💚', color: 'bg-rose-100 text-rose-600' },
    { id: 'MELANCÓLICO', label: 'Triste', icon: '😔', color: 'bg-blue-100 text-blue-600' },
    { id: 'EXAUSTO', label: 'Cansado', icon: '😴', color: 'bg-purple-100 text-purple-600' },
    { id: 'MELANCÓLICO', label: 'Ansioso', icon: '🌧', color: 'bg-gray-100 text-gray-600' }, // Mapping 'Ansioso' to MELANCOLICO for now, or could add new type
];

export const DailyRitualWizard: React.FC<DailyRitualWizardProps> = ({ user, onComplete, onClose }) => {
    const { go } = useBuscadorFlow();
    const [step, setStep] = useState<'MOOD' | 'CAPTURE' | 'INTENTION' | 'GRATITUDE' | 'CARD' | 'SHARE' | 'NURTURE' | 'TRIBE'>('MOOD');
    const [data, setData] = useState<{ mood: MoodType; image: string; intention: string; gratitude: string }>({ 
        mood: 'SERENO', image: '', intention: '', gratitude: ''
    });

    const handleMoodSelect = (mood: MoodType) => {
        setData({ ...data, mood });
        setStep('CAPTURE');
    };

    const handleCapture = (image: string) => {
        setData({ ...data, image });
        setStep('INTENTION');
    };

    const handleIntentionSubmit = () => {
        setStep('GRATITUDE');
    };

    const handleGratitudeSubmit = () => {
        setStep('CARD');
    };

    const handleCardConfirm = async () => {
        // Proceed to Nurture then Share
        // Actually flow is: Mood -> Photo -> Intention -> Gratitude -> Card (Show) -> Share/Save -> Nurture -> Tribe
        setStep('SHARE');
    };

    const handleNurtureStart = async () => {
        setStep('NURTURE');
         // Calculate rewards
         const reward = gardenService.calculateWateringReward(user);
            
         // Create Snap
         const newSnap: DailyRitualSnap = {
             id: Date.now().toString(),
             date: new Date().toISOString(),
             image: data.image,
             mood: data.mood,
             note: data.intention // Storing intention as note
         };

         // Update User
         const updatedUser: User = {
             ...user,
             lastWateredAt: new Date().toISOString(),
             plantHealth: Math.min(100, (user.plantHealth || 0) + 15),
             plantXp: (user.plantXp || 0) + reward.xp,
             karma: (user.karma || 0) + reward.karma,
             snaps: [newSnap, ...(user.snaps || [])]
         };
         
         // API Call
         await api.users.update(updatedUser);
         
         // Delay for animation effect
         setTimeout(() => {
             // Instead of completing, go to Tribe step
             setStep('TRIBE');
             // But we need to update parent state? Maybe passing updated user to Tribe step render
         }, 4000);
    };

    const handleTribeAction = (action: 'BLESS' | 'UNION' | 'PACT' | 'SKIP') => {
        // In a real app we would use the updated user from previous step, but for now assuming onComplete handles the refresh
        // For 'UNION' and 'PACT' we navigate
        
        // We construct the updated user object again essentially or query it, 
        // strictly for the onComplete callback to maintain state accuracy.
        // For simplicity reusing 'user' but modified:
        const reward = gardenService.calculateWateringReward(user); // Re-calc not ideal but harmless for mock
        const updatedUser: User = {
            ...user,
            lastWateredAt: new Date().toISOString(),
            plantHealth: Math.min(100, (user.plantHealth || 0) + 15),
            plantXp: (user.plantXp || 0) + reward.xp,
            karma: (user.karma || 0) + reward.karma
        };

        if (action === 'UNION') {
             onComplete(updatedUser);
             go('TRIBE_INTERACTION');
             return;
        }
        if (action === 'PACT') {
             onComplete(updatedUser);
             go('TRIBE_DASH');
             return;
        }
        
        // For Bless or Skip, just close
        onComplete(updatedUser);
    };

    // --- RENDER STEPS ---

    if (step === 'MOOD') {
        return (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in">
                <div className="p-8 pt-12">
                     <button onClick={onClose} className="mb-6 bg-nature-50 p-3 rounded-full"><X size={20} className="text-nature-400"/></button>
                    <h2 className="text-3xl font-serif italic text-nature-900 mb-2">Como você se sente neste momento?</h2>
                    <p className="text-sm text-nature-400">Não existe resposta certa. Apenas seja verdadeiro consigo.</p>
                </div>
                <div className="flex-1 px-8 grid grid-cols-2 gap-4 content-start overflow-y-auto pb-12">
                    {MOODS.map(m => (
                        <button key={m.id} onClick={() => handleMoodSelect(m.id)} className={`p-6 rounded-[2rem] text-left transition-all hover:scale-105 active:scale-95 ${m.color}`}>
                            <span className="text-4xl block mb-3">{m.icon}</span>
                            <span className="font-bold text-sm uppercase tracking-wide opacity-80">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 'CAPTURE') {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col">
                <div className="flex-1 relative">
                    <CameraWidget onCapture={handleCapture} />
                     <div className="absolute top-8 left-8 z-20">
                        <button onClick={() => setStep('MOOD')} className="bg-black/20 backdrop-blur-md p-3 rounded-full text-white"><ArrowRight className="rotate-180" size={20}/></button>
                    </div>
                </div>
                 <div className="bg-black p-8 text-center space-y-2 pb-12">
                     <h3 className="text-white font-serif italic text-xl">Registre sua essência de hoje</h3>
                     <p className="text-white/50 text-xs">Este momento fará parte da sua jornada de transformação.</p>
                 </div>
            </div>
        );
    }

    if (step === 'INTENTION') {
        return (
             <div className="fixed inset-0 z-[100] bg-nature-50 flex flex-col p-8 pt-16 animate-in slide-in-from-right">
                 <button onClick={() => setStep('CAPTURE')} className="mb-6 bg-white p-3 rounded-full w-min shadow-sm"><ArrowRight className="rotate-180 text-nature-900" size={20}/></button>
                 <h2 className="text-3xl font-serif italic text-nature-900 mb-4">Qual pequena ação hoje pode tornar seu dia melhor?</h2>
                 <textarea 
                    value={data.intention}
                    onChange={(e) => setData({...data, intention: e.target.value})}
                    placeholder="Ex: Respirar por 5 min, ouvir uma música..."
                    className="w-full h-40 bg-white p-6 rounded-[2rem] border border-nature-100 outline-none text-lg text-nature-900 placeholder:text-nature-300 resize-none shadow-sm focus:ring-2 focus:ring-primary-100 transition-all"
                 />
                 <div className="mt-4 flex gap-2 flex-wrap">
                     {['Beber água', 'Pausa de 5min', 'Elogiar alguém'].map(s => (
                         <button key={s} onClick={() => setData({...data, intention: s})} className="px-4 py-2 bg-white rounded-full text-xs font-bold text-nature-500 border border-nature-100 hover:border-primary-300 active:bg-primary-50 transition-colors">
                             {s}
                         </button>
                     ))}
                 </div>
                 <div className="mt-auto">
                    <button onClick={handleIntentionSubmit} disabled={!data.intention} className="w-full py-5 bg-nature-900 text-white rounded-3xl font-bold uppercase tracking-widest disabled:opacity-50 transition-all">
                        Continuar
                    </button>
                 </div>
             </div>
        );
    }

    if (step === 'GRATITUDE') {
        return (
             <div className="fixed inset-0 z-[100] bg-emerald-50 flex flex-col p-8 pt-16 animate-in slide-in-from-right">
                 <button onClick={() => setStep('INTENTION')} className="mb-6 bg-white p-3 rounded-full w-min shadow-sm"><ArrowRight className="rotate-180 text-nature-900" size={20}/></button>
                 <h2 className="text-3xl font-serif italic text-nature-900 mb-4">Pelo que você é grato agora?</h2>
                 <p className="text-nature-400 text-sm mb-6">A gratidão reprograma nossa vibração.</p>
                 <textarea 
                    value={data.gratitude}
                    onChange={(e) => setData({...data, gratitude: e.target.value})}
                    placeholder="Sou grato por..."
                    className="w-full h-40 bg-white p-6 rounded-[2rem] border border-emerald-100 outline-none text-lg text-nature-900 placeholder:text-nature-300 resize-none shadow-sm focus:ring-2 focus:ring-emerald-100 transition-all"
                 />
                 <div className="mt-auto">
                    <button onClick={handleGratitudeSubmit} disabled={!data.gratitude} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-bold uppercase tracking-widest disabled:opacity-50 transition-all">
                        Gerar Card
                    </button>
                 </div>
             </div>
        );
    }

    if (step === 'CARD' || step === 'SHARE') {
        const snapStub: DailyRitualSnap = { 
            id: 'temp', 
            date: new Date().toISOString(), 
            image: data.image, 
            mood: data.mood, 
            note: data.intention 
        };

        return (
            <div className="fixed inset-0 z-[100] bg-nature-900 flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500">
                <div className="w-full max-w-sm relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 text-white/50 text-xs font-bold uppercase tracking-[0.3em] whitespace-nowrap">Sua Essência de Hoje</div>
                    <SoulCard snap={snapStub} className="shadow-2xl skew-y-1 mb-8" />
                    
                    {step === 'CARD' ? (
                        <button onClick={handleCardConfirm} className="w-full py-5 bg-white text-nature-900 rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-nature-50 active:scale-95 transition-all flex items-center justify-center gap-2">
                             <Sparkles size={18} /> Cristalizar Momento
                        </button>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-bottom fade-in duration-500">
                             <div className="grid grid-cols-2 gap-3">
                                <button className="py-4 bg-pink-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"><Instagram size={20}/> Stories</button>
                                <button className="py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-bold flex items-center justify-center gap-2"><Download size={20}/> Salvar</button>
                             </div>
                             <button onClick={handleNurtureStart} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Droplet size={18} className="fill-white" /> Nutrir Jardim da Alma
                             </button>
                             <p className="text-center text-white/40 text-[10px] uppercase tracking-widest mt-4">Hoje eu cuidei de mim 🌱 #Viva360</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (step === 'NURTURE') {
        return (
            <div className="fixed inset-0 z-[100] bg-emerald-900 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
                
                {/* Micro animation: Water falling, Sprout growing */}
                <div className="relative z-10 flex flex-col items-center gap-8 animate-in slide-in-from-bottom duration-1000">
                    <div className="relative">
                        <Droplet size={64} className="text-emerald-300 fill-emerald-300 animate-bounce" />
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-500/50 rounded-full blur-xl"></div>
                    </div>
                    
                    <div className="space-y-2 text-center">
                         <h2 className="text-4xl font-serif italic text-white">Jardim Nutrido</h2>
                         <p className="text-emerald-200 text-xs font-bold uppercase tracking-[0.2em]">Sua intenção virou vitalidade</p>
                    </div>

                    <div className="flex gap-4 justify-center pt-4">
                         <div className="px-6 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-widest">+15 Vitalidade</div>
                         <div className="px-6 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-widest">+5 Karma</div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'TRIBE') {
        return (
             <div className="fixed inset-0 z-[100] bg-indigo-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in">
                 <div className="w-full max-w-sm space-y-8 text-center">
                     <div className="w-20 h-20 bg-indigo-500/30 rounded-full flex items-center justify-center mx-auto border border-indigo-400/30 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                         <Share2 size={32} className="text-indigo-200" />
                     </div>
                     <div className="space-y-3">
                         <h3 className="text-2xl font-serif italic text-white">Deseja compartilhar sua energia?</h3>
                         <p className="text-indigo-100/60 text-sm">Sua vibração influencia o crescimento da tribo.</p>
                     </div>
                     <div className="space-y-3">
                         <button onClick={() => handleTribeAction('BLESS')} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                             ✨ Enviar Bênção
                         </button>
                         <button onClick={() => handleTribeAction('UNION')} className="w-full py-4 bg-indigo-800 text-white border border-indigo-700/50 rounded-2xl font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                             🤝 Pedir Apoio
                         </button>
                         <button onClick={() => handleTribeAction('SKIP')} className="w-full py-4 text-indigo-300 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors">
                             Pular
                         </button>
                     </div>
                 </div>
             </div>
        );
    }

    return null;
};
