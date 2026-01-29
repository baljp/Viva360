import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Calendar, Share2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PortalView } from '../../../components/Common';
import { User } from '../../../types';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';

export const TimeLapseExperience: React.FC<{ user: User }> = ({ user }) => {
    const { go } = useBuscadorFlow();
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const progressInterval = useRef<any>(null);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [isRecording, setIsRecording] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const snaps = user.snaps || [];
    const activeSnap = snaps[currentIndex];

    useEffect(() => {
        if (!snaps.length || !isPlaying) return;

        const DURATION = 3000; 
        const TICK = 50;
        
        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    if (currentIndex < snaps.length - 1) {
                        setCurrentIndex(c => c + 1);
                        return 0;
                    } else {
                        setIsPlaying(false);
                        return 100;
                    }
                }
                return prev + (100 / (DURATION / TICK));
            });
        }, TICK);

        return () => clearInterval(progressInterval.current);
    }, [currentIndex, isPlaying, snaps.length]);

    // Video Recording Logic
    const startRecording = async () => {
        if (!canvasRef.current) return;
        
        setIsRecording(true);
        setCurrentIndex(0);
        setProgress(0);
        setIsPlaying(true);
        chunksRef.current = [];

        const stream = canvasRef.current.captureStream(30); // 30 FPS
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            // Download or Share
            const a = document.createElement('a');
            a.href = url;
            a.download = `viva360-emotional-journey-${Date.now()}.webm`;
            a.click();
            
            setIsRecording(false);
            alert('✨ Vídeo Emocional gerado com sucesso!');
        };

        mediaRecorderRef.current = recorder;
        recorder.start();

        // Stop recording when cycle ends (handled in effect or timeout)
        // We calculate total duration: 3s per slide * count
        setTimeout(() => {
            recorder.stop();
            setIsPlaying(false);
        }, snaps.length * 3000 + 500);
    };

    // EFFECT: Draw to Canvas when activeSnap changes (for recording)
    // Moved to top level to avoid conditional hook call
    useEffect(() => {
         if(canvasRef.current && activeSnap) {
             const ctx = canvasRef.current.getContext('2d');
             if(ctx) {
                 const img = new Image();
                 img.crossOrigin = "anonymous";
                 img.src = activeSnap.image;
                 img.onload = () => {
                     ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
                     // Draw overlays
                     ctx.fillStyle = 'rgba(0,0,0,0.4)';
                     ctx.fillRect(0, canvasRef.current!.height - 400, canvasRef.current!.width, 400);
                     ctx.fillStyle = 'white';
                     ctx.font = 'italic 60px serif';
                     ctx.fillText(activeSnap.note || '', 50, canvasRef.current!.height - 150);
                 }
             }
         }
    }, [activeSnap]);

    if (!snaps.length) {
        return (
            <PortalView title="Time Lapse" subtitle="CARREGANDO..." onBack={() => go('EVOLUTION')}>
                <div className="flex-1 flex items-center justify-center p-12 text-center text-nature-400 italic">
                    Sua jornada visual ainda não possui memórias registradas.
                </div>
            </PortalView>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6 pt-12 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex gap-1 mb-4">
                    {snaps.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
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
                        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-nature-900 flex items-center justify-center text-xs">
                             {user.plantType === 'lotus' ? '🪷' : '🌳'}
                        </div>
                        <div>
                             <h4 className="font-bold text-sm">Evolução {period === 'daily' ? 'Diária' : period === 'weekly' ? 'Semanal' : 'Mensal'}</h4>
                             <p className="text-[10px] opacity-70">{new Date(activeSnap.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button onClick={() => go('EVOLUTION')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                </div>
            </div>

            {/* Visual Content (Canvas for Recording + Image for Display) */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {/* Image Display */}
                <img 
                    src={activeSnap.image} 
                    className="w-full h-full object-cover opacity-80 transition-opacity duration-1000" 
                    alt="Ritual Snapshot"
                />
                
                {/* Hidden Canvas for Recording */}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" width={1080} height={1920} />

                {/* Visual Overlays based on stats - Simulating Bloom */}
                {currentIndex === snaps.length - 1 && (
                    <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
                )}

                <div className="absolute bottom-0 inset-x-0 p-8 pt-32 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none">
                     <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/60 mb-2">Ciclo de {activeSnap.timeSlot || 'Ritual'}</p>
                     <h2 className="text-3xl font-serif italic mb-6 leading-relaxed">"{activeSnap.note || 'Um momento de paz e conexão.'}"</h2>
                     <div className="flex items-center gap-2">
                         <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">{activeSnap.mood || 'SERENO'}</span>
                     </div>
                </div>
            </div>


            {/* Controls */}
            <div className="p-8 bg-black flex justify-between items-center">
                <button 
                    onClick={() => setIsPlaying(!isPlaying)} 
                    className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                    {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor" className="ml-1"/>}
                </button>
                
                <div className="flex gap-6">
                     <button className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                         <Calendar size={20} />
                         <span className="text-[9px] uppercase font-bold tracking-widest">Period</span>
                     </button>
                     <button 
                        onClick={startRecording}
                        disabled={isRecording}
                        className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
                     >
                         <Share2 size={20} className={isRecording ? 'animate-pulse text-red-500' : ''} />
                         <span className="text-[9px] uppercase font-bold tracking-widest">{isRecording ? 'Gravando...' : 'Gerar Vídeo'}</span>
                     </button>
                </div>
            </div>
        </div>
    );
};
