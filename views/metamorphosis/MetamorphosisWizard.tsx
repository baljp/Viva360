import React, { useState, useRef, useEffect } from 'react';
import { Camera, Heart, Activity, Coffee, Moon, Sun, ArrowRight, CheckCircle, Smile, Frown, Meh, CloudRain, Zap, Battery, X, Share2, Download, ShieldCheck, Sparkles, Wind, Droplets, Mountain } from 'lucide-react';
import { PortalView, CameraWidget } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';
import { MOOD_ELEMENTS } from '../../src/data/metamorphosisData';
import { phraseService } from '../../services/phraseService';
import { useSoulCards } from '../../src/hooks/useSoulCards';
import { SoulCardReveal } from './SoulCardReveal';

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
    const [isDrawing, setIsDrawing] = useState(false); // Lock share until ready
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [drewCard, setDrewCard] = useState<any>(null);
    const [showSoulReveal, setShowSoulReveal] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { performDraw } = useSoulCards('user_current'); // Should use real user ID

    // Step 1: Mood Selection
    const handleMoodSelect = (m: string) => {
        setMood(m);
        setCardPhrase(phraseService.getPhrase(m, 'CARD'));
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
            const entry = await api.metamorphosis.checkIn(mood, photoHash, photoUrl);
            
            // Longer delay for ritualistic feel
            setTimeout(() => {
                const card = performDraw(1, mood); // Mock streak 1 for now
                setDrewCard(card);
                setResult(entry);
                setIsProcessing(false);
                setShowSoulReveal(true);
                // setStep(4) will be triggered after reveal closes
            }, 2500); 
        } catch (e) {
            console.error("Metamorphosis Error", e);
            // Fallback for UI continuity
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
        if (!canvasRef.current || isDrawing) return;
        try {
            const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'viva360-soulcard.png', { type: 'image/png' });
            
            if (navigator.share) {
                await navigator.share({
                    title: 'Meu Card da Alma • Viva360',
                    text: `Esse foi um dia importante para mim. ✨ Viva360`,
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

    // Premium Canvas Drawing: 1080x1920 (Story Format) or 1080x1080 (Post)
    // User requested "Card Format" - let's stick to a rich Portrait Card (Story/Status friendly 9:16 approx)
    useEffect(() => {
        if (step === 4 && result && canvasRef.current) {
            setIsDrawing(true);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Safe Rounded Rect Helper (Browser Compatibility)
            const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.arcTo(x + w, y, x + w, y + h, r);
                ctx.arcTo(x + w, y + h, x, y + h, r);
                ctx.arcTo(x, y + h, x, y, r);
                ctx.arcTo(x, y, x+w, y, r);
                ctx.closePath();
            };

            const userImg = new Image();
            userImg.crossOrigin = "anonymous";
            userImg.src = result.photoThumb;

            userImg.onload = () => {
                const W = 1080; 
                const H = 1920; 
                canvas.width = W;
                canvas.height = H;

                const styling = MOOD_ELEMENTS[result.mood as keyof typeof MOOD_ELEMENTS] || MOOD_ELEMENTS['Calmo'];
                const elementColor = styling.color.includes('rose') ? '#f43f5e' : 
                                     styling.color.includes('cyan') ? '#06b6d4' : 
                                     styling.color.includes('emerald') ? '#10b981' : 
                                     styling.color.includes('indigo') ? '#6366f1' : '#f59e0b';
                
                // --- LAYER 1: BACKGROUND (Deep & Atmospheric) ---
                const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
                bgGradient.addColorStop(0, '#0f172a'); // Deep Slate
                bgGradient.addColorStop(0.5, '#111827');
                bgGradient.addColorStop(1, '#020617'); // Darker bottom
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, W, H);

                // Add subtle texture/noise (simulated)
                ctx.globalAlpha = 0.03;
                for (let i = 0; i < 5000; i++) {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
                }
                ctx.globalAlpha = 1.0;

                // --- LAYER 2: PHOTO (Protagonist) ---
                const photoW = 900;
                const photoH = 1200;
                const photoX = (W - photoW) / 2;
                const photoY = 250;

                ctx.save();
                // Rounded clip for photo
                drawRoundRect(photoX, photoY, photoW, photoH, 40);
                ctx.clip();
                
                const scale = Math.max(photoW / userImg.width, photoH / userImg.height);
                const rx = photoX + (photoW - userImg.width * scale) / 2;
                const ry = photoY + (photoH - userImg.height * scale) / 2;
                // --- IG QUALITY PIPELINE (SOUL CARD - NARRATIVE SHARP) ---
                // 1. Base Image with Narrative Contrast
                ctx.filter = `brightness(1.05) contrast(1.1) saturate(1.1)`; 
                ctx.drawImage(userImg, rx, ry, userImg.width * scale, userImg.height * scale);
                ctx.filter = 'none';

                // 2. Light Correction Overlay (Warmth)
                ctx.globalCompositeOperation = 'soft-light';
                ctx.fillStyle = `${elementColor}33`;
                ctx.fillRect(photoX, photoY, photoW, photoH);
                
                // 3. Vignette (Premium Feel)
                ctx.globalCompositeOperation = 'multiply';
                const vignette = ctx.createRadialGradient(
                    photoX + photoW/2, photoY + photoH/2, 200,
                    photoX + photoW/2, photoY + photoH/2, 800
                );
                vignette.addColorStop(0, 'transparent');
                vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
                ctx.fillStyle = vignette;
                ctx.fillRect(photoX, photoY, photoW, photoH);
                ctx.globalCompositeOperation = 'source-over';

                // 4. Subtle Grain (Organic Narrative)
                const grainCanvas = document.createElement('canvas');
                grainCanvas.width = 128;
                grainCanvas.height = 128;
                const gCtx = grainCanvas.getContext('2d')!;
                const gData = gCtx.createImageData(128, 128);
                for (let i = 0; i < gData.data.length; i += 4) {
                    const val = Math.random() * 255;
                    gData.data[i] = val;
                    gData.data[i+1] = val;
                    gData.data[i+2] = val;
                    gData.data[i+3] = 10; // Extra subtle for Card
                }
                gCtx.putImageData(gData, 0, 0);
                ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat')!;
                ctx.globalAlpha = 0.03;
                ctx.fillRect(photoX, photoY, photoW, photoH);
                ctx.globalAlpha = 1.0;
                
                ctx.restore();

                // --- LAYER 3: GLASSMORPHISM BACKDROP FOR QUOTE ---
                const quoteH = 400;
                const quoteY = photoY + photoH - 150; // Overlaps bottom of photo
                
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 40;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                drawRoundRect(photoX + 50, quoteY, photoW - 100, quoteH, 50);
                ctx.fill();
                
                // Glass border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();

                // --- LAYER 4: SYMBOLS & TEXT ---
                const centerX = W / 2;

                // 1. Sacred Symbol (Above quote)
                ctx.globalAlpha = 0.6;
                ctx.strokeStyle = elementColor;
                ctx.lineWidth = 3;
                const symY = quoteY + 60;
                ctx.beginPath();
                ctx.arc(centerX, symY, 30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(centerX - 15, symY);
                ctx.lineTo(centerX + 15, symY);
                ctx.moveTo(centerX, symY - 15);
                ctx.lineTo(centerX, symY + 15);
                ctx.stroke();
                ctx.globalAlpha = 1.0;

                // 2. The Master Phrase (Quote)
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#f8fafc'; // Off-white (Sky 50)
                ctx.font = 'italic 52px serif'; // Elegant Serif
                
                const words = result.quote.split(' ');
                let line = '';
                let lineY = quoteY + 180;
                const lineHeight = 75;

                for(let n = 0; n < words.length; n++) {
                  const testLine = line + words[n] + ' ';
                  if (ctx.measureText(testLine).width > (photoW - 200) && n > 0) {
                    ctx.fillText(line.trim(), centerX, lineY);
                    line = words[n] + ' ';
                    lineY += lineHeight;
                  } else {
                    line = testLine;
                  }
                }
                ctx.fillText(line.trim(), centerX, lineY);

                // 3. Metadata (Contextual & Discrete)
                const metaY = H - 180;
                ctx.font = 'bold 24px sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                const dateStr = new Date(result.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
                ctx.fillText(dateStr, centerX, metaY);
                
                // 4. Ritual Seal (Signature)
                const sealY = H - 100;
                ctx.font = 'bold 20px sans-serif';
                ctx.fillStyle = '#d4af37'; // Golden
                (ctx as any).letterSpacing = '6px';
                ctx.fillText('VIVA360 • ARQUÉTIPO DA ALMA', centerX, sealY);

                setPreviewUrl(canvas.toDataURL('image/png'));
                setIsDrawing(false);
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
            {showSoulReveal && drewCard && photo && (
                <SoulCardReveal 
                    card={drewCard} 
                    userPhoto={photo} 
                    onClose={() => {
                        setShowSoulReveal(false);
                        setStep(4);
                    }} 
                />
            )}

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
                            <h2 className="text-2xl font-serif italic text-nature-900">Agora registre esse dia.</h2>
                            <p className="text-[10px] text-nature-400 uppercase tracking-widest font-bold mt-2">Ele fez parte da sua história.</p>
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
                        <div className="relative w-full max-w-[350px] shadow-2xl rounded-[10px] overflow-hidden border-4 border-white aspect-[9/16] bg-nature-50">
                             {previewUrl ? (
                                 <img src={previewUrl} className="w-full h-full object-contain animate-in fade-in duration-500" alt="Soul Card Preview" />
                             ) : (
                                 <div className="flex flex-col items-center justify-center h-full gap-4">
                                     <Sparkles size={32} className="text-amber-400 animate-spin" />
                                     <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Cristalizando...</p>
                                 </div>
                             )}
                        </div>

                        {/* Premium Sharing Tray */}
                        <div className="mt-8 w-full grid grid-cols-2 gap-4 px-4">
                            <button 
                                onClick={shareCard} 
                                disabled={isDrawing}
                                className="col-span-2 py-5 bg-nature-900 text-white rounded-[2rem] flex items-center justify-center gap-3 font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isDrawing ? <Sparkles size={18} className="animate-spin" /> : <Share2 size={18} />} 
                                {isDrawing ? 'Preparando Card...' : 'Viralizar Jornada'}
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
                        <h2 className="text-3xl font-serif italic text-nature-900 mb-4">Esse dia foi guardado.</h2>
                        <p className="text-nature-500 leading-relaxed mb-12">Sua travessia foi registrada com verdade. Sua história continua.</p>
                        
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



