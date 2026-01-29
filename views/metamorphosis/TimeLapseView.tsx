import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Calendar, Share2, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';

export const TimeLapseView: React.FC<{ flow: any, setView: (v: ViewState) => void }> = ({ flow, setView }) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const progressInterval = useRef<any>(null);
    const [activeModal, setActiveModal] = useState<'share_video' | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Video Recording Function
    const startRecording = async () => {
        if (!entries.length || !canvasRef.current) return;
        
        setIsRecording(true);
        setCurrentIndex(0);
        setProgress(0);
        setIsPlaying(true);
        chunksRef.current = [];

        // Capture Canvas Stream
        const stream = canvasRef.current.captureStream(30); // 30 FPS
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            setRecordedBlob(blob);
            setIsRecording(false);
            setActiveModal('share_video'); // Open Modal on Finish
        };

        mediaRecorderRef.current = recorder;
        recorder.start();

        // Auto-stop when playback finishes (calculated approx duration)
        // 25 seconds max + buffer
        const checkEnd = setInterval(() => {
            if (currentIndex === entries.length - 1 && progress >= 99) {
                 recorder.stop();
                 setIsPlaying(false);
                 clearInterval(checkEnd);
            }
        }, 100);
    };

    const handleShareAction = () => {
        if(recordedBlob) {
            setActiveModal('share_video');
        } else {
            // Trigger image share if no video
            shareMemory();
        }
    };

    const shareVideo = async (platform: string) => {
        if (!recordedBlob) return;
        
        try {
            const file = new File([recordedBlob], 'viva360-journey.webm', { type: 'video/webm' });
            
            if (navigator.share) {
                await navigator.share({
                    title: 'Minha Jornada Viva360',
                    text: 'Confira minha evolução cristalizada no Viva360.',
                    files: [file]
                });
            } else {
                 // Fallback Download
                const url = URL.createObjectURL(recordedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `viva360-journey-${Date.now()}.webm`;
                a.click();
            }
        } catch (e) {
            console.error("Share Failed", e);
            alert("Compartilhamento não suportado neste navegador. Vídeo baixado.");
            // Force download if share fails
            const url = URL.createObjectURL(recordedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `viva360-journey-${Date.now()}.webm`;
            a.click();
        }
    };

    // Load Data
    useEffect(() => {
        api.metamorphosis.getEvolution().then(data => {
            const list = data.entries || [];
            // Standardize and Sort
            const sorted = [...list].map(e => ({
                ...e,
                timestamp: e.timestamp || e.date || new Date().toISOString(),
                photoThumb: e.photoThumb || e.image || ''
            })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            setEntries(sorted);
        }).catch(err => console.error("TimeLapse Loading Error:", err));
    }, []);

    // STORYTELLING ENGINE
    const getStorytellingText = (index: number, total: number, mood: string) => {
        const progress = index / total;
        if (index === 0) return "O início do despertar...";
        if (index === total - 1) return "A metamorfose continua.";
        
        const narratives: Record<string, string[]> = {
            'Sereno': ['Encontrando o centro.', 'Paz na jornada.', 'Equilíbrio interior.'],
            'Vibrante': ['A energia flui.', 'Criação em expansão.', 'A luz que brilha.'],
            'Melancólico': ['Ocupando o silêncio.', 'Acolhendo as sombras.', 'Profundidade da alma.'],
            'Expansivo': ['Rompendo fronteiras.', 'Semeando intenções.', 'Crescimento sem limites.']
        };
        
        const options = narratives[mood] || narratives['Sereno'];
        return options[index % options.length];
    };

    // Story Logic (Optimized for 25s total)
    useEffect(() => {
        if (!entries.length || !isPlaying) return;

        const TOTAL_STORY_DURATION = 25000; // 25s for Instagram/WhatsApp
        // Calculate duration per slide to fit total goal
        const SLIDE_DURATION = Math.max(500, TOTAL_STORY_DURATION / entries.length); 
        const TICK = 50;
        
        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    if (currentIndex < entries.length - 1) {
                        setCurrentIndex(c => c + 1);
                        return 0;
                    } else {
                        setIsPlaying(false);
                        return 100;
                    }
                }
                return prev + (100 / (SLIDE_DURATION / TICK));
            });
        }, TICK);

        return () => clearInterval(progressInterval.current);
    }, [currentIndex, isPlaying, entries.length]);

    const handleNext = () => {
        if (currentIndex < entries.length - 1) {
            setCurrentIndex(c => c + 1);
            setProgress(0);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(c => c - 1);
            setProgress(0);
        }
    };

    const activeEntry = entries[currentIndex];

    // Share Memory Logic
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const shareMemory = async () => {
        if (!activeEntry || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw Frame on Canvas for Sharing
        const W = 1080;
        const H = 1920;
        canvas.width = W;
        canvas.height = H;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = activeEntry.photoThumb;

        img.onload = async () => {
            // Background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, W, H);

            // Image Cover
            const scale = Math.max(W / img.width, H / img.height);
            const x = (W - img.width * scale) / 2;
            const y = (H - img.height * scale) / 2;
            ctx.globalAlpha = 0.8;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            ctx.globalAlpha = 1.0;

            // Overlay Text
            ctx.fillStyle = '#fff';
            ctx.font = 'italic 500 50px "Times New Roman", serif';
            ctx.textAlign = 'center';
            const words = activeEntry.quote.split(' ');
            let line = '';
            let lineY = H - 400;
            
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

            // Narrative Overlay (Storytelling)
            const narrative = getStorytellingText(currentIndex, entries.length, activeEntry.mood);
            ctx.fillStyle = '#fbbf24'; // Amber-400
            ctx.font = 'bold 30px sans-serif';
            ctx.fillText(narrative.toUpperCase(), W/2, lineY - 120);

            // Watermark
            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillText(`VIVA360 • ${new Date(activeEntry.timestamp).toLocaleDateString()}`, W/2, H - 100);

            // Export and Share
            try {
                const dataUrl = canvas.toDataURL('image/png');
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], 'viva360-memory.png', { type: 'image/png' });

                if (navigator.share) {
                    await navigator.share({
                        title: 'Minha Jornada Viva360',
                        text: `✨ Minha memória cristalizada no Jardim da Alma: "${activeEntry.quote}" #Viva360 #Evolução`,
                        files: [file]
                    });
                } else {
                    // Fallback download
                    const link = document.createElement('a');
                    link.download = `memory-${Date.now()}.png`;
                    link.href = dataUrl;
                    link.click();
                }
            } catch (e) {
                console.error("Share failed", e);
            }
        };
        // Trigger load if cached, otherwise handle in onload
        if (img.complete) img.onload(new Event('load') as any);
    };

    if (entries.length === 0) {
        return (
             <PortalView title="Minha Metamorfose" subtitle="CARREGANDO..." onBack={() => flow.go('DASHBOARD')}>
                 <div className="flex-1 flex items-center justify-center h-[60vh] text-nature-400 italic">Carregando memórias da alma...</div>
             </PortalView>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-in fade-in duration-500">
            <canvas ref={canvasRef} className="hidden" />
            {/* Header / Progress Bars */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-12 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex gap-1 mb-3">
                    {entries.map((entry, idx) => (
                        <div key={entry.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div 
                                className={`h-full bg-white transition-all ease-linear ${idx === currentIndex ? 'duration-[50ms]' : 'duration-0'}`}
                                style={{ 
                                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                                }} 
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                             {/* Avatar Placeholder */}
                             <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-xs font-bold">EU</div>
                        </div>
                        <div>
                             <h4 className="font-bold text-sm">Minha Jornada</h4>
                             <p className="text-[10px] opacity-70">{new Date(activeEntry.timestamp).toLocaleDateString()} • {activeEntry.mood}</p>
                        </div>
                    </div>
                    <button onClick={() => flow.go('DASHBOARD')}><X size={24}/></button>
                </div>
            </div>

            {/* Main Content (Tap Areas) */}
            <div className="flex-1 relative flex items-center justify-center bg-gray-900">
                {/* Image */}
                <img src={activeEntry.photoThumb} className="w-full h-full object-cover opacity-90" />
                
                {/* Tap Zones */}
                <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev}></div>
                <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext}></div>
                
                {/* Hold to Pause (Overlay) */}
                <div 
                    className="absolute inset-0 z-0" 
                    onTouchStart={() => setIsPlaying(false)} 
                    onTouchEnd={() => setIsPlaying(true)}
                    onMouseDown={() => setIsPlaying(false)}
                    onMouseUp={() => setIsPlaying(true)}
                ></div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-8 pt-32 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none">
                     <p className="text-amber-200 text-[10px] font-bold uppercase tracking-[0.4em] mb-3 animate-pulse">
                         {getStorytellingText(currentIndex, entries.length, activeEntry.mood)}
                     </p>
                     <h2 className="text-3xl font-serif italic mb-4 leading-relaxed">"{activeEntry.quote}"</h2>
                     <div className="flex items-center gap-2 mb-8">
                         <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">{activeEntry.mood}</span>
                     </div>
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-6 bg-black flex justify-between items-center">
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
                </button>
                
                <div className="flex gap-4">
                     <button className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                         <Calendar size={20} />
                         <span className="text-[9px] uppercase font-bold">Data</span>
                     </button>
                     
                     <button onClick={startRecording} disabled={isRecording} className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity disabled:opacity-50">
                          {isRecording ? <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : <Download size={20} />}
                          <span className="text-[9px] uppercase font-bold text-red-500">{isRecording ? 'Gravando...' : 'Salvar Vídeo'}</span>
                     </button>

                     <button onClick={handleShareAction} className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                         <Share2 size={20} />
                         <span className="text-[9px] uppercase font-bold">Share</span>
                     </button>
                </div>
            </div>

            {/* SHARE MODAL */}
            {activeModal === 'share_video' && (
                <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
                    <h3 className="text-2xl font-serif italic text-white mb-2">Sua História Cristalizada</h3>
                    <p className="text-white/60 text-xs mb-8 text-center max-w-xs">Compartilhe sua evolução com sua tribo ou no mundo.</p>
                    
                    <div className="space-y-4 w-full max-w-xs">
                         <button onClick={() => shareVideo('whatsapp')} className="w-full py-4 bg-[#25D366] text-white rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                            <Share2 size={20} /> WhatsApp
                         </button>
                         <button onClick={() => shareVideo('instagram')} className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                            <Share2 size={20} /> Stories
                         </button>
                         <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold uppercase tracking-widest">
                            Voltar
                         </button>
                    </div>
                </div>
            )}
        </div>
    );
};
