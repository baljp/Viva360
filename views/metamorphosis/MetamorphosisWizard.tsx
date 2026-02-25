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
import { useObjectUrl } from '../../src/hooks/useObjectUrl';
import { drawMetamorphosisCardCanvas } from './metamorphosisCardCanvas';
import { ELEMENT_ICONS, METAMORPHOSIS_MOODS } from './metamorphosisConfig';
import { MetamorphosisProcessingStep, MetamorphosisShareControls, MetamorphosisSuccessStep } from './MetamorphosisWizardSteps';
import type { SoulCard } from '../../src/data/mockSoulCards';
import { captureFrontendError } from '../../lib/frontendLogger';

type FlowLike = {
    go: (next: string) => void;
    back: () => void;
};

type MetamorphosisResult = {
    id: number | string;
    mood: string;
    photoThumb?: string | null;
    photoHash?: string | null;
    quote?: string;
    timestamp: string;
};

export const MetamorphosisWizard: React.FC<{ flow: FlowLike, setView: (v: ViewState) => void, onClose?: () => void, user?: User, updateUser?: (u: User) => void }> = ({ flow, setView, onClose, user, updateUser }) => {
    const [step, setStep] = useState(1);
    const [mood, setMood] = useState('');
    const [photo, setPhoto] = useState<CameraCaptureResult | null>(null);
    const [photoHash, setPhotoHash] = useState<string | null>(null);
    const [result, setResult] = useState<MetamorphosisResult | null>(null);
    const [format, setFormat] = useState<'STORY' | 'POST'>('STORY');
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardPhrase, setCardPhrase] = useState('');
    const [isDrawing, setIsDrawing] = useState(false); // Lock share until ready
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [drewCard, setDrewCard] = useState<SoulCard | null>(null);
    const [showSoulReveal, setShowSoulReveal] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ritualDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const soulCardUserId = String(user?.id || 'user_current').trim() || 'user_current';
    const { performDraw } = useSoulCards(soulCardUserId);
    const photoPreviewUrl = useObjectUrl(photo?.fullBlob || null);

    useEffect(() => {
        if (!photoPreviewUrl) return;
        // Keep result photo thumb synced to the locally captured high-quality blob URL.
        setResult((prev) => (prev ? { ...prev, photoThumb: photoPreviewUrl } : prev));
    }, [photoPreviewUrl]);

    useEffect(() => {
        return () => {
            if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
            if (ritualDelayRef.current) clearTimeout(ritualDelayRef.current);
        };
    }, []);

    // FLOW-08: Cancel ritual — clean up all side effects and return to DASHBOARD
    const cancelRitual = () => {
        if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
        if (ritualDelayRef.current) clearTimeout(ritualDelayRef.current);
        setIsProcessing(false);
        setShowSoulReveal(false);
        flow.go('DASHBOARD');
    };

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
            photoThumb: capture.thumbDataUrl,
            photoHash: hash,
            quote: cardPhrase,
            timestamp: new Date().toISOString()
        };

        if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = setTimeout(() => {
            setResult((prev) => prev || fallbackEntry);
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
                const entryRecord = (entry && typeof entry === 'object') ? (entry as Record<string, unknown>) : {};
                const newSnapResult = {
                    id: String(entryRecord.id || Date.now()),
                    mood: String(entryRecord.mood || mood),
                    photoThumb: capture.thumbDataUrl,
                    photoHash: hash,
                    quote: typeof entryRecord.quote === 'string' ? entryRecord.quote : cardPhrase,
                    timestamp: String(entryRecord.timestamp || new Date().toISOString()),
                };
                setResult(newSnapResult);
                // ✅ BUG FIX: atualizar user.snaps localmente para EvolutionView.recentSnaps
                if (user && updateUser) {
                    const snapEntry = {
                        id: newSnapResult.id,
                        date: newSnapResult.timestamp,
                        image: capture.thumbDataUrl,
                        mood: newSnapResult.mood,
                        note: newSnapResult.quote || '',
                    };
                    updateUser({ ...user, snaps: [snapEntry, ...(user.snaps || [])] });
                }
                setIsProcessing(false);
                setShowSoulReveal(true);
                // setStep(4) will be triggered after reveal closes
            }, 2500); 
        } catch (e) {
            captureFrontendError(e, { view: 'MetamorphosisWizard', op: 'processMetamorphosis' });
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
        setResult((prev) => prev || {
            id: Date.now(),
            mood,
            photoThumb: photo.thumbDataUrl,
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
            captureFrontendError(error, { view: 'MetamorphosisWizard', op: 'shareCard' });
            downloadCard();
        }
    };

    // Premium Canvas Drawing: 1080x1920 (Story Format) or 1080x1080 (Post)
    // User requested "Card Format" - let's stick to a rich Portrait Card (Story/Status friendly 9:16 approx)
    useEffect(() => {
        let cancelled = false;
        if (step === 4 && result && canvasRef.current) {
            setIsDrawing(true);
            const resolvedQuote = String(result?.quote || cardPhrase || phraseService.getPhrase(String(result?.mood || mood || 'Calmo'), 'CARD')).trim();
            const resolvedTimestamp = result?.timestamp || new Date().toISOString();
            drawMetamorphosisCardCanvas({
                canvas: canvasRef.current,
                format,
                photoThumb: result?.photoThumb,
                mood: String(result?.mood || mood || 'Calmo'),
                quote: resolvedQuote,
                timestamp: resolvedTimestamp,
            }).then((url) => {
                if (!cancelled) setPreviewUrl(url ?? (result?.photoThumb || null));
            }).catch((drawError) => {
                captureFrontendError(drawError, { view: 'MetamorphosisWizard', op: 'drawCardCanvas' });
                if (!cancelled) setPreviewUrl(result?.photoThumb || null);
            }).finally(() => {
                if (!cancelled) setIsDrawing(false);
            });
        }
        return () => { cancelled = true; };
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
            onClose={onClose || cancelRitual}
            heroImage={step === 1 ? "https://images.unsplash.com/photo-1518609878319-a16322081109?q=80&w=800" : undefined}
        >
            {showSoulReveal && drewCard && photo && (
                <SoulCardReveal 
                    card={drewCard} 
                    userPhoto={photoPreviewUrl || photo.thumbDataUrl} 
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
                            {METAMORPHOSIS_MOODS.map(m => {
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
                        <div className="px-4 pb-6">
                            <button onClick={cancelRitual} className="w-full py-3 text-nature-400 text-[10px] font-bold uppercase tracking-widest hover:text-rose-500 transition-colors">
                                <X size={14} className="inline mr-2 -mt-0.5" />Cancelar Ritual
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: PREMIUM CAMERA */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-right duration-500 bg-black">
                        <div className="h-[10%] flex items-center justify-between w-full px-8 pt-4">
                             <button onClick={() => setStep(1)} className="p-3 rounded-full text-white/60 hover:text-white transition-colors"><ArrowRight className="rotate-180" size={20}/></button>
                             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Metamorfose</p>
                             <button onClick={cancelRitual} className="p-3 rounded-full text-white/60 hover:text-rose-400 transition-colors" title="Cancelar Ritual"><X size={20}/></button>
                        </div>
                        
                        <div className="h-[70%] w-full relative overflow-hidden bg-black flex items-center justify-center">
                            <div className="w-full h-full max-w-md relative">
                                <CameraWidget onCapture={handleCapture} variant="STORY" />
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
                    <MetamorphosisProcessingStep styling={styling} onContinueNow={continueWithoutWaiting} onCancel={cancelRitual} />
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

                        <MetamorphosisShareControls
                            format={format}
                            setFormat={setFormat}
                            isDrawing={isDrawing}
                            onShare={shareCard}
                            onDownload={downloadCard}
                            onComplete={() => setStep(5)}
                            onCancel={cancelRitual}
                        />
                    </div>
                )}

                {/* STEP 5: RITUAL SUCCESS */}
                {step === 5 && (
                    <MetamorphosisSuccessStep onOpenGrimoire={() => flow.go('EVO_GRIMOIRE')} onBackToCore={() => flow.go('DASHBOARD')} />
                )}

            </div>
            
            {/* Animations moved to src/index.css for security */}
        </PortalView>
    );
};
