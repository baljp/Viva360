import React, { useState, useRef, useEffect } from 'react';
import { Camera, Heart, Activity, Coffee, Moon, Sun, ArrowRight, CheckCircle, Smile, Frown, Meh, CloudRain, Zap, Battery, X, Share2, Download, ShieldCheck, Sparkles, Wind, Droplets, Mountain } from 'lucide-react';
import { PortalView, CameraWidget } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';
import { getRandomPhrase, MOOD_ELEMENTS } from '../../src/data/metamorphosisData';

const MOODS = [
    { id: 'Feliz', icon: Sun, element: 'Fogo' },
    { id: 'Calmo', icon: Coffee, element: 'Água' },
    { id: 'Grato', icon: Heart, element: 'Terra' },
    { id: 'Motivado', icon: Zap, element: 'Fogo' },
    { id: 'Cansado', icon: Battery, element: 'Terra' },
    { id: 'Ansioso', icon: CloudRain, element: 'Ar' },
    { id: 'Triste', icon: Frown, element: 'Água' },
    { id: 'Sobrecarregado', icon: Activity, element: 'Ar' }
];

const ELEMENT_ICONS = {
    'Fogo': <Zap size={14} className="text-rose-500" />,
    'Água': <Droplets size={14} className="text-cyan-500" />,
    'Terra': <Mountain size={14} className="text-emerald-500" />,
    'Ar': <Wind size={14} className="text-indigo-500" />
};

export const MetamorphosisWizard: React.FC<{ flow: any, setView: (v: ViewState) => void, onClose?: () => void }> = ({ flow, setView, onClose }) => {
    const [step, setStep] = useState(1);
    const [mood, setMood] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardPhrase, setCardPhrase] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Step 1: Mood Selection
    const handleMoodSelect = (m: string) => {
        setMood(m);
        setCardPhrase(getRandomPhrase(m));
        setStep(2);
    };

    // Step 2: Photo Capture
    const handleCapture = (photoUrl: string) => {
        setPhoto(photoUrl);
        setStep(3);
        processMetamorphosis(photoUrl);
    };

    // Step 3: Premium Processing Experience
    const processMetamorphosis = async (photoUrl: string) => {
        setIsProcessing(true);
        const photoHash = 'hash_' + Date.now(); 
        
        try {
            const entry = { 
                id: Date.now(), 
                mood, 
                photoThumb: photoUrl, 
                quote: cardPhrase, 
                timestamp: new Date().toISOString()
            };
            
            await api.metamorphosis.checkIn(mood, photoHash, photoUrl);

            // Longer delay for ritualistic feel
            setTimeout(() => {
                setResult(entry);
                setIsProcessing(false);
                setStep(4);
            }, 3000); 
        } catch (e) {
            console.error("Metamorphosis Error", e);
            setResult({
                id: Date.now(),
                mood,
                photoThumb: photoUrl,
                quote: cardPhrase,
                timestamp: new Date().toISOString()
            });
            setIsProcessing(false);
            setStep(4);
        }
    };

    const downloadCard = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `viva360-soulcard-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL('image/png', 1.0);
        link.click();
    };

    const shareCard = async () => {
        if (!canvasRef.current) return;
        try {
            const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'viva360-soulcard.png', { type: 'image/png' });
            
            if (navigator.share) {
                await navigator.share({
                    title: 'Meu Card da Alma • Viva360',
                    text: `"${cardPhrase}" #Viva360 #SoulGarden`,
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

    // Premium Canvas Drawing: 1:1 Instagram Square
    useEffect(() => {
        if (step === 4 && result && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const userImg = new Image();
            userImg.crossOrigin = "anonymous";
            userImg.src = result.photoThumb;

            userImg.onload = () => {
                const W = 1080; // IG High Res
                const H = 1080;
                canvas.width = W;
                canvas.height = H;

                const styling = MOOD_ELEMENTS[result.mood as keyof typeof MOOD_ELEMENTS] || MOOD_ELEMENTS['Calmo'];
                
                // 1. Background Layer (Premium Paper/Organic Texture)
                ctx.fillStyle = styling.bg;
                ctx.fillRect(0, 0, W, H);
                
                // 2. Main Photo Rendering (Protagonist)
                // We center it slightly with a small padding for the premium border effect
                const pad = 80;
                const photoSize = W - (pad * 2);
                
                ctx.save();
                // Rounded Rectangle Mask for Photo
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

                // Draw Image Cover Style
                const scale = Math.max(photoSize / userImg.width, photoSize / userImg.height);
                const x = pad + (photoSize / 2) - (userImg.width * scale) / 2;
                const y = pad + (photoSize / 2) - (userImg.height * scale) / 2;
                ctx.drawImage(userImg, x, y, userImg.width * scale, userImg.height * scale);
                ctx.restore();

                // 3. Elements Overlay (The "Pokémon" symbols)
                // Top Center Badge
                ctx.save();
                ctx.shadowBlur = 30;
                ctx.shadowColor = 'rgba(0,0,0,0.1)';
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(W/2, pad, 50, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
                // 4. Content Block (Frase do Dia)
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Phrase
                ctx.font = 'italic 500 48px serif'; // Mimic Playfair Display
                ctx.fillStyle = '#1e293b'; 
                
                const words = result.quote.split(' ');
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

                // 5. Branding & Timestamp (Premium Watermark)
                ctx.font = 'bold 24px sans-serif'; 
                ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
                
                const dateText = new Date(result.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                // Add spaces for tracking effect
                const spacedDateText = dateText.split('').join('  ');
                const spacedBrandText = 'V I V A 3 6 0';

                ctx.textAlign = 'left';
                ctx.fillText(spacedDateText, pad, H - 100);
                
                ctx.textAlign = 'right';
                ctx.fillText(spacedBrandText, W - pad, H - 100);

                // 6. Element Icon on Top Badge (Manual Draw simple shape for speed)
                ctx.fillStyle = styling.color.replace('text-', '').replace('rose-500', '#f43f5e').replace('cyan-500', '#06b6d4').replace('emerald-500', '#10b981').replace('indigo-500', '#6366f1').replace('amber-500', '#f59e0b');
                ctx.beginPath();
                ctx.arc(W/2, pad, 10, 0, Math.PI * 2);
                ctx.fill();
            };
        }
    }, [step, result]);

    const styling = result ? (MOOD_ELEMENTS[result.mood as keyof typeof MOOD_ELEMENTS] || MOOD_ELEMENTS['Calmo']) : MOOD_ELEMENTS['Calmo'];
    return (
        <PortalView 
            title="Card da Alma" 
            subtitle="RITUAL DE PRESENÇA" 
            onBack={() => step > 1 ? setStep(step - 1) : flow.back()}
            onClose={onClose || (() => flow.reset())}
            heroImage={step === 1 ? "https://images.unsplash.com/photo-1518609878319-a16322081109?q=80&w=800" : undefined}
        >
            <div className="flex flex-col h-full min-h-[70vh]">
                
                {/* STEP 1: MOOD SELECTION */}
                {step === 1 && (
                    <div className="flex-1 animate-in fade-in slide-in-from-bottom duration-700">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-serif italic text-nature-900 mb-2">Como pulsa sua alma hoje?</h2>
                            <p className="text-xs text-nature-400 uppercase tracking-widest font-bold">Identidade Elemental</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 px-2 pb-10">
                            {MOODS.map(m => {
                                const style = MOOD_ELEMENTS[m.id as keyof typeof MOOD_ELEMENTS] || MOOD_ELEMENTS['Calmo'];
                                return (
                                    <button key={m.id} onClick={() => handleMoodSelect(m.id)} className={`relative overflow-hidden group p-8 rounded-[2.5rem] bg-white border border-nature-100 shadow-sm transition-all active:scale-95 hover:shadow-xl hover:border-nature-200`}>
                                        <div className={`absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full ${style.bg} transition-transform group-hover:scale-110`}></div>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${style.bg} ${style.color}`}>
                                            <m.icon size={30} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest leading-none mb-1">{m.element}</p>
                                            <span className="font-serif italic text-xl text-nature-900">{m.id}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 2: PREMIUM CAMERA */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-right duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-serif italic text-nature-900">Capture este instante</h2>
                            <p className="text-[10px] text-nature-400 uppercase tracking-widest font-bold mt-2">A alma do seu card</p>
                        </div>
                        <div className="w-full aspect-square bg-black rounded-[3rem] relative overflow-hidden shadow-2xl border-2 border-white mb-8">
                            <CameraWidget onCapture={handleCapture} />
                            {/* Premium Viewport Overlay */}
                            <div className="absolute inset-0 pointer-events-none border-[1.5rem] border-black/10 flex items-center justify-center">
                                <div className="w-full h-full border border-white/20 rounded-[2rem]"></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-nature-400">
                            <ShieldCheck size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Enclave de Privacidade Ativo</span>
                        </div>
                    </div>
                )}

                {/* STEP 3: RITUALISTIC PROCESSING */}
                {step === 3 && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${styling.glow} opacity-30`}></div>
                            <div className="w-24 h-24 rounded-full border border-nature-100 flex items-center justify-center animate-spin-slow">
                                <Sparkles size={32} className={styling.color} />
                            </div>
                        </div>
                        <h3 className="font-serif italic text-xl text-nature-700 mt-10">Sintonizando com {styling.element}...</h3>
                        <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-black mt-4 animate-pulse">Codificando Essência</p>
                    </div>
                )}

                {/* STEP 4: THE SOUL CARD REVEAL */}
                {step === 4 && result && (
                    <div className="flex-1 flex flex-col items-center animate-in zoom-in duration-1000">
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {/* Interactive Premium Card UI */}
                        <div id="soul-card-preview" className={`relative aspect-square w-full max-w-[400px] rounded-[3.5rem] shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col items-center ${styling.bg} p-6 border border-white/40`}>
                            {/* Card Content (Mirroring Canvas) */}
                            <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden group shadow-inner">
                                <img src={result.photoThumb} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                
                                {/* Top Badge Overlay */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white/50 z-20">
                                   <div className={`w-12 h-12 rounded-full ${styling.bg} flex items-center justify-center ${styling.color}`}>
                                       {mood && MOODS.find(m => m.id === mood)?.icon && React.createElement(MOODS.find(m => m.id === mood)!.icon, { size: 24 })}
                                   </div>
                                </div>
                                
                                {/* Aura Light */}
                                <div className={`absolute inset-0 bg-gradient-to-t ${styling.aura} to-transparent opacity-40 mix-blend-soft-light`}></div>
                            </div>

                            {/* Text Area */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-4">
                                <p className="text-xl font-serif italic text-nature-900 leading-tight">"{result.quote}"</p>
                            </div>

                            {/* Footer Wavemark */}
                            <div className="w-full flex justify-between items-end pb-2 opacity-30 mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black tracking-widest">{new Date().toLocaleDateString('pt-BR').toUpperCase()}</span>
                                    <span className="text-[8px] font-black tracking-widest">SOUL CARD #128</span>
                                </div>
                                <span className="text-[10px] font-black tracking-[0.4em]">VIVA360</span>
                            </div>

                            {/* Shine Animation Overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shine"></div>
                        </div>

                        {/* Premium Sharing Tray */}
                        <div className="mt-12 w-full grid grid-cols-2 gap-4 px-4">
                            <button onClick={shareCard} className="col-span-2 py-5 bg-nature-900 text-white rounded-[2rem] flex items-center justify-center gap-3 font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
                                <Share2 size={18} /> Viralizar Jornada
                            </button>
                            <button onClick={downloadCard} className="py-4 bg-white border border-nature-100 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase text-[9px] tracking-widest text-nature-400 active:scale-95 transition-all">
                                <Download size={16} /> Salvar HD
                            </button>
                            <button onClick={() => setStep(5)} className="py-4 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold uppercase text-[9px] tracking-widest active:scale-95 transition-all">
                                <CheckCircle size={16} /> Concluir Ritual
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 5: RITUAL SUCCESS */}
                {step === 5 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 animate-in fade-in duration-1000">
                        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8 relative">
                             <Heart size={48} className="text-rose-400 fill-rose-200 animate-pulse" />
                             <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-2 rounded-full rotate-12 shadow-lg">
                                 <Sparkles size={16} />
                             </div>
                        </div>
                        <h2 className="text-3xl font-serif italic text-nature-900 mb-4">Registro Cristalizado</h2>
                        <p className="text-nature-500 leading-relaxed mb-12">Sua frequência elemental foi integrada ao Jardim e sua evolução diária avançou.</p>
                        
                        <div className="flex flex-col w-full gap-4">
                            <button onClick={() => flow.go('HISTORY')} className="w-full py-5 bg-nature-900 text-white rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-xl">
                                Ver Grimório de Cards
                            </button>
                            <button onClick={() => flow.go('DASHBOARD')} className="w-full py-5 bg-nature-100 text-nature-600 rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em]">
                                Voltar ao Core
                            </button>
                        </div>
                    </div>
                )}

            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shine {
                    100% { transform: translateX(100%); }
                }
                .animate-shine {
                    animation: shine 3s infinite ease-in-out;
                }
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
            `}} />
        </PortalView>
    );
};
