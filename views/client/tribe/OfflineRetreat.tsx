import React, { useState, useEffect } from 'react';
import { Moon, Sun, BellOff, ShieldAlert, ChevronLeft, VolumeX, Sparkles } from 'lucide-react';
import { api } from '../../../services/api';
import { clearInAppMute, getInAppMuteUntil, setInAppMuteUntil } from '../../../src/utils/inAppMute';

export const OfflineRetreat: React.FC<{ flow: { go: (s: string) => void; back?: () => void; notify?: (title: string, message: string, type?: string) => void } }> = ({ flow }) => {
    const [isActive, setIsActive] = useState(false);
    const [duration, setDuration] = useState(60); // minutes
    const [timeLeft, setTimeLeft] = useState(duration * 60);

    // Hydrate from persisted mute window so retreat survives navigation/refresh.
    useEffect(() => {
        const until = getInAppMuteUntil();
        if (!until || until <= Date.now()) return;
        const seconds = Math.max(0, Math.floor((until - Date.now()) / 1000));
        setIsActive(true);
        setTimeLeft(seconds);
    }, []);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            clearInAppMute();
            // Award +50 Karma for completing retreat
            api.tribe.syncVibration('self', 50).catch(err => console.error("Failed to award retreat karma", err));
            flow.notify("Retiro Concluído", "Sua energia foi renovada. Bem-vindo de volta!", "success");
        }
        return () => clearInterval(timer);
    }, [isActive, timeLeft, flow]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleToggle = () => {
        if (!isActive) {
            const until = Date.now() + duration * 60 * 1000;
            setIsActive(true);
            setInAppMuteUntil(until);
            setTimeLeft(duration * 60);
        } else {
            setIsActive(false);
            clearInAppMute();
        }
    };

    return (
        <div className={`flex flex-col h-full transition-colors duration-700 ${isActive ? 'bg-nature-950' : 'bg-[#fcfdfc]'}`}>
            <header className={`p-6 flex items-center justify-between border-b transition-colors ${isActive ? 'border-white/10 bg-nature-950' : 'border-nature-100 bg-white'} sticky top-0 z-10`}>
                <button onClick={() => flow.go('TRIBE_DASH')} className={`p-2 rounded-full transition-colors ${isActive ? 'text-white/40 hover:bg-white/5' : 'text-nature-900 hover:bg-nature-50'}`}>
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${isActive ? 'text-white/40' : 'text-nature-400'}`}>Experiência Zen</p>
                    <h2 className={`text-lg font-serif italic leading-none ${isActive ? 'text-white' : 'text-nature-900'}`}>Retiro Offline</h2>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isActive ? 'bg-indigo-500 text-white' : 'bg-nature-900 text-white'}`}>
                    {isActive ? <Moon size={18} /> : <Sun size={18} />}
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
                {!isActive ? (
                    <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-48 h-48 bg-nature-50 rounded-full flex items-center justify-center relative">
                            <div className="absolute inset-0 border-4 border-nature-100 border-dashed rounded-full animate-[spin_20s_linear_infinite]"></div>
                            <BellOff size={64} className="text-nature-300" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-serif italic text-nature-900">Hora de Silenciar</h3>
                            <p className="text-sm text-nature-500 max-w-xs mx-auto leading-relaxed">
                                Desative notificações e mergulhe em si mesmo. Durante o retiro, o Viva360 bloqueará alertas externos.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-6 bg-white p-6 rounded-[3rem] border border-nature-100 shadow-sm">
                            {[15, 30, 60, 120].map(d => (
                                <button 
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    className={`w-12 h-12 rounded-2xl text-[11px] font-black transition-all ${duration === d ? 'bg-nature-900 text-white shadow-lg scale-110' : 'text-nature-400 hover:bg-nature-50'}`}
                                >
                                    {d}'
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={handleToggle}
                            className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                        >
                            Iniciar Imersão
                        </button>
                    </div>
                ) : (
                    <div className="text-center space-y-12 animate-in fade-in zoom-in duration-1000">
                        <div className="relative">
                            <div className="w-64 h-64 border border-white/10 rounded-full flex items-center justify-center">
                                <div className="absolute inset-0 border border-white/5 rounded-full animate-ping"></div>
                                <div className="text-6xl font-serif italic text-white/90">{formatTime(timeLeft)}</div>
                            </div>
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">Espaço Sagrado</div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-center gap-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40"><ShieldAlert size={20} /></div>
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Foco Ativo</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40"><VolumeX size={20} /></div>
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Mudo</span>
                                </div>
                            </div>
                            <p className="text-xs text-indigo-200/50 italic font-serif">"O silêncio é a linguagem de Deus. O resto é apenas tradução ruim."</p>
                        </div>

                        <button 
                            onClick={handleToggle}
                            className="bg-white/5 hover:bg-white/10 text-white/40 px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                            Encerrar Mais Cedo
                        </button>
                    </div>
                )}
            </div>
            
            {!isActive && (
                <div className="p-8">
                    <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm"><Sparkles size={20}/></div>
                        <div>
                            <h4 className="text-xs font-bold text-emerald-900">Bônus de Presença</h4>
                            <p className="text-[9px] text-emerald-700 uppercase tracking-widest font-bold">Ganhe +50 Karma no Fluxo</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
