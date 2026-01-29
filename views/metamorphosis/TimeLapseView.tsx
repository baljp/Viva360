import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Calendar, Share2, Download, ChevronLeft, ChevronRight, X, Music } from 'lucide-react';
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

    // Load Data
    useEffect(() => {
        api.metamorphosis.getEvolution().then(data => {
            const list = data.entries || [];
            // Mock data if empty for demo purposes (to satisfy "Google Photos" request if no real data)
            const demoData = list.length ? list : [
                { id: 1, date: new Date().toISOString(), mood: 'Sereno', quote: 'O início de tudo...', image: 'https://images.unsplash.com/photo-1518173946687-a4c8892415f4?w=800' },
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
    const drawFrame = (entry: any, progress: number) => {
        const canvas = canvasRef.current;
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
        ctx.fillRect(0, 0, W, H);

        const img = new Image();
        img.src = entry.photoThumb;
        // If image not loaded yet, we might skip a frame or use placeholder
        // In a real engine, we'd preload images. For now we assume browser cache helps.
        
        // Dynamic Zoom Effect based on progress (Ken Burns)
        const zoom = 1 + (progress / 200); // 1.0 to 1.5
        
        // Draw Image (Centered & Cover)
        if (img.complete) {
            const scale = Math.max(W / img.width, H / img.height) * zoom;
            const x = (W - img.width * scale) / 2;
            const y = (H - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }

        // Overlay Gradient
        const grad = ctx.createLinearGradient(0, H/2, 0, H);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Text Overlay
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        
        // Mood Badge
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText(entry.mood?.toUpperCase() || 'JORNADA', W/2, H - 500);

        // Quote
        ctx.font = 'italic 60px serif';
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

        // Date
        ctx.font = '30px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(new Date(entry.timestamp).toLocaleDateString(), W/2, H - 150);
        
        // Brand
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = '#fbbf24'; // Amber
        ctx.fillText('VIVA360', W/2, 100);
    };

    // Animation Loop
    useEffect(() => {
        if (!entries.length || !isPlaying) return;

        const SLIDE_DURATION = 3000; // 3s per slide
        const TICK = 30; // ~30fps update
        
        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (100 / (SLIDE_DURATION / TICK));
                // Draw triggers on every tick for smooth video
                drawFrame(entries[currentIndex], newProgress);

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
    }, [currentIndex, isPlaying, entries.length, isRecording]);

    // Initial Draw Force
    useEffect(() => {
        if(entries[currentIndex]) drawFrame(entries[currentIndex], 0);
    }, [currentIndex, entries]);


    // RECORDER
    const startRecording = () => {
        if (!canvasRef.current) return;
        
        setIsRecording(true);
        setCurrentIndex(0);
        setProgress(0);
        setIsPlaying(true);
        chunksRef.current = [];

        const stream = canvasRef.current.captureStream(30); 
        const recorder = new MediaRecorder(stream, { 
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000 // 2.5 Mbps
        });
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            setRecordedBlob(blob);
            setIsRecording(false);
            setActiveModal('share_video'); 
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
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
                    <button onClick={() => flow.go('DASHBOARD')} className="p-2 hover:bg-white/10 rounded-full"><X size={24}/></button>
                </div>
            </div>

            {/* Controls */}
            <div className="p-8 bg-black flex justify-between items-center">
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    {isPlaying ? <Pause size={24} fill="white"/> : <Play size={24} fill="white"/>}
                </button>
                
                <button 
                    onClick={startRecording}
                    disabled={isRecording}
                    className="flex-1 mx-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                    {isRecording ? (
                        <>
                           <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                           Gravando...
                        </>
                    ) : (
                        <>
                           <Share2 size={16} />
                           Gerar Vídeo
                        </>
                    )}
                </button>
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
