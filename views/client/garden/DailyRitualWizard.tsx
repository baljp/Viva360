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
    { id: 'ANSIOSO', label: 'Ansioso', icon: '🌧', color: 'bg-gray-100 text-gray-600' },
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

    // Canvas Logic for Sharing (Moved to top level)
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    // Map local moods to premium elemental styles (borrowed from Metamorphosis)
    const getCanvasStyle = (currentMood: MoodType) => {
        // Default style
        let style = { element: 'Água', bg: '#f0f9ff', color: '#06b6d4' }; 
        
        if (currentMood === 'VIBRANTE') style = { element: 'Fogo', bg: '#fffbeb', color: '#f59e0b' }; // Amber
        if (currentMood === 'FOCADO') style = { element: 'Fogo', bg: '#fff1f2', color: '#f43f5e' }; // Rose
        if (currentMood === 'GRATO') style = { element: 'Terra', bg: '#f0fdf4', color: '#10b981' }; // Emerald
        if (currentMood === 'EXAUSTO') style = { element: 'Terra', bg: '#f8fafc', color: '#64748b' }; // Slate
        if (currentMood === 'ANSIOSO') style = { element: 'Água', bg: '#eff6ff', color: '#3b82f6' }; // Blue - Mapped ANSIOSO
        if (currentMood === 'MELANCÓLICO') style = { element: 'Água', bg: '#eff6ff', color: '#3b82f6' }; // Blue
        
        return style;
    };

    const downloadCard = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `viva360-ritual-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL('image/png', 1.0);
        link.click();
    };

    const shareCard = async () => {
        if (!canvasRef.current) return;
        try {
            const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'viva360-ritual.png', { type: 'image/png' });
            
            if (navigator.share) {
                await navigator.share({
                    title: 'Meu Ritual Diário • Viva360',
                    text: `Hoje estou vibrando em ${data.mood}: "${data.intention}"`,
                    files: [file]
                });
            } else {
                downloadCard();
            }
        } catch (error) {
            console.error('Error sharing:', error);
            downloadCard();
        }
    };

    // Draw Canvas when entering Share step
    React.useEffect(() => {
        if ((step === 'CARD' || step === 'SHARE') && data.image && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const userImg = new Image();
            userImg.crossOrigin = "anonymous";
            userImg.src = data.image;

            userImg.onload = () => {
                const W = 1080;
                const H = 1080;
                canvas.width = W;
                canvas.height = H;

                const style = getCanvasStyle(data.mood);

                // 1. Background
                ctx.fillStyle = style.bg;
                ctx.fillRect(0, 0, W, H);

                // 2. Photo (Rounded Rect)
                const pad = 80;
                const photoSize = W - (pad * 2);
                
                ctx.save();
                const radius = 60;
                ctx.beginPath();
                ctx.moveTo(pad + radius, pad);
                ctx.lineTo(pad + photoSize - radius, pad);
                ctx.quadraticCurveTo(pad + photoSize, pad, pad + photoSize, pad + radius);
                ctx.lineTo(pad + photoSize, pad + photoSize - radius);
                ctx.quadraticCurveTo(pad + photoSize, pad + photoSize, pad + photoSize - radius, pad + photoSize);
                ctx.lineTo(pad + radius, pad + photoSize);
                ctx.quadraticCurveTo(pad, pad + photoSize, pad, pad + photoSize - radius);
                ctx.lineTo(pad, pad + radius);
                ctx.quadraticCurveTo(pad, pad, pad + radius, pad);
                ctx.closePath();
                ctx.clip();

                const scale = Math.max(photoSize / userImg.width, photoSize / userImg.height);
                const x = pad + (photoSize / 2) - (userImg.width * scale) / 2;
                const y = pad + (photoSize / 2) - (userImg.height * scale) / 2;
                ctx.drawImage(userImg, x, y, userImg.width * scale, userImg.height * scale);
                ctx.restore();

                // 3. Badge
                ctx.save();
                ctx.shadowBlur = 30;
                ctx.shadowColor = 'rgba(0,0,0,0.1)';
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(W/2, pad, 50, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // 4. Element Icon (Simple Colored Dot for now to match)
                ctx.fillStyle = style.color;
                ctx.beginPath();
                ctx.arc(W/2, pad, 15, 0, Math.PI * 2);
                ctx.fill();

                // 5. Text Content
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Intention/Quote
                ctx.font = 'italic 500 48px serif';
                ctx.fillStyle = '#1e293b'; 
                
                const text = data.intention || "Respire. Sinta. Agradeça.";
                const words = text.split(' ');
                let line = '';
                let lineY = pad + photoSize + 100;
                
                for(let n = 0; n < words.length; n++) {
                  const testLine = line + words[n] + ' ';
                  if (ctx.measureText(testLine).width > 800 && n > 0) {
                    ctx.fillText(line, W/2, lineY);
                    line = words[n] + ' ';
                    lineY += 60;
                  } else {
                    line = testLine;
                  }
                }
                ctx.fillText(line, W/2, lineY);

                // 6. Watermark
                ctx.font = 'bold 24px sans-serif'; 
                ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
                
                const dateText = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                const spacedDate = dateText.split('').join('  ');
                const spacedBrand = 'V I V A 3 6 0';

                ctx.textAlign = 'left';
                ctx.fillText(spacedDate, pad, H - 100);
                
                ctx.textAlign = 'right';
                ctx.fillText(spacedBrand, W - pad, H - 100);
            };
        }
    }, [step, data.image]);

    // Cleanup redundant declaration from previous edit if any - this replacement covers lines 51-55 and moves the logic here
    // But wait, replace_file_content replaces constraints. I have to target the top area to INSERT, and then delete the bottom.
    // This tool call targets 51-55 to insert. I need another tool call to delete the bottom part.
    // Or I can use multi_replace? NO, I should use replace_file_content carefully.
    
    // I will replace lines 51-55 with the block above.
    // AND I need to clean up the bottom block in another step or rely on the user to ignore it (bad).
    // I'll make this step ONLY insert at the top.
    
    // Actually, I can use multi_replace to do both at once!

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

         console.log("Saving Snap to Soul Garden Time-Lapse:", newSnap); // Debug Log

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
                    <div className="absolute top-8 right-8 z-20">
                        <button onClick={onClose} className="bg-black/20 backdrop-blur-md p-3 rounded-full text-white"><X size={20}/></button>
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
                 <button onClick={onClose} className="absolute top-8 right-8 bg-white p-3 rounded-full shadow-sm text-nature-400"><X size={20}/></button>
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
                 <button onClick={onClose} className="absolute top-8 right-8 bg-white p-3 rounded-full shadow-sm text-emerald-600"><X size={20}/></button>
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
                <button onClick={onClose} className="absolute top-8 right-8 bg-white/10 p-3 rounded-full text-white"><X size={20}/></button>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
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
                                <button onClick={shareCard} className="py-4 bg-pink-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"><Instagram size={20}/> Stories</button>
                                <button onClick={downloadCard} className="py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all"><Download size={20}/> Salvar</button>
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
