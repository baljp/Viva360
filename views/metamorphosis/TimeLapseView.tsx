import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Calendar, Share2, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';

export const TimeLapseView: React.FC<{ flow: any, setView: (v: ViewState) => void }> = ({ flow, setView }) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const progressInterval = useRef<any>(null);
    const [progress, setProgress] = useState(0); // 0 to 100 for current slide

    // Load Data
    useEffect(() => {
        api.metamorphosis.getEvolution().then(data => {
            setEntries(data.entries);
        });
    }, []);

    // Story Logic
    useEffect(() => {
        if (!entries.length || !isPlaying) return;

        const DURATION = 3000; // 3s per slide
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
                return prev + (100 / (DURATION / TICK));
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
    const shareMemory = async () => {
        if (!activeEntry) return;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Minha Jornada Viva360',
                    text: `Minha memória de ${new Date(activeEntry.timestamp).toLocaleDateString()}: "${activeEntry.quote}"`,
                    url: window.location.href // Simplified
                });
            } else {
                alert('Compartilhamento disponível em dispositivos móveis.');
            }
        } catch (e) {
            console.error(e);
        }
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
                     <button onClick={shareMemory} className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                         <Share2 size={20} />
                         <span className="text-[9px] uppercase font-bold">Share</span>
                     </button>
                </div>
            </div>
        </div>
    );
};
