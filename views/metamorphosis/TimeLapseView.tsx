import React, { useState, useEffect } from 'react';
import { Play, Pause, Calendar, Share2, Download } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';

export const TimeLapseView: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);

    useEffect(() => {
        api.metamorphosis.getEvolution().then(data => {
            setEntries(data.entries);
        });
    }, []);

    useEffect(() => {
        let interval: any;
        if (isPlaying && entries.length > 0) {
            interval = setInterval(() => {
                setCurrentFrame(prev => {
                    if (prev >= entries.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 800); // 0.8s per frame
        }
        return () => clearInterval(interval);
    }, [isPlaying, entries]);

    const activeEntry = entries[currentFrame];

    return (
        <PortalView title="Minha Metamorfose" subtitle="TIME-LAPSE" onBack={() => setView(ViewState.CLIENT_HOME)}>
            <div className="flex flex-col h-[75vh]">
                
                {/* VIEWER */}
                {activeEntry ? (
                    <div className="flex-1 relative bg-black rounded-3xl overflow-hidden shadow-2xl mx-4 mb-6">
                        <img src={activeEntry.photoThumb} className="w-full h-full object-cover opacity-80" />
                        
                        {/* OVERLAY INFO */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">
                                        {new Date(activeEntry.timestamp).toLocaleDateString()}
                                    </p>
                                    <h3 className="text-2xl font-serif italic text-white">{activeEntry.mood}</h3>
                                </div>
                                <div className="text-right">
                                     <p className="text-[10px] text-white/80 max-w-[150px] italic leading-tight">"{activeEntry.quote}"</p>
                                </div>
                            </div>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
                            <div className="h-full bg-white transition-all duration-300" style={{ width: `${((currentFrame + 1) / entries.length) * 100}%` }}></div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-nature-400 italic">Carregando memórias...</div>
                )}

                {/* CONTROLS */}
                <div className="px-6 pb-6">
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-lg border border-nature-100">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-nature-900 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform">
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                        </button>

                        <div className="flex gap-2">
                             <button className="p-3 text-nature-400 hover:text-nature-900 bg-nature-50 rounded-xl transition-colors"><Calendar size={20}/></button>
                             <button className="p-3 text-nature-400 hover:text-nature-900 bg-nature-50 rounded-xl transition-colors"><Download size={20}/></button>
                             <button className="p-3 text-nature-400 hover:text-nature-900 bg-nature-50 rounded-xl transition-colors"><Share2 size={20}/></button>
                        </div>
                    </div>
                    <p className="mt-4 text-center text-xs text-nature-400 font-medium">{currentFrame + 1} de {entries.length} memórias</p>
                </div>

            </div>
        </PortalView>
    );
};
