import React, { useState } from 'react';
import { User, DailyRitualSnap, MoodType } from '../../../types';
import { Camera, ArrowRight, Heart, Sparkles, Droplet, Check, Share2, X, Sun, Download, Instagram } from 'lucide-react';
import { CameraWidget } from '../../../components/Common';
import type { CameraCaptureResult } from '../../../components/Common/CameraWidget';
import { SoulCard } from '../../../src/components/SoulCard';
import { phraseService } from '../../../services/phraseService';
import { gardenService } from '../../../services/gardenService';
import { api } from '../../../services/api';
import { roundTripTelemetry } from '../../../lib/telemetry';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { dataUrlToBlob } from '../../../src/utils/dataUrl';
import { buildLocalImageKey, idbImages } from '../../../src/utils/idbImageStore';
import { useObjectUrl } from '../../../src/hooks/useObjectUrl';
import { DAILY_RITUAL_MOODS, drawDailyRitualShareCardCanvas } from './dailyRitualCanvas';
import { DailyRitualCardShareStep, DailyRitualGratitudeStep, DailyRitualIntentionStep, DailyRitualNurtureStep } from './DailyRitualSteps';

interface DailyRitualWizardProps {
    user: User;
    updateUser: (user: User) => void;
    onClose: () => void;
}

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
    const capturePreviewUrl = useObjectUrl(capture?.fullBlob || null);
    const previewAspectRatio = capture?.width && capture?.height ? `${capture.width} / ${capture.height}` : '9 / 16';

    const handleMoodSelect = (mood: MoodType) => {
        setData({ ...data, mood });
        setStep('INTENTION');
    };

    const handleCapture = (result: CameraCaptureResult) => {
        setCapture(result);
        // Immediate thumb for instant feedback; will be replaced by object URL when ready.
        setData(prev => ({ ...prev, image: result.thumbDataUrl }));
        setStep('CAPTURE_REVIEW');
    };

    React.useEffect(() => {
        if (capturePreviewUrl) {
            setData(prev => ({ ...prev, image: capturePreviewUrl }));
        }
    }, [capturePreviewUrl]);

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
        const rt = roundTripTelemetry.start('ritual', 'save');
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
            roundTripTelemetry.success('ritual', 'save', rt.correlationId, rt.startMs);
        } catch (error: any) {
            roundTripTelemetry.error('ritual', 'save', rt.correlationId, rt.startMs, error?.message || 'unknown');
            console.error("Auto-save snap failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Canvas Logic for Sharing (Moved to top level)
    // const canvasRef = React.useRef<HTMLCanvasElement>(null);

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
        let cancelled = false;
        if ((step === 'CARD' || step === 'SHARE') && data.image && canvasRef.current) {
            drawDailyRitualShareCardCanvas({
                canvas: canvasRef.current,
                imageSrc: data.image,
                format,
                mood: data.mood,
                intention: data.intention,
            }).then((url) => {
                if (!cancelled) setPreviewUrl(url);
            }).catch(() => {
                if (!cancelled) setPreviewUrl(null);
            });
        }
        return () => { cancelled = true; };
    }, [step, data.image, data.mood, data.intention, format, canvasRef]);

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
                    <div
                        className="relative w-full max-w-[320px] bg-nature-900 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden border border-white/10 shrink-0"
                        style={{ aspectRatio: previewAspectRatio }}
                    >
                        {data.image ? (
                            <>
                                <img src={data.image} className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-45" alt="" aria-hidden />
                                <img src={data.image} className="relative w-full h-full object-contain" alt="Sua Essência" />
                            </>
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
                        {DAILY_RITUAL_MOODS.map(m => (
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
                        <CameraWidget onCapture={handleCapture} variant="STORY" />
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
                    <div
                        className="relative h-full max-h-[80vh] rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] group"
                        style={{ aspectRatio: previewAspectRatio }}
                    >
                        {data.image ? (
                            <>
                                <img src={data.image} className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40" alt="" aria-hidden />
                                <img src={data.image} className="relative w-full h-full object-contain transition-transform duration-[10000ms] group-hover:scale-[1.02]" alt="Prévia do Jardim da Alma" />
                            </>
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
        return <DailyRitualIntentionStep data={data} setData={setData} onBack={() => setStep('CAPTURE')} onClose={onClose} onContinue={handleIntentionSubmit} />;
    }

    if (step === 'GRATITUDE') {
        return <DailyRitualGratitudeStep data={data} setData={setData} onBack={() => setStep('INTENTION')} onClose={onClose} onContinue={handleGratitudeSubmit} />;
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
            <DailyRitualCardShareStep
                step={step}
                onClose={onClose}
                canvasRef={canvasRef}
                snapStub={snapStub}
                isSaving={isSaving}
                onConfirm={handleCardConfirm}
                format={format}
                setFormat={setFormat}
                onShare={shareCard}
                onDownload={downloadCard}
                onNurtureStart={handleNurtureStart}
            />
        );
    }

    if (step === 'NURTURE') {
        return (
            <DailyRitualNurtureStep
                finalUser={finalUser}
                updateUser={updateUser}
                user={user}
                onClose={onClose}
                goToEvolution={() => go('EVOLUTION')}
            />
        );
    }

    return null;
};
