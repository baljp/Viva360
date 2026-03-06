import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Calendar, Share2, Download, ChevronLeft, ChevronRight, X, Music, Sparkles } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';
import { useAppToast } from '../../src/contexts/AppToastContext';
import { TimeLapseShareModal } from './TimeLapseShareModal';
import { normalizeTimeLapseEntries } from './timeLapseUtils';
import type { GardenSnap, TimeLapseEntry, TimeLapseFlowBridge, TimeLapseModal } from './timeLapseTypes';
import { captureFrontendError, captureFrontendMessage } from '../../lib/frontendLogger';

type TimeLapseProps = { flow: TimeLapseFlowBridge; setView: (v: ViewState) => void };

export const TimeLapseView: React.FC<TimeLapseProps> = ({ flow, setView: _setView }) => {
    const { showToast: setToast } = useAppToast();
    const [entries, setEntries] = useState<TimeLapseEntry[]>([]);
    const [isPlaying, setIsPlaying] = useState(false); // Start paused until loaded
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const [activeModal, setActiveModal] = useState<TimeLapseModal>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [loading, setLoading] = useState(true);
    const [gardenSnaps] = useState<GardenSnap[]>([]);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [volume, setVolume] = useState(0.5);
    const [format, setFormat] = useState<'STORY' | 'POST'>('STORY');
    const totalFrames = entries.length;

    // Load Data — cancelled guard prevents setState on unmounted component
    useEffect(() => {
        let cancelled = false;
        api.metamorphosis.getEvolution()
            .then(data => {
                if (cancelled) return;
                const sorted = normalizeTimeLapseEntries((data || {}) as { entries?: TimeLapseEntry[] });
                setEntries(sorted);
                setLoading(false);
                if (sorted.length > 0) setIsPlaying(true);
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // CANVAS DRAWING (The Engine)
    const drawFrame = (allEntries: TimeLapseEntry[], index: number, progressValue: number) => {
        const canvas = canvasRef.current;
        const entry = allEntries[index];
        if (!canvas || !entry) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 1080;
        const H = format === 'STORY' ? 1920 : 1350;

        // Ensure standard size
        if (canvas.width !== W) canvas.width = W;
        if (canvas.height !== H) canvas.height = H;

        // Clean
        ctx.fillStyle = '#1a1a1a';
        const garden = gardenSnaps.find((s) =>
            new Date(s.date).toDateString() === new Date(entry.timestamp).toDateString()
        );

        const imgCard = new Image();
        imgCard.crossOrigin = "anonymous";
        imgCard.src = entry.photoThumb;

        const imgGarden = new Image();
        if (garden) {
            imgGarden.crossOrigin = "anonymous";
            imgGarden.src = garden.image;
        }

        // Dynamic Zoom Effect based on progress (Ken Burns)
        const zoom = 1 + (progressValue / 200);

        const draw = () => {
            // --- LAYER 0: JARDIM (BACKGROUND STATE) ---
            if (garden && imgGarden.complete) {
                const gScale = Math.max(W / imgGarden.width, H / imgGarden.height) * zoom;
                const gx = (W - imgGarden.width * gScale) / 2;
                const gy = (H - imgGarden.height * gScale) / 2;

                ctx.save();
                ctx.filter = 'blur(20px) saturate(0.5) brightness(0.6)'; // Contemplative / Subtle
                ctx.drawImage(imgGarden, gx, gy, imgGarden.width * gScale, imgGarden.height * gScale);
                ctx.restore();
            } else {
                // Background Fallback
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, W, H);
            }

            // --- LAYER 1: SOUL CARD (FOREGROUND NARRATIVE) ---
            const cardW = format === 'STORY' ? 900 : 1000;
            const cardH = format === 'STORY' ? 1200 : 800;
            const cardX = (W - cardW) / 2;
            const cardY = (H - cardH) / 2 - (format === 'STORY' ? 100 : 50);

            const scale = Math.max(cardW / imgCard.width, cardH / imgCard.height) * (zoom * 0.95);
            const x = cardX + (cardW - imgCard.width * scale) / 2;
            const y = cardY + (cardH - imgCard.height * scale) / 2;

            // --- IG QUALITY PIPELINE (SOUL CARD) ---
            ctx.save();

            // Rounded Clip for Card
            const r = 40;
            ctx.beginPath();
            ctx.moveTo(cardX + r, cardY);
            ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, r);
            ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, r);
            ctx.arcTo(cardX, cardY + cardH, cardX, cardY, r);
            ctx.arcTo(cardX, cardY, cardX + cardW, cardY, r);
            ctx.closePath();
            ctx.clip();

            // Card Image
            ctx.filter = `brightness(1.05) contrast(1.1) saturate(1.1)`;
            ctx.drawImage(imgCard, x, y, imgCard.width * scale, imgCard.height * scale);
            ctx.filter = 'none';

            // Card Overlay
            const grad = ctx.createLinearGradient(0, cardY + cardH * 0.4, 0, cardY + cardH);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(1, 'rgba(0,0,0,0.6)');
            ctx.fillStyle = grad;
            ctx.fillRect(cardX, cardY, cardW, cardH);

            ctx.restore();

            // --- LAYER 2: OVERLAY & TEXT ---

            // Grain/Noise
            const grainCanvas = document.createElement('canvas');
            grainCanvas.width = 128;
            grainCanvas.height = 128;
            const gCtx = grainCanvas.getContext('2d')!;
            const gData = gCtx.createImageData(128, 128);
            for (let i = 0; i < gData.data.length; i += 4) {
                const val = Math.random() * 255;
                gData.data[i] = val;
                gData.data[i + 1] = val;
                gData.data[i + 2] = val;
                gData.data[i + 3] = 15;
            }
            gCtx.putImageData(gData, 0, 0);
            ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat')!;
            ctx.globalAlpha = 0.04;
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1.0;

            // Text Overlay
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';

            // Mood Badge
            ctx.font = 'bold 40px sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;
            ctx.fillText(entry.mood?.toUpperCase() || 'JORNADA', W / 2, H - 500);

            // Quote - Premium Serif
            ctx.font = 'italic 58px "Playfair Display", serif';
            const words = (entry.quote || '').split(' ');
            let line = '';
            let lineY = H - 400;
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                if (ctx.measureText(testLine).width > 900 && n > 0) {
                    ctx.fillText(line, W / 2, lineY);
                    line = words[n] + ' ';
                    lineY += 80;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, W / 2, lineY);
            ctx.shadowBlur = 0;

            // Date
            ctx.font = '30px monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText(new Date(entry.timestamp).toLocaleDateString(), W / 2, H - 150);

            // Brand
            ctx.font = 'bold 30px sans-serif';
            ctx.fillStyle = '#fbbf24';
            ctx.fillText('VIVA360', W / 2, 100);
        };

        imgCard.onload = () => {
            if (!garden || imgGarden.complete) draw();
        };
        if (garden) {
            imgGarden.onload = () => {
                if (imgCard.complete) draw();
            };
        }
        // If no garden image or both are already complete, draw immediately
        if (imgCard.complete && (!garden || imgGarden.complete)) {
            draw();
        }
    };

    const stepFrame = (direction: -1 | 1) => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentIndex((prev) => {
            if (entries.length === 0) return 0;
            return Math.min(entries.length - 1, Math.max(0, prev + direction));
        });
        if (audioRef.current) audioRef.current.pause();
    };

    const scrubToFrame = (index: number) => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentIndex(Math.min(entries.length - 1, Math.max(0, index)));
        if (audioRef.current) audioRef.current.pause();
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                stepFrame(-1);
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                stepFrame(1);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [entries.length]);

    // Animation Loop
    useEffect(() => {
        if (!entries.length || !isPlaying) return;

        const TICK = 30; // ~30fps update

        progressInterval.current = setInterval(() => {
            const slideDuration = Math.max(2000, Math.min(4000, 30000 / entries.length));
            setProgress(prev => {
                const newProgress = prev + (100 / (slideDuration / TICK));
                // Draw triggers on every tick for smooth video
                drawFrame(entries, currentIndex, newProgress);

                if (newProgress >= 100) {
                    if (currentIndex < entries.length - 1) {
                        setCurrentIndex(c => c + 1);
                        return 0;
                    } else {
                        setIsPlaying(false); // End
                        if (isRecording) stopRecording();
                        return 100;
                    }
                }
                return newProgress;
            });
        }, TICK);

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [currentIndex, isPlaying, entries.length, isRecording, gardenSnaps, format]); // Added gardenSnaps to dependencies

    // Initial Draw Force
    useEffect(() => {
        if (entries[currentIndex]) drawFrame(entries, currentIndex, 0);
    }, [currentIndex, entries, gardenSnaps, format]); // Added gardenSnaps to dependencies


    // RECORDER
    const startRecording = () => {
        if (!canvasRef.current) return;

        try {
            setIsRecording(true);
            setCurrentIndex(0);
            setProgress(0);
            setIsPlaying(true);
            chunksRef.current = [];

            const stream = canvasRef.current.captureStream(30);

            // Detect Supported MimeType
            const mimeTypes = [
                'video/mp4;codecs=h264',
                'video/mp4',
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm'
            ];
            const selectedMime = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

            if (!selectedMime) {
                captureFrontendMessage('timelapse.recording.mime_fallback', { view: 'TimeLapseView', op: 'startRecording' });
            }

            const options = selectedMime
                ? { mimeType: selectedMime, videoBitsPerSecond: 10_000_000 }
                : { videoBitsPerSecond: 10_000_000 };

            const recorder = new MediaRecorder(stream, options);

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: selectedMime || 'video/webm' });
                setRecordedBlob(blob);
                setIsRecording(false);
                setActiveModal('share_video');
            };

            recorder.onerror = (e) => {
                captureFrontendError(e, { view: 'TimeLapseView', op: 'mediaRecorder.onerror' });
                setIsRecording(false);
                setToast({ title: "Erro na Gravação", message: "Ocorreu um erro ao gerar o vídeo. Tente novamente.", type: "error" });
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
        } catch (err) {
            captureFrontendError(err, { view: 'TimeLapseView', op: 'startRecording' });
            setIsRecording(false);
            setToast({ title: "Dispositivo Não Suportado", message: "Não foi possível iniciar a gravação neste dispositivo.", type: "error" });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const shareVideo = async (platform: 'whatsapp' | 'instagram' | 'download' | 'generic' = 'generic') => {
        if (!recordedBlob) return;

        const mimeType = recordedBlob.type || 'video/webm';
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const filename = `viva360-story-${Date.now()}.${extension}`;
        const file = new File([recordedBlob], filename, { type: mimeType });
        const downloadVideo = () => {
            const url = URL.createObjectURL(recordedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        };

        try {
            if (platform === 'download') {
                downloadVideo();
                return;
            }

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Minha Jornada Viva360',
                    text: platform === 'instagram'
                        ? 'Minha evolução no Jardim da Alma 🌿 #Viva360'
                        : 'Minha evolução em história no Viva360 🌿',
                    files: [file]
                });
                return;
            }

            if (platform === 'whatsapp') {
                const text = encodeURIComponent('Minha evolução no Jardim da Alma no Viva360 🌿');
                window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
                downloadVideo();
                return;
            } else {
                if (platform === 'instagram') {
                    setToast({
                        title: 'Instagram',
                        message: 'Baixamos o vídeo em alta para você publicar no Reels/Stories.',
                        type: 'info',
                    });
                }
                downloadVideo();
            }
        } catch (e) {
            captureFrontendError(e, { view: 'TimeLapseView', op: 'share' });
            downloadVideo();
        }
    };

    if (loading) return <div className="fixed inset-0 bg-black text-white flex items-center justify-center">Carregando Memórias...</div>;

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-in fade-in duration-500">
            {/* The Stage (Canvas is visible here for "Preview" and hidden capture) */}
            <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="h-full object-contain shadow-2xl"
                    style={{ aspectRatio: '9/16' }}
                />
            </div>

            {/* Header / Progress Overlay */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6 pt-12 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex gap-1 mb-4">
                    {entries.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-white transition-all ease-linear ${idx === currentIndex ? 'duration-[50ms]' : 'duration-0'}`}
                                style={{ width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' }}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center bg-black/40 backdrop-blur-sm p-4 rounded-3xl border border-white/10">
                    <div className="flex flex-col">
                        <h4 className="font-bold text-sm text-white">Minha História</h4>
                        <div className="flex gap-2 mt-2">
                            {(['STORY', 'POST'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFormat(f)}
                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${format === f ? 'bg-white text-black' : 'bg-white/10 text-white/40'}`}
                                >
                                    {f === 'STORY' ? '9:16' : '4:5'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                if (!canvasRef.current) return;
                                const blob = await new Promise<Blob | null>(res => canvasRef.current!.toBlob(res, 'image/png'));
                                if (!blob) return;
                                const file = new File([blob], 'viva360-snap.png', { type: 'image/png' });
                                if (navigator.share) {
                                    await navigator.share({
                                        title: 'Um momento da minha jornada Viva360',
                                        files: [file]
                                    }).catch(() => { });
                                } else {
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'viva360-snap.png';
                                    a.click();
                                }
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-2 px-4 transition-all"
                        >
                            <Share2 size={18} /> <span className="text-[10px] font-bold uppercase tracking-widest">Snap</span>
                        </button>
                        <button onClick={() => flow.go('DASHBOARD')} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="p-8 bg-black flex flex-col gap-6">
                {/* Audio source from env; defaults to empty (silent) if not configured */}
                <audio
                    ref={audioRef}
                    src={import.meta.env.VITE_TIMELAPSE_AUDIO_URL || ''}
                    loop
                    preload="none"
                />

                {isRecording && (
                    <div className="flex items-center justify-center gap-2 text-rose-500 animate-pulse mb-2">
                        <div className="w-2 h-2 bg-rose-600 rounded-full"></div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Sincronizando Áudio & Alma...</span>
                    </div>
                )}

                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Music size={16} className="text-white/40" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Zen Soundtrack • 432Hz</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setVolume(v);
                            if (audioRef.current) audioRef.current.volume = v;
                        }}
                        className="w-24 accent-white"
                    />
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Scrubber Temporal</p>
                            <p className="text-xs text-white/80">
                                Quadro {totalFrames > 0 ? currentIndex + 1 : 0}/{totalFrames} • {entries[currentIndex] ? new Date(entries[currentIndex].timestamp).toLocaleDateString('pt-BR') : 'Sem memória'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => stepFrame(-1)}
                                disabled={totalFrames <= 1}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-40"
                                aria-label="Quadro anterior"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => stepFrame(1)}
                                disabled={totalFrames <= 1}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-40"
                                aria-label="Próximo quadro"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={Math.max(0, totalFrames - 1)}
                        step={1}
                        value={Math.min(currentIndex, Math.max(0, totalFrames - 1))}
                        onChange={(event) => scrubToFrame(Number(event.target.value))}
                        disabled={totalFrames <= 1}
                        className="w-full accent-amber-400"
                        aria-label="Navegar pelos quadros do replay"
                    />
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/30">
                        <span>Início</span>
                        <span>Frame a frame</span>
                        <span>Agora</span>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-4 rounded-[2rem] border border-white/10">
                    <button onClick={() => {
                        setIsPlaying(!isPlaying);
                        if (audioRef.current) {
                            if (isPlaying) audioRef.current.pause();
                            else audioRef.current.play();
                        }
                    }} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                    </button>

                    <button
                        onClick={startRecording}
                        disabled={isRecording}
                        className="flex-1 mx-6 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-2xl shadow-orange-900/40 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        {isRecording ? (
                            <Sparkles size={18} className="animate-spin" />
                        ) : (
                            <Share2 size={18} />
                        )}
                        {isRecording ? 'Processando...' : 'Fazer Vídeo da Jornada'}
                    </button>
                </div>

                {!isRecording && (
                    <p className="text-center text-[9px] text-white/40 uppercase tracking-widest">
                        Gere um vídeo épico para compartilhar sua evolução
                    </p>
                )}
            </div>

            <TimeLapseShareModal
                isOpen={activeModal === 'share_video'}
                onShare={(platform) => { void shareVideo(platform); }}
                onClose={() => setActiveModal(null)}
            />
        </div>
    );
};
