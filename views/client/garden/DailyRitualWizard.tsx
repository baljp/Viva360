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
    updateUser: (user: User) => void;
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

import { phraseGenerator } from '../../../services/phraseGenerator';

export const DailyRitualWizard: React.FC<DailyRitualWizardProps> = ({ user, updateUser, onClose }) => {
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
    // Map local moods to premium elemental styles (borrowed from Metamorphosis)
    const getCanvasStyle = (currentMood: MoodType) => {
        // Default style (Ar)
        let style = { element: 'Ar', bg: '#f8fafc', color: '#64748b', pattern: 'circle', accent: '#e2e8f0' }; 
        
        if (currentMood === 'VIBRANTE' || currentMood === 'FOCADO') {
            style = { element: 'Fogo', bg: '#fffbeb', color: '#f59e0b', pattern: 'rays', accent: '#fcd34d' }; // Amber
        }
        if (currentMood === 'VIBRANTE') style = { element: 'Fogo', bg: '#fff7ed', color: '#ea580c', pattern: 'rays', accent: '#fdba74' }; // Orange
        if (currentMood === 'FOCADO') style = { element: 'Fogo', bg: '#fef2f2', color: '#e11d48', pattern: 'rays', accent: '#fda4af' }; // Rose

        if (currentMood === 'GRATO' || currentMood === 'SERENO') {
            style = { element: 'Terra', bg: '#f0fdf4', color: '#059669', pattern: 'leaf', accent: '#6ee7b7' }; // Emerald
        }
        if (currentMood === 'SERENO') style = { element: 'Terra', bg: '#f6f5f4', color: '#57534e', pattern: 'leaf', accent: '#a8a29e' }; // Warm Stone

        if (currentMood === 'MELANCÓLICO' || currentMood === 'ANSIOSO' || currentMood === 'EXAUSTO') {
            style = { element: 'Água', bg: '#eff6ff', color: '#2563eb', pattern: 'wave', accent: '#93c5fd' }; // Blue
        }
        if (currentMood === 'EXAUSTO') style = { element: 'Água', bg: '#faf5ff', color: '#9333ea', pattern: 'wave', accent: '#d8b4fe' }; // Purple

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

                // 1.1 Patterns
                ctx.save();
                ctx.strokeStyle = style.accent;
                ctx.lineWidth = 2;
                if (style.pattern === 'rays') {
                    for(let i=0; i<360; i+=10) {
                        ctx.beginPath();
                        ctx.moveTo(W/2, H/2);
                        ctx.lineTo(W/2 + Math.cos(i*Math.PI/180)*W, H/2 + Math.sin(i*Math.PI/180)*W);
                        ctx.stroke();
                    }
                } else if (style.pattern === 'wave') {
                    for(let y=0; y<H; y+=40) {
                        ctx.beginPath();
                         ctx.moveTo(0, y);
                         ctx.bezierCurveTo(W/3, y+30, 2*W/3, y-30, W, y);
                         ctx.stroke();
                    }
                } else if (style.pattern === 'leaf') {
                     for(let x=0; x<W; x+=100) {
                        for(let y=0; y<H; y+=100) {
                            ctx.beginPath();
                            ctx.arc(x, y, 20, 0, Math.PI*2);
                            ctx.stroke();
                        }
                    }
                } else {
                     ctx.globalAlpha = 0.3;
                     for(let i=0; i<20; i++) {
                         ctx.beginPath();
                         ctx.arc(Math.random()*W, Math.random()*H, Math.random()*100, 0, Math.PI*2);
                         ctx.stroke();
                     }
                }
                ctx.restore();

                // 2. Photo (Rounded Rect)
                const pad = 120; // More padding for elegant look
                const photoSize = W - (pad * 2);
                
                ctx.save();
                const radius = 80;
                
                // Shadow
                ctx.shadowColor = "rgba(0,0,0,0.15)";
                ctx.shadowBlur = 40;
                ctx.shadowOffsetY = 20;

                ctx.beginPath();
                ctx.roundRect(pad, pad + 100, photoSize, photoSize, radius); // Shifted down a bit
                ctx.fillStyle = '#1e1b4b'; // Dark background behind image
                ctx.fill();
                ctx.shadowColor = "transparent"; // Reset shadow
                
                ctx.clip(); // Clip to the rect

                const scale = Math.max(photoSize / userImg.width, photoSize / userImg.height);
                const x = pad + (photoSize / 2) - (userImg.width * scale) / 2;
                const y = pad + 100 + (photoSize / 2) - (userImg.height * scale) / 2;
                ctx.drawImage(userImg, x, y, userImg.width * scale, userImg.height * scale);
                
                // Vignette overlay on image
                const grad = ctx.createLinearGradient(0, pad+100, 0, pad+100+photoSize);
                grad.addColorStop(0, 'transparent');
                grad.addColorStop(1, 'rgba(0,0,0,0.4)');
                ctx.fillStyle = grad;
                ctx.fillRect(pad, pad+100, photoSize, photoSize);
                
                ctx.restore();

                // 3. Element Badge (Top Center)
                ctx.save();
                ctx.shadowBlur = 20;
                ctx.shadowColor = 'rgba(0,0,0,0.1)';
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(W/2, pad + 100, 40, 0, Math.PI * 2); // Overlapping top edge of photo
                ctx.fill();
                ctx.restore();

                // Element Icon
                ctx.fillStyle = style.color;
                ctx.font = '40px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const elIcon = style.pattern === 'rays' ? '🔥' : style.pattern === 'wave' ? '💧' : style.pattern === 'leaf' ? '🌱' : '🍃';
                ctx.fillText(elIcon, W/2, pad + 102);


                // 5. Text Content
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Divider
                ctx.strokeStyle = style.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(W/2 - 50, pad + 100 + photoSize + 60);
                ctx.lineTo(W/2 + 50, pad + 100 + photoSize + 60);
                ctx.stroke();

                // Intention/Quote
                ctx.font = 'italic 400 56px "Times New Roman", serif'; // Larger font
                ctx.fillStyle = '#1e293b'; 
                
                const text = data.intention || "Respire. Sinta. Agradeça.";
                const words = text.split(' ');
                let line = '';
                let lineY = pad + 100 + photoSize + 120;
                const lineHeight = 70;
                
                for(let n = 0; n < words.length; n++) {
                  const testLine = line + words[n] + ' ';
                  if (ctx.measureText(testLine).width > 800 && n > 0) {
                    ctx.fillText(line, W/2, lineY);
                    line = words[n] + ' ';
                    lineY += lineHeight;
                  } else {
                    line = testLine;
                  }
                }
                ctx.fillText(line, W/2, lineY);

                // Mood Label
                lineY += 80;
                ctx.fillStyle = style.color;
                ctx.font = 'bold 30px sans-serif';
                ctx.fillText(`— ESTADO ${data.mood.replace('MELANCÓLICO', 'REFLEXIVO')} —`, W/2, lineY);


                // 6. Watermark Footer
                const footerY = H - 80;
                ctx.font = 'bold 28px sans-serif'; 
                ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
                
                const dateText = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
                
                ctx.textAlign = 'left';
                ctx.fillText(dateText, pad, footerY);
                
                ctx.textAlign = 'right';
                ctx.fillText("VIVA360", W - pad, footerY);
            };
        }
    }, [step, data.image]);

    // State to hold updated user for completion
    const [finalUser, setFinalUser] = useState<User | null>(null);

    const handleNurtureStart = async () => {
        setStep('NURTURE');
         
         // 1. Auto-Save to Soul Journal (Invisible)
         try {
             await api.journal.create({
                 date: new Date().toISOString().split('T')[0],
                 mood: data.mood,
                 actionIntent: data.intention,
                 gratitude: data.gratitude
             });
         } catch (e) {
             console.error("Failed to auto-save journal", e);
         }

         // Calculate rewards
         const reward = gardenService.calculateWateringReward(user);
            
         // Generate Phrases
         const phrases = phraseGenerator.generate({
             mood: data.mood,
             intention: data.intention,
             gratitude: data.gratitude
         });

         // Create Snap
         const newSnap: DailyRitualSnap = {
             id: Date.now().toString(),
             date: new Date().toISOString(),
             image: data.image,
             mood: data.mood,
             note: data.intention, // Storing intention as note
             phrases: phrases 
         };

         console.log("Saving Snap with Whispers:", newSnap); // Debug Log

         // Update User
         const updatedUser: User = {
             ...user,
             lastWateredAt: new Date().toISOString(),
             plantHealth: Math.min(100, (user.plantHealth || 0) + 15),
             plantXp: (user.plantXp || 0) + reward.xp,
             karma: (user.karma || 0) + reward.karma,
             snaps: [newSnap, ...(user.snaps || [])]
         };
         
         setFinalUser(updatedUser);

         // API Call
         await api.users.update(updatedUser);
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

                    <button 
                        onClick={() => {
                            if (finalUser) updateUser(finalUser);
                            else updateUser(user);
                            onClose();
                        }}
                        className="mt-8 px-12 py-4 bg-white text-emerald-900 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all animate-in fade-in delay-1000 duration-1000"
                    >
                        Concluir
                    </button>
                 </div>
            </div>
        );
    }

    return null;
};
