import React, { useState } from 'react';
import { User, DailyRitualSnap, MoodType } from '../../../types';
import { Camera, ArrowRight, Heart, Sparkles, Droplet, Check, Share2, X, Sun, Download, Instagram, TrendingUp } from 'lucide-react';
import { CameraWidget, ZenToast } from '../../../components/Common';
import type { CameraCaptureResult } from '../../../components/Common/CameraWidget';
import { SoulCard } from '../../../src/components/SoulCard';
import { phraseService } from '../../../services/phraseService';
import { gardenService } from '../../../services/gardenService';
import { api } from '../../../services/api';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { dataUrlToBlob } from '../../../src/utils/dataUrl';
import { buildLocalImageKey, idbImages } from '../../../src/utils/idbImageStore';

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
    const [step, setStep] = useState<'MOOD' | 'CAPTURE' | 'CAPTURE_REVIEW' | 'INTENTION' | 'GRATITUDE' | 'CARD' | 'SHARE' | 'NURTURE' | 'TRIBE'>('CAPTURE');
    const [data, setData] = useState<{ mood: MoodType; image: string; intention: string; gratitude: string }>({ 
        mood: 'SERENO', image: '', intention: '', gratitude: ''
    });
    const [capture, setCapture] = useState<CameraCaptureResult | null>(null);
    const [canvasRef] = useState(() => React.createRef<HTMLCanvasElement>());
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [format, setFormat] = useState<'STORY' | 'POST'>('STORY');
    const [isSaving, setIsSaving] = useState(false);

    const handleMoodSelect = (mood: MoodType) => {
        setData({ ...data, mood });
        setStep('INTENTION');
    };

    const handleCapture = (result: CameraCaptureResult) => {
        setCapture(result);
        setData(prev => ({ ...prev, image: result.displayUrl }));
        setStep('CAPTURE_REVIEW');
    };

    const handleIntentionSubmit = () => {
        setStep('GRATITUDE');
    };

    const handleGratitudeSubmit = () => {
        setStep('CARD');
    };

    const handleCardConfirm = () => {
        // Start saving in background - don't await to avoid blocking UI
        autoSaveSnap().catch(err => console.error("Ritual auto-save background error:", err));
        setStep('SHARE');
    };

    const autoSaveSnap = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            if (!capture) {
                throw new Error('Foto não capturada.');
            }
            // 1. Save to Soul Journal
            await api.journal.create({
                date: new Date().toISOString().split('T')[0],
                mood: data.mood,
                actionIntent: data.intention,
                gratitude: data.gratitude
            });

            // 2. Calculate rewards & create snap
            const reward = gardenService.calculateWateringReward(user);
            const phrases = phraseService.getPhrases(data.mood, 'JARDIM');
            const snapId = `ritual_${Date.now()}`;
            const newSnap: DailyRitualSnap = {
                id: snapId,
                date: new Date().toISOString(),
                // Keep lightweight thumb for immediate UI; full image stays local on the device.
                image: capture.thumbDataUrl,
                mood: data.mood,
                note: data.intention,
                phrases: phrases
            };

            // 2.1 Persist full image locally (Instagram-grade dimensions; zero network).
            try {
                await idbImages.put(buildLocalImageKey(snapId), capture.fullBlob);
            } catch (e) {
                console.warn('[DailyRitualWizard] idbImages.put failed', e);
            }

            // 3. Update user with snap + rewards
            const updatedUser: User = {
                ...user,
                lastWateredAt: new Date().toISOString(),
                plantHealth: Math.min(100, (user.plantHealth || 0) + 15),
                plantXp: (user.plantXp || 0) + reward.xp,
                karma: (user.karma || 0) + reward.karma,
                snaps: [newSnap, ...(user.snaps || [])]
            };
            setFinalUser(updatedUser);

            // 4. Persist to backend (profile + evolution snapshot)
            await Promise.all([
                // Strip heavy image payload before sending. Images are device-local (IndexedDB).
                api.users.update({
                    ...(updatedUser as any),
                    snaps: (updatedUser.snaps || []).map((s) => ({ ...(s as any), image: '' })),
                }),
                // Metamorphosis stores a tiny thumb (CDN) for cross-device list; full stays local.
                api.metamorphosis.checkIn(data.mood, snapId, capture.thumbDataUrl)
            ]);
        } catch (error) {
            console.error("Auto-save snap failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Canvas Logic for Sharing (Moved to top level)
    // const canvasRef = React.useRef<HTMLCanvasElement>(null);

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
            const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.96);
            const blob = dataUrlToBlob(dataUrl);
            const file = new File([blob], 'viva360-ritual.jpg', { type: 'image/jpeg' });
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Meu Jardim Interior • Viva360',
                    text: `Hoje eu cuidei do meu jardim interior. 🌿 Viva360`,
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
                const H = format === 'STORY' ? 1920 : 1350; // Story (9:16) or Post (4:5)
                canvas.width = W;
                canvas.height = H;

                const style = getCanvasStyle(data.mood);
                
                // --- LAYER 1: BACKGROUND (Deep & Atmospheric) ---
                const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
                bgGradient.addColorStop(0, '#0f172a'); // Deep Slate
                bgGradient.addColorStop(0.5, '#111827');
                bgGradient.addColorStop(1, '#020617');
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, W, H);

                // Subtle texture/noise
                ctx.globalAlpha = 0.03;
                for (let i = 0; i < 5000; i++) {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
                }
                ctx.globalAlpha = 1.0;

                // --- LAYER 2: PHOTO (Protagonist) ---
                const photoW = format === 'STORY' ? 900 : 1000;
                const photoH = format === 'STORY' ? 1200 : 800;
                const photoX = (W - photoW) / 2;
                const photoY = format === 'STORY' ? 250 : 200;

                ctx.save();
                // Rounded clip for photo
                const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    ctx.arcTo(x + w, y, x + w, y + h, r);
                    ctx.arcTo(x + w, y + h, x, y + h, r);
                    ctx.arcTo(x, y + h, x, y, r);
                    ctx.arcTo(x, y, x+w, y, r);
                    ctx.closePath();
                };
                drawRoundRect(photoX, photoY, photoW, photoH, 40);
                ctx.clip();
                
                const scale = Math.max(photoW / userImg.width, photoH / userImg.height);
                const rx = photoX + (photoW - userImg.width * scale) / 2;
                const ry = photoY + (photoH - userImg.height * scale) / 2;

                // --- IG QUALITY PIPELINE (SOUL GARDEN - ATMOSPHERIC) ---
                // 1. Base Image - Sharp & Natural
                ctx.filter = `saturate(1.05) contrast(1.02)`; // Subtle pop, no blur
                ctx.drawImage(userImg, rx, ry, userImg.width * scale, userImg.height * scale);
                ctx.filter = 'none';

                // 2. Light Correction Overlay (Soft Light for atmosphere)
                ctx.globalCompositeOperation = 'soft-light';
                ctx.fillStyle = `${style.color}44`; // Elemental tint
                ctx.fillRect(photoX, photoY, photoW, photoH);
                
                // 3. Overlay Gradient (45-60% as requested for depth)
                ctx.globalCompositeOperation = 'source-over';
                const gradPhoto = ctx.createLinearGradient(photoX, photoY + photoH * 0.4, photoX, photoY + photoH);
                gradPhoto.addColorStop(0, 'transparent');
                gradPhoto.addColorStop(1, 'rgba(0,0,0,0.5)'); // ~50%
                ctx.fillStyle = gradPhoto;
                ctx.fillRect(photoX, photoY, photoW, photoH);

                // 4. Grain/Noise Effect (2-4% organic)
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
                    gData.data[i+3] = 12; // ~4% opacity
                }
                gCtx.putImageData(gData, 0, 0);
                ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat')!;
                ctx.globalAlpha = 0.04;
                ctx.fillRect(photoX, photoY, photoW, photoH);
                ctx.globalAlpha = 1.0;

                // 5. Vignette (Suave)
                const vignette = ctx.createRadialGradient(
                    photoX + photoW/2, photoY + photoH/2, 200,
                    photoX + photoW/2, photoY + photoH/2, 800
                );
                vignette.addColorStop(0, 'transparent');
                vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
                ctx.fillStyle = vignette;
                ctx.fillRect(photoX, photoY, photoW, photoH);

                ctx.restore();

                // --- LAYER 3: PREMIUM TYPOGRAPHY AREA (NO POLLUTION) ---
                const quoteAreaY = photoY + photoH + 40;
                const centerX = W / 2;
                
                // 1. Divider Line (Subtle)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(photoX + 150, quoteAreaY + 40); // Shorter line
                ctx.lineTo(photoX + photoW - 150, quoteAreaY + 40);
                ctx.stroke();

                // 2. The Master Phrase (Quote) - Elegant & Clean
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'; // More subtle
                ctx.font = 'italic 32px serif'; // Smaller font (was 48px)
                
                const quote = data.intention || "Respire. Sinta. Agradeça.";
                const words = quote.split(' ');
                let line = '';
                let lineY = quoteAreaY + 80; // Lower position (was +60)
                const lineHeight = 45; // Adjusted for smaller font

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

                // --- LAYER 4: METADATA & SIGNATURE ---
                const footerY = H - 120;
                
                // Date (Discrete)
                ctx.font = 'bold 20px sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                (ctx as any).letterSpacing = '4px';
                const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase();
                ctx.fillText(dateStr, centerX, footerY - 40);
                
                // Signature (Golden Luxury)
                ctx.font = 'bold 22px sans-serif';
                ctx.fillStyle = '#d4af37';
                (ctx as any).letterSpacing = '8px';
                ctx.fillText('VIVA360 • RITUAL DIÁRIO', centerX, footerY);

                setPreviewUrl(canvas.toDataURL('image/png'));
            };
        }
    }, [step, data.image, format]);

    // State to hold updated user for completion
    const [finalUser, setFinalUser] = useState<User | null>(null);

    const handleNurtureStart = async () => {
        setStep('NURTURE');
        // Snap already saved in handleCardConfirm/autoSaveSnap
        // Just apply final user if not already set
        if (!finalUser) {
            await autoSaveSnap();
        }
    };

    // --- RENDER STEPS ---

    if (step === 'MOOD') {
        return (
            <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in fade-in overflow-hidden">
                <div className="p-8 pt-12 relative z-10 flex justify-between items-start w-full max-w-5xl mx-auto">
                     <div>
                        <h2 className="text-4xl font-serif italic text-nature-900 mb-2">Como você se sente?</h2>
                        <p className="text-sm text-nature-400 font-medium font-sans">Apenas seja verdadeiro consigo neste momento.</p>
                     </div>
                     <button onClick={onClose} className="bg-nature-50 p-4 rounded-full active:scale-95 transition-all shadow-sm hover:bg-nature-100 group">
                        <X size={24} className="text-nature-400 group-hover:text-nature-600"/>
                     </button>
                </div>
                
                <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 p-8 max-w-6xl mx-auto w-full overflow-y-auto pb-24 md:pb-8">
                    {/* PHOTO PREVIEW - Elegant & Minimal */}
                    <div className="relative w-full max-w-[320px] aspect-[3/4] bg-nature-900 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden border border-white/10 shrink-0">
                        {data.image ? (
                            <img src={data.image} className="w-full h-full object-cover" alt="Sua Essência" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8 text-center bg-gradient-to-br from-nature-800 to-black">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                    <Sparkles className="text-white/40 animate-pulse" size={32} />
                                </div>
                                <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.3em] leading-relaxed">Sua luz aguarda<br/>ser capturada</p>
                                <button 
                                    onClick={() => setStep('CAPTURE')}
                                    className="px-6 py-2.5 bg-white text-nature-900 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-nature-50 transition-all shadow-xl active:scale-95"
                                >
                                    Ver Câmera
                                </button>
                            </div>
                        )}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/20 to-transparent"></div>
                    </div>

                    {/* MOOD GRID - Clean & High-End */}
                    <div className="flex-1 w-full grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 content-start">
                        {MOODS.map(m => (
                            <button 
                                key={m.id} 
                                onClick={() => handleMoodSelect(m.id)} 
                                className={`group p-6 rounded-[2rem] text-left transition-all hover:shadow-lg active:scale-95 border border-transparent hover:border-white/50 ${m.color} h-full min-h-[120px] flex flex-col justify-between`}
                            >
                                <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform origin-left">{m.icon}</span>
                                <span className="font-black text-[10px] uppercase tracking-[0.2em] opacity-80">{m.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'CAPTURE') {
        return (
            <div className="fixed inset-0 z-[200] bg-nature-900 flex flex-col animate-in fade-in">
                {/* Header controls outside camera area */}
                <div className="h-[10%] flex items-center justify-between px-8 bg-black relative z-50">
                     <div className="w-10"></div>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-400">Presença Viva</p>
                     <button onClick={onClose} className="p-4 rounded-full text-white/60 hover:text-white transition-colors active:scale-90 relative z-50"><X size={24}/></button>
                </div>

                <div className="h-[70%] relative overflow-hidden bg-black flex items-center justify-center">
                    <div className="w-full h-full max-w-md relative">
                        <CameraWidget onCapture={handleCapture} variant="POST" />
                        {/* Premium Crop Guide */}
                        <div className="absolute inset-0 border-[2px] border-white/10 m-8 rounded-[2rem] pointer-events-none"></div>
                    </div>
                </div>

                <div className="h-[20%] bg-black p-8 text-center flex flex-col items-center justify-center">
                     <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] mb-4">Mantenha a alma em foco</p>
                     <h3 className="text-white font-serif italic text-lg leading-tight">Este momento é portal para sua cura.</h3>
                </div>
            </div>
        );
    }

    if (step === 'CAPTURE_REVIEW') {
        return (
            <div className="fixed inset-0 z-[200] bg-nature-950 flex flex-col animate-in fade-in overflow-hidden">
                <div className="h-[12%] flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl relative z-50 border-b border-white/5">
                    <button onClick={() => setStep('CAPTURE')} className="p-4 bg-white/5 rounded-full text-white/70 hover:text-white transition-all active:scale-90 border border-white/10 group">
                        <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Essência Capturada</p>
                        <p className="text-[8px] text-white/30 uppercase mt-1">Prévia da Alma</p>
                    </div>
                    <button onClick={onClose} className="p-4 bg-white/5 rounded-full text-white/70 hover:text-white transition-all active:scale-90 border border-white/10">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 p-6 md:p-12 flex items-center justify-center overflow-hidden bg-black">
                    <div className="relative h-full max-h-[80vh] aspect-[3/4] rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] group">
                        {data.image ? (
                            <img src={data.image} className="w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-105" alt="Prévia do Jardim da Alma" />
                        ) : (
                            <div className="w-full h-full bg-nature-900/50 flex flex-col items-center justify-center text-white/20 gap-4">
                                <Camera size={48} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Imagem não encontrada</span>
                            </div>
                        )}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                </div>

                <div className="p-8 bg-black/60 backdrop-blur-2xl border-t border-white/10 shrink-0">
                    <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setStep('CAPTURE')}
                            className="w-full py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
                        >
                            Refazer
                        </button>
                        <button
                            onClick={() => setStep('MOOD')}
                            className="w-full py-5 bg-white text-nature-950 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.2)]"
                        >
                            Confirmar <ArrowRight size={18} className="text-nature-600" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'INTENTION') {
        return (
             <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col p-8 pt-16 animate-in slide-in-from-right overflow-y-auto">
                 <button onClick={() => setStep('CAPTURE')} className="mb-6 bg-white p-4 rounded-full w-min shadow-sm active:scale-95 transition-all"><ArrowRight className="rotate-180 text-nature-900" size={20}/></button>
                 <button onClick={onClose} className="absolute top-8 right-8 bg-white p-4 rounded-full shadow-sm text-nature-400 z-50 active:scale-90 transition-all"><X size={24}/></button>
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
             <div className="fixed inset-0 z-[200] bg-emerald-50 flex flex-col p-8 pt-16 animate-in slide-in-from-right overflow-y-auto">
                 <button onClick={() => setStep('INTENTION')} className="mb-6 bg-white p-4 rounded-full w-min shadow-sm active:scale-95 transition-all"><ArrowRight className="rotate-180 text-nature-900" size={20}/></button>
                 <button onClick={onClose} className="absolute top-8 right-8 bg-white p-4 rounded-full shadow-sm text-emerald-600 z-50 active:scale-90 transition-all"><X size={24}/></button>
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
            <div className="fixed inset-0 z-[200] bg-nature-900 flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500 overflow-y-auto">
                <button onClick={onClose} className="absolute top-8 right-8 bg-white/10 p-4 rounded-full text-white z-50 active:scale-90 transition-all"><X size={24}/></button>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="w-full max-w-sm relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 text-white/50 text-xs font-bold uppercase tracking-[0.3em] whitespace-nowrap">Sua Essência de Hoje</div>
                    <SoulCard snap={snapStub} className="shadow-2xl skew-y-1 mb-8" />
                    
                    {step === 'CARD' ? (
                        <button onClick={handleCardConfirm} disabled={isSaving} className="w-full py-5 bg-white text-nature-900 rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-nature-50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                             {isSaving ? (
                                 <><div className="w-4 h-4 border-2 border-nature-300 border-t-nature-900 rounded-full animate-spin"></div> Salvando...</>
                             ) : (
                                 <><Sparkles size={18} /> Cristalizar Momento</>
                             )}
                        </button>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-bottom fade-in duration-500">
                             {/* Aspect Ratio Toggle */}
                        <div className="flex gap-2 mb-6">
                            {(['STORY', 'POST'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFormat(f)}
                                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${format === f ? 'bg-nature-900 text-white' : 'bg-nature-50 text-nature-400'}`}
                                >
                                    {f === 'STORY' ? '9:16 Story' : '4:5 Feed'}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 mb-4">
                            <button onClick={shareCard} className="flex-1 py-5 bg-nature-900 text-white rounded-3xl font-bold uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all">Compartilhar</button>
                            <button onClick={downloadCard} className="p-5 bg-nature-50 text-nature-900 rounded-3xl active:scale-95 transition-all"><Download size={20}/></button>
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
            <div className="fixed inset-0 z-[200] bg-emerald-900 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col items-center gap-8 animate-in slide-in-from-bottom duration-1000">
                    <div className="relative">
                        <Droplet size={64} className="text-emerald-300 fill-emerald-300 animate-bounce" />
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-500/50 rounded-full blur-xl"></div>
                    </div>
                    
                    <div className="space-y-2 text-center">
                         <h2 className="text-4xl font-serif italic text-white">Seu jardim recebeu cuidado hoje.</h2>
                         <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-[0.2em]">Sintonização Completa • Salvo na Evolução</p>
                    </div>

                    <div className="flex gap-4 justify-center pt-4">
                         <div className="px-6 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-widest">+15 Vitalidade</div>
                         <div className="px-6 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-widest">+5 Karma</div>
                    </div>

                    <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
                        <button 
                            onClick={() => {
                                if (finalUser) updateUser(finalUser);
                                else updateUser(user);
                                go('EVOLUTION');
                            }}
                            className="w-full px-8 py-4 bg-white/20 backdrop-blur-md text-white rounded-full font-bold uppercase tracking-widest border border-white/20 shadow-xl hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <TrendingUp size={16} /> Ver minha Evolução
                        </button>
                        <button 
                            onClick={() => {
                                if (finalUser) updateUser(finalUser);
                                else updateUser(user);
                                onClose();
                            }}
                            className="w-full px-8 py-4 bg-white text-emerald-900 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            Concluir
                        </button>
                    </div>
                 </div>
            </div>
        );
    }

    return null;
};
