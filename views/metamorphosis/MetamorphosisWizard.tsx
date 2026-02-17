import React, { useState, useRef, useEffect } from 'react';
import { Camera, Heart, Activity, Coffee, Moon, Sun, ArrowRight, CheckCircle, Smile, Frown, Meh, CloudRain, Zap, Battery, X, Share2, Download, ShieldCheck, Sparkles, Wind, Droplets, Mountain } from 'lucide-react';
import { PortalView, CameraWidget } from '../../components/Common';
import type { CameraCaptureResult } from '../../components/Common/CameraWidget';
import { ViewState, User } from '../../types';
import { api } from '../../services/api';
import { MOOD_ELEMENTS } from '../../src/data/metamorphosisData';
import { phraseService } from '../../services/phraseService';
import { useSoulCards } from '../../src/hooks/useSoulCards';
import { SoulCardReveal } from './SoulCardReveal';
import { dataUrlToBlob } from '../../src/utils/dataUrl';
import { buildLocalImageKey, idbImages } from '../../src/utils/idbImageStore';

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

export const MetamorphosisWizard: React.FC<{ flow: any, setView: (v: ViewState) => void, onClose?: () => void, user?: User }> = ({ flow, setView, onClose, user }) => {
    const [step, setStep] = useState(1);
    const [mood, setMood] = useState('');
    const [photo, setPhoto] = useState<CameraCaptureResult | null>(null);
    const [photoHash, setPhotoHash] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [format, setFormat] = useState<'STORY' | 'POST'>('STORY');
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardPhrase, setCardPhrase] = useState('');
    const [isDrawing, setIsDrawing] = useState(false); // Lock share until ready
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [drewCard, setDrewCard] = useState<any>(null);
    const [showSoulReveal, setShowSoulReveal] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ritualDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const soulCardUserId = String(user?.id || 'user_current').trim() || 'user_current';
    const { performDraw } = useSoulCards(soulCardUserId);

    useEffect(() => {
        return () => {
            if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
            if (ritualDelayRef.current) clearTimeout(ritualDelayRef.current);
        };
    }, []);

    // Step 1: Mood Selection
    const handleMoodSelect = (m: string) => {
        setMood(m);
        setCardPhrase(phraseService.getPhrase(m, 'CARD'));
        setStep(2);
    };

    // Step 2: Photo Capture
    const handleCapture = async (capture: CameraCaptureResult) => {
        const hash = `hash_${Date.now()}`;
        setPhotoHash(hash);
        setPhoto(capture);
        setStep(3);
        try {
            await idbImages.put(buildLocalImageKey(hash), capture.fullBlob);
        } catch (e) {
            console.warn('[MetamorphosisWizard] idbImages.put failed', e);
        }
        processMetamorphosis(hash, capture);
    };

    // Step 3: Premium Processing Experience
    const processMetamorphosis = async (hash: string, capture: CameraCaptureResult) => {
        setIsProcessing(true);
        const fallbackEntry = {
            id: Date.now(),
            mood,
            photoThumb: capture.displayUrl,
            photoHash: hash,
            quote: cardPhrase,
            timestamp: new Date().toISOString()
        };

        if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = setTimeout(() => {
            setResult((prev: any) => prev || fallbackEntry);
            setShowSoulReveal(false);
            setIsProcessing(false);
            setStep(4);
        }, 12000);
        
        try {
            const entry = await api.metamorphosis.checkIn(mood, hash, capture.thumbDataUrl);
            if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
            
            // Longer delay for ritualistic feel
            ritualDelayRef.current = setTimeout(() => {
                const card = performDraw(1, mood); // Mock streak 1 for now
                setDrewCard(card);
                // Keep local high-quality photo for UI/canvas.
                setResult({ ...(entry as any), photoThumb: capture.displayUrl, photoHash: hash });
                setIsProcessing(false);
                setShowSoulReveal(true);
                // setStep(4) will be triggered after reveal closes
            }, 2500); 
        } catch (e) {
            console.error("Metamorphosis Error", e);
            if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
            // Fallback for UI continuity
            setResult(fallbackEntry);
            setIsProcessing(false);
            setStep(4);
        }
    };

    const continueWithoutWaiting = () => {
        if (!photo) return;
        if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
        if (ritualDelayRef.current) clearTimeout(ritualDelayRef.current);
        setResult((prev: any) => prev || {
            id: Date.now(),
            mood,
            photoThumb: photo.displayUrl,
            photoHash: photoHash || undefined,
            quote: cardPhrase || phraseService.getPhrase(mood || 'Calmo', 'CARD'),
            timestamp: new Date().toISOString(),
        });
        setShowSoulReveal(false);
        setIsProcessing(false);
        setStep(4);
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
            const blob = dataUrlToBlob(dataUrl);
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
            if (!ctx) {
                setIsDrawing(false);
                return;
            }

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

            const resolvedQuote = String(result?.quote || cardPhrase || phraseService.getPhrase(String(result?.mood || mood || 'Calmo'), 'CARD')).trim();
            const resolvedTimestamp = result?.timestamp || new Date().toISOString();

            const userImg = new Image();
            userImg.crossOrigin = "anonymous";
            userImg.src = result.photoThumb;

            userImg.onload = () => {
                try {
                    const W = 1080; 
                    const H = format === 'STORY' ? 1920 : 1350; 
                    canvas.width = W;
                    canvas.height = H;

                    const styling = MOOD_ELEMENTS[result.mood as keyof typeof MOOD_ELEMENTS] || MOOD_ELEMENTS['Calmo'];
                    const elementColor = styling.color.includes('rose') ? '#f43f5e' : 
                                         styling.color.includes('cyan') ? '#06b6d4' : 
                                         styling.color.includes('emerald') ? '#10b981' : 
                                         styling.color.includes('indigo') ? '#6366f1' : '#f59e0b';
                    
                    const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
                    bgGradient.addColorStop(0, '#0f172a');
                    bgGradient.addColorStop(0.5, '#111827');
                    bgGradient.addColorStop(1, '#020617');
                    ctx.fillStyle = bgGradient;
                    ctx.fillRect(0, 0, W, H);

                    ctx.globalAlpha = 0.03;
                    for (let i = 0; i < 5000; i++) {
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
                    }
                    ctx.globalAlpha = 1.0;

                    const photoW = format === 'STORY' ? 900 : 1000;
                    const photoH = format === 'STORY' ? 1200 : 800;
                    const photoX = (W - photoW) / 2;
                    const photoY = format === 'STORY' ? 250 : 200;

                    ctx.save();
                    drawRoundRect(photoX, photoY, photoW, photoH, 40);
                    ctx.clip();
                    
                    const scale = Math.max(photoW / userImg.width, photoH / userImg.height);
                    const rx = photoX + (photoW - userImg.width * scale) / 2;
                    const ry = photoY + (photoH - userImg.height * scale) / 2;
                    ctx.filter = `brightness(1.05) contrast(1.1) saturate(1.1)`; 
                    ctx.drawImage(userImg, rx, ry, userImg.width * scale, userImg.height * scale);
                    ctx.filter = 'none';

                    ctx.globalCompositeOperation = 'soft-light';
                    ctx.fillStyle = `${elementColor}33`;
                    ctx.fillRect(photoX, photoY, photoW, photoH);
                    
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
                        gData.data[i+3] = 10;
                    }
                    gCtx.putImageData(gData, 0, 0);
                    ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat')!;
                    ctx.globalAlpha = 0.03;
                    ctx.fillRect(photoX, photoY, photoW, photoH);
                    ctx.globalAlpha = 1.0;
                    
                    ctx.restore();

                    const quoteAreaY = photoY + photoH + 40;
                    const centerX = W / 2;

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(photoX + 100, quoteAreaY);
                    ctx.lineTo(photoX + photoW - 100, quoteAreaY);
                    ctx.stroke();

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'italic 48px serif';
                    
                    const words = resolvedQuote.split(/\s+/).filter(Boolean);
                    let line = '';
                    let lineY = quoteAreaY + 60;
                    const lineHeight = 65;

                    for(let n = 0; n < words.length; n++) {
                        const testLine = line + words[n] + ' ';
                        if (ctx.measureText(testLine).width > (photoW - 150) && n > 0) {
                            ctx.fillText(line.trim(), centerX, lineY);
                            line = words[n] + ' ';
                            lineY += lineHeight;
                        } else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line.trim(), centerX, lineY);

                    const footerY = H - 120;
                    ctx.font = 'bold 20px sans-serif';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    (ctx as any).letterSpacing = '4px';
                    const dateStr = new Date(resolvedTimestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase();
                    ctx.fillText(dateStr, centerX, footerY - 40);
                    
                    ctx.font = 'bold 22px sans-serif';
                    ctx.fillStyle = '#d4af37';
                    (ctx as any).letterSpacing = '8px';
                    ctx.fillText(`VIVA360 • ESSÊNCIA & EVOLUÇÃO`, centerX, footerY);

                    setPreviewUrl(canvas.toDataURL('image/png'));
                } catch (drawError) {
                    console.error('Erro ao desenhar card da alma', drawError);
                    setPreviewUrl(result?.photoThumb || null);
                } finally {
                    setIsDrawing(false);
                }
            };
            userImg.onerror = () => {
                try {
                    const W = 1080;
                    const H = format === 'STORY' ? 1920 : 1350;
                    canvas.width = W;
                    canvas.height = H;
                    const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
                    bgGradient.addColorStop(0, '#0f172a');
                    bgGradient.addColorStop(1, '#020617');
                    ctx.fillStyle = bgGradient;
                    ctx.fillRect(0, 0, W, H);
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'italic 44px serif';
                    ctx.fillText(resolvedQuote, W / 2, H / 2 - 120, W - 160);
                    ctx.font = 'bold 22px sans-serif';
                    ctx.fillStyle = '#d4af37';
                    ctx.fillText('VIVA360 • ESSÊNCIA & EVOLUÇÃO', W / 2, H - 120);
                    setPreviewUrl(canvas.toDataURL('image/png'));
                } catch (drawError) {
                    console.error('Falha no fallback do card da alma', drawError);
                    setPreviewUrl(null);
                } finally {
                    setIsDrawing(false);
                }
            };
            if (!userImg.src) {
                userImg.onerror?.(new Event('error'));
            }
        }
    }, [step, result, format, cardPhrase, mood]);

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
                    userPhoto={photo.displayUrl} 
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
                    <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-right duration-500 bg-black">
                        <div className="h-[10%] flex items-center justify-between w-full px-8 pt-4">
                             <button onClick={() => setStep(1)} className="p-3 rounded-full text-white/60 hover:text-white transition-colors"><ArrowRight className="rotate-180" size={20}/></button>
                             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Metamorfose</p>
                             <button onClick={onClose || (() => flow.reset())} className="p-3 rounded-full text-white/60 hover:text-white transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="h-[70%] w-full relative overflow-hidden bg-black flex items-center justify-center">
                            <div className="w-full h-full max-w-md relative">
                                <CameraWidget onCapture={handleCapture} variant="POST" />
                                {/* Premium Viewport Overlay */}
                                <div className="absolute inset-0 pointer-events-none border-[1.5rem] border-black/10 flex items-center justify-center">
                                    <div className="w-full h-full border border-white/20 rounded-[2rem]"></div>
                                </div>
                            </div>
                        </div>

                        <div className="h-[20%] w-full bg-black p-8 text-center flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 text-nature-400 mb-2">
                                <ShieldCheck size={14} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Presença Registrada</span>
                            </div>
                            <h3 className="text-white font-serif italic text-lg leading-tight">Sintonizando sua forma atual.</h3>
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
                        <button
                            onClick={continueWithoutWaiting}
                            className="mt-8 px-5 py-3 rounded-2xl border border-nature-200 bg-white text-[10px] font-bold uppercase tracking-widest text-nature-500 hover:bg-nature-50 transition-all"
                        >
                            Continuar agora
                        </button>
                    </div>
                )}

                {/* STEP 4: THE SOUL CARD REVEAL */}
                {step === 4 && result && (
                    <div className="flex-1 flex flex-col items-center animate-in zoom-in duration-1000">
                        {/* Hidden Canvas - Source of Truth */}
                        <canvas ref={canvasRef} className="hidden" />

                        {/* LIVE PREVIEW - Uses the canvas data manually to show WYSIWYG */}
                        <div className="relative w-full max-w-[350px] shadow-2xl rounded-[10px] overflow-hidden border-4 border-white" style={{ aspectRatio: format === 'STORY' ? '9 / 16' : '4 / 5' }}>
                             {previewUrl ? (
                                 <img src={previewUrl} className="w-full h-full object-contain animate-in fade-in duration-500" alt="Soul Card Preview" />
                             ) : (
                                 <div className="flex flex-col items-center justify-center h-full gap-4">
                                     <Sparkles size={32} className="text-amber-400 animate-spin" />
                                     <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Cristalizando...</p>
                                 </div>
                             )}
                        </div>

                        {/* Aspect Ratio Toggle */}
                        <div className="flex gap-2 mt-8 mb-6 w-full px-4">
                            {(['STORY', 'POST'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFormat(f)}
                                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${format === f ? 'bg-indigo-900 text-white' : 'bg-white text-indigo-400'}`}
                                >
                                    {f === 'STORY' ? '9:16 Story' : '4:5 Feed'}
                                </button>
                            ))}
                        </div>

                        {/* Premium Sharing Tray */}
                        <div className="w-full grid grid-cols-2 gap-4 px-4">
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
            
            {/* Animations moved to src/index.css for security */}
        </PortalView>
    );
};
