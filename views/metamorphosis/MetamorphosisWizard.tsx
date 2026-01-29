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
                
                // --- LAYER 1: BACKGROUND BASE ---
                const bgGradient = ctx.createLinearGradient(0, 0, W, H);
                bgGradient.addColorStop(0, '#fdfbf7'); // Off-white paper
                bgGradient.addColorStop(1, '#f3f4f6');
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, W, H);

                // --- LAYER 2: ELEMENTAL AURA (Soft Glow) ---
                const elementColor = styling.color.includes('rose') ? '#f43f5e' : 
                                     styling.color.includes('cyan') ? '#06b6d4' : 
                                     styling.color.includes('emerald') ? '#10b981' : 
                                     styling.color.includes('indigo') ? '#6366f1' : '#f59e0b';
                
                const radGrad = ctx.createRadialGradient(W/2, H/2, 100, W/2, H/2, 600);
                radGrad.addColorStop(0, `${elementColor}15`); // Very faint
                radGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = radGrad;
                ctx.fillRect(0, 0, W, H);

                // --- LAYER 3: MAIN PHOTO FRAME (POLAROID STYLE WITH GOLD BORDER) ---
                const pad = 80;
                const bottomPad = 250; 
                const photoW = W - (pad * 2);
                const photoH = H - (pad + bottomPad); // Leave space for text at bottom

                // Drop Shadow for Frame
                ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                ctx.shadowBlur = 40;
                ctx.shadowOffsetY = 20;
                
                // Photo Background (White Frame)
                ctx.fillStyle = '#ffffff';
                ctx.roundRect(pad, pad, photoW, photoH, 40);
                ctx.fill();

                // Reset Shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;

                // Gold Border Outline
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#d4af37'; // Gold
                ctx.stroke();

                // --- LAYER 4: THE PHOTO ITSELF ---
                // Inner Padding for photo
                const innerPad = 20;
                const imgX = pad + innerPad;
                const imgY = pad + innerPad;
                const imgW = photoW - (innerPad * 2);
                const imgH = photoH - (innerPad * 2);

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(imgX, imgY, imgW, imgH, 20);
                ctx.clip();

                // Draw Image (Cover Fit)
                const scale = Math.max(imgW / userImg.width, imgH / userImg.height);
                const x = imgX + (imgW - userImg.width * scale) / 2;
                const y = imgY + (imgH - userImg.height * scale) / 2;
                ctx.drawImage(userImg, x, y, userImg.width * scale, userImg.height * scale);
                
                // Subtle Overlay on Photo
                ctx.fillStyle = `${elementColor}20`; // 20% opacity tint
                ctx.fillRect(imgX, imgY, imgW, imgH);
                
                ctx.restore();

                // --- LAYER 5: BADGE & ICONS ---
                // Top Center Badge Overlapping Photo/Frame
                const badgeY = pad;
                ctx.shadowColor = 'rgba(0,0,0,0.1)';
                ctx.shadowBlur = 10;
                
                ctx.beginPath();
                ctx.arc(W/2, badgeY, 40, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                
                // Gold Ring
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#d4af37';
                ctx.stroke();

                // Element Icon Circle
                ctx.beginPath();
                ctx.arc(W/2, badgeY, 20, 0, Math.PI * 2);
                ctx.fillStyle = elementColor;
                ctx.fill();

                // --- LAYER 6: TYPOGRAPHY (TEXT AREA) ---
                const textCenter = W / 2;
                const textStartY = pad + photoH + 60;

                ctx.shadowColor = 'transparent';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                // Quote
                ctx.font = 'italic 500 42px "Times New Roman", serif';
                ctx.fillStyle = '#1e293b'; // Slate 800
                
                const words = result.quote.split(' ');
                let line = '';
                let lineY = textStartY;
                const lineHeight = 55;
                
                // Simple word wrap
                for(let n = 0; n < words.length; n++) {
                  const testLine = line + words[n] + ' ';
                  if (ctx.measureText(testLine).width > 800 && n > 0) {
                    ctx.fillText(line, textCenter, lineY);
                    line = words[n] + ' ';
                    lineY += lineHeight;
                  } else {
                    line = testLine;
                  }
                }
                ctx.fillText(line, textCenter, lineY);

                // Footer Info
                const footerY = H - 60;
                ctx.font = 'bold 20px sans-serif';
                ctx.fillStyle = '#94a3b8'; // Slate 400
                (ctx as any).letterSpacing = '4px';

                const dateStr = new Date(result.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                
                ctx.textAlign = 'left';
                ctx.fillText(dateStr.split('').join(' '), pad, footerY);
                
                ctx.textAlign = 'right';
                ctx.fillText('VIVA360  •  JOURNEY', W - pad, footerY);

                // --- FINAL GOLD FRAME AROUND ENTIRE CARD ---
                ctx.lineWidth = 20;
                ctx.strokeStyle = '#ffffff';
                ctx.strokeRect(0, 0, W, H);
                
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#d4af37'; // Gold hairline
                ctx.strokeRect(20, 20, W-40, H-40);

                // Force update the state to show the image if needed, 
                // but usually we can just let the user see the canvas URL directly.
            };
        }
    }, [step, result]);

    const styling = result ? (MOOD_ELEMENTS[result.mood as keyof typeof MOOD_ELEMENTS] || MOOD_ELEMENTS['Calmo']) : MOOD_ELEMENTS['Calmo'];
    
    // Helper to get Canvas Data URL safely
    const getPreviewUrl = () => {
        if (!canvasRef.current) return result?.photoThumb;
        return canvasRef.current.toDataURL('image/png');
    };

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
                        {/* Hidden Canvas - Source of Truth */}
                        <canvas ref={canvasRef} className="hidden" />

                        {/* LIVE PREVIEW - Uses the canvas data manually to show WYSIWYG */}
                        <div className="relative w-full max-w-[350px] shadow-2xl rounded-[10px] overflow-hidden border-4 border-white">
                             {/* We use a state sync or ref sync to show the image here. 
                                 Since canvas drawing is async in useEffect, we might see a flash. 
                                 For simplicity, we render the canvas output as an image if available, or just the canvas itself scaled down.
                             */}
                             <CanvasPreview canvasRef={canvasRef} trigger={result} />
                        </div>

                        {/* Premium Sharing Tray */}
                        <div className="mt-8 w-full grid grid-cols-2 gap-4 px-4">
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

// Sub-component to Handle Live Canvas Preview updates
const CanvasPreview = ({ canvasRef, trigger }: any) => {
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    useEffect(() => {
        // Poll for canvas changes or wait for the parent to draw
        const timer = setTimeout(() => {
            if (canvasRef.current) {
                setImgUrl(canvasRef.current.toDataURL());
            }
        }, 100); // Small delay to allow draw
        return () => clearTimeout(timer);
    }, [trigger]);

    if (!imgUrl) return <div className="w-full aspect-square bg-nature-50 animate-pulse flex items-center justify-center text-xs text-nature-300">Renderizando...</div>;
    return <img src={imgUrl} className="w-full h-full object-contain" />;
};

