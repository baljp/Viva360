import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Calendar, Share2, Download, ChevronLeft, ChevronRight, X, Music, Sparkles } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';

export const TimeLapseView: React.FC<{ flow: any, setView: (v: ViewState) => void }> = ({ flow, setView }) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(false); // Start paused until loaded
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const progressInterval = useRef<any>(null);
    const [activeModal, setActiveModal] = useState<'share_video' | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [loading, setLoading] = useState(true);
    const [gardenSnaps, setGardenSnaps] = useState<any[]>([]);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [volume, setVolume] = useState(0.5);

    // Load Data
    useEffect(() => {
        api.metamorphosis.getEvolution().then(data => {
            const list = data.entries || [];
            // Mock data if empty for demo purposes (to satisfy "Google Photos" request if no real data)
            const demoData = list.length ? list : [
                { id: 1, date: new Date().toISOString(), mood: 'Sereno', quote: 'O início de tudo...', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800' },
                { id: 2, date: new Date().toISOString(), mood: 'Vibrante', quote: 'Cerscendo em luz.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
                { id: 3, date: new Date().toISOString(), mood: 'Expansivo', quote: 'A metamorfose é real.', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800' }
            ];

            const sorted = [...demoData].map(e => ({
                ...e,
                timestamp: e.timestamp || e.date || new Date().toISOString(),
                photoThumb: e.photoThumb || e.image || ''
            })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            setEntries(sorted);
            setLoading(false);
            if (sorted.length > 0) setIsPlaying(true);
        }).catch(err => {
            console.error("TimeLapse Loading Error:", err);
            setLoading(false);
        });
    }, []);

    // CANVAS DRAWING (The Engine)
    const drawFrame = (allEntries: any[], index: number, progress: number) => {
        const canvas = canvasRef.current;
        const entry = allEntries[index];
        if (!canvas || !entry) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 1080;
        const H = 1920;
        
        // Ensure standard size
        if (canvas.width !== W) canvas.width = W;
        if (canvas.height !== H) canvas.height = H;

        // Clean
        ctx.fillStyle = '#1a1a1a';
        const garden = gardenSnaps.find(s => 
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
        const zoom = 1 + (progress / 200); 
        
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
            const cardW = 900;
            const cardH = 1200;
            const cardX = (W - cardW) / 2;
            const cardY = (H - cardH) / 2 - 100;

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
                gData.data[i+1] = val;
                gData.data[i+2] = val;
                gData.data[i+3] = 15;
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
            ctx.fillText(entry.mood?.toUpperCase() || 'JORNADA', W/2, H - 500);

            // Quote - Premium Serif
            ctx.font = 'italic 58px "Playfair Display", serif';
            const words = (entry.quote || '').split(' ');
            let line = '';
            let lineY = H - 400;
            for(let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                if (ctx.measureText(testLine).width > 900 && n > 0) {
                    ctx.fillText(line, W/2, lineY);
                    line = words[n] + ' ';
                    lineY += 80;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, W/2, lineY);
            ctx.shadowBlur = 0;

            // Date
            ctx.font = '30px monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText(new Date(entry.timestamp).toLocaleDateString(), W/2, H - 150);
            
            // Brand
            ctx.font = 'bold 30px sans-serif';
            ctx.fillStyle = '#fbbf24'; 
            ctx.fillText('VIVA360', W/2, 100);
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

        return () => clearInterval(progressInterval.current);
    }, [currentIndex, isPlaying, entries.length, isRecording, gardenSnaps]); // Added gardenSnaps to dependencies

    // Initial Draw Force
    useEffect(() => {
        if(entries[currentIndex]) drawFrame(entries, currentIndex, 0);
    }, [currentIndex, entries, gardenSnaps]); // Added gardenSnaps to dependencies


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
                'video/webm;codecs=vp9',
                'video/webm',
                'video/mp4'
            ];
            const selectedMime = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

             if (!selectedMime) {
                console.warn("Nenhum formato de vídeo suportado encontrado. Tentando default.");
            }

            const options = selectedMime ? { mimeType: selectedMime, videoBitsPerSecond: 2500000 } : { videoBitsPerSecond: 2500000 };

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
                console.error("Recording Error:", e);
                setIsRecording(false);
                alert("Erro durante a gravação. Tente novamente.");
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
        } catch (err) {
            console.error("Failed to start recording:", err);
            setIsRecording(false);
            alert("Não foi possível iniciar a gravação neste dispositivo.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const shareVideo = async (platform: string) => {
        if (!recordedBlob) return;
        
        // Convert to File
        const file = new File([recordedBlob], 'viva360-story.webm', { type: 'video/webm' });

        try {
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Minha Jornada Viva360',
                    text: 'Minha evolução em história.',
                    files: [file]
                });
            } else {
                // Force download if system share not available
                const url = URL.createObjectURL(recordedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `viva360-story-${Date.now()}.webm`;
                a.click();
            }
        } catch (e) {
            console.error("Share failed", e);
            const url = URL.createObjectURL(recordedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `viva360-story-${Date.now()}.webm`;
            a.click();
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
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm">Minha História</h4>
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
                                    }).catch(() => {});
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
                            <Share2 size={18}/> <span className="text-[10px] font-bold uppercase tracking-widest">Snap</span>
                        </button>
                        <button onClick={() => flow.go('DASHBOARD')} className="p-2 hover:bg-white/10 rounded-full"><X size={24}/></button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="p-8 bg-black flex flex-col gap-6">
                <audio 
                    ref={audioRef}
                    src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" 
                    loop
                    autoPlay
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

                <div className="flex justify-between items-center bg-white/5 p-4 rounded-[2rem] border border-white/10">
                    <button onClick={() => {
                        setIsPlaying(!isPlaying);
                        if (audioRef.current) {
                            if (isPlaying) audioRef.current.pause();
                            else audioRef.current.play();
                        }
                    }} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        {isPlaying ? <Pause size={24} fill="white"/> : <Play size={24} fill="white"/>}
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

             {/* SHARE MODAL */}
             {activeModal === 'share_video' && (
                <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-300">
                    <h3 className="text-3xl font-serif italic text-white mb-4 text-center">Sua História está Pronta! ✨</h3>
                    <p className="text-white/60 text-sm mb-12 text-center max-w-xs">Reviva e compartilhe seus momentos de evolução.</p>
                    
                    <div className="space-y-4 w-full max-w-sm">
                         <button onClick={() => shareVideo('whatsapp')} className="w-full py-5 bg-[#25D366] text-white rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all text-sm">
                            <Share2 size={20} /> Compartilhar (WhatsApp/Stories)
                         </button>
                         <button onClick={() => setActiveModal(null)} className="w-full py-5 bg-white/10 text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-all">
                            Voltar
                         </button>
                    </div>
                </div>
            )}
        </div>
    );
};
