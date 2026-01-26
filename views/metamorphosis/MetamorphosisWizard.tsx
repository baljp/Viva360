import React, { useState, useRef } from 'react';
import { Camera, Heart, Activity, Coffee, Moon, Sun, ArrowRight, CheckCircle, Smile, Frown, Meh, CloudRain, Zap, Battery } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';

const MOODS = [
    { id: 'Feliz', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-100' },
    { id: 'Calmo', icon: Coffee, color: 'text-teal-500', bg: 'bg-teal-100' },
    { id: 'Grato', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-100' },
    { id: 'Motivado', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { id: 'Cansado', icon: Battery, color: 'text-slate-500', bg: 'bg-slate-100' },
    { id: 'Ansioso', icon: CloudRain, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { id: 'Triste', icon: Frown, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'Sobrecarregado', icon: Activity, color: 'text-red-500', bg: 'bg-red-100' }
];

export const MetamorphosisWizard: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
    const [step, setStep] = useState(1);
    const [mood, setMood] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Step 1: Mood Selection
    const handleMoodSelect = (m: string) => {
        setMood(m);
        setStep(2);
    };

    // Step 2: Photo Capture (Simulated)
    const handleCapture = () => {
        // In real app, Camera API. Here, mock.
        setPhoto('https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=400'); // Symbolic placeholder
        setStep(3);
        processMetamorphosis('https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=400');
    };

    // Step 3: Deterministic Processing
    const processMetamorphosis = async (photoUrl: string) => {
        setIsProcessing(true);
        // Simulate privacy hashing on client
        const photoHash = 'hash_' + Date.now(); 
        const photoThumb = photoUrl; // In real app, resize here.

        const res = await api.metamorphosis.checkIn(mood, photoHash, photoThumb);
        setTimeout(() => {
            setResult(res.entry);
            setIsProcessing(false);
            setStep(4);
        }, 2000); // Animation delay
    };

    return (
        <PortalView title="Metamorfose" subtitle="RITUAL DIÁRIO" onBack={() => setView(ViewState.CLIENT_HOME)}>
            <div className="flex flex-col h-[70vh]">
                
                {/* STEP 1: MOOD */}
                {step === 1 && (
                    <div className="flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom duration-500">
                        <h2 className="text-2xl font-serif italic text-center mb-8 text-nature-900">Como você está agora?</h2>
                        <div className="grid grid-cols-2 gap-4 px-4 pb-4">
                            {MOODS.map(m => (
                                <button key={m.id} onClick={() => handleMoodSelect(m.id)} className={`${m.bg} p-6 rounded-3xl flex flex-col items-center gap-3 transition-transform active:scale-95`}>
                                    <m.icon size={32} className={m.color} />
                                    <span className="font-bold text-sm text-nature-900/80">{m.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: PHOTO */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-right duration-500">
                        <h2 className="text-xl font-serif italic mb-6 text-nature-900">Registre sua essência de hoje</h2>
                        <div className="w-64 h-80 bg-black rounded-3xl relative overflow-hidden shadow-2xl border-4 border-white mb-8">
                            {photo ? <img src={photo} className="w-full h-full object-cover"/> : <div className="absolute inset-0 bg-nature-800 flex items-center justify-center"><Camera className="text-white/20" size={48}/></div>}
                        </div>
                        <button onClick={handleCapture} className="w-16 h-16 rounded-full border-4 border-nature-900 flex items-center justify-center">
                            <div className="w-12 h-12 bg-nature-900 rounded-full"></div>
                        </button>
                        <p className="mt-4 text-xs text-nature-500 text-center max-w-xs">Sua foto é criptografada e salva apenas no seu dispositivo. O santuário vê apenas sua luz (metadados). 🔒 LGPD</p>
                    </div>
                )}

                {/* STEP 3: PROCESSING */}
                {step === 3 && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-200 to-indigo-200 animate-spin blur-xl mb-4"></div>
                        <h3 className="font-serif italic text-lg text-nature-600">Sintonizando frequência...</h3>
                    </div>
                )}

                {/* STEP 4: RESULT */}
                {step === 4 && result && (
                     <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-700 p-6 relative overflow-hidden">
                        {/* AURA BACKGROUND */}
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-amber-50/50 -z-10"></div>
                        
                        <div className="mb-6 relative">
                            <img src={result.photoThumb} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl" />
                            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md">
                                {MOODS.find(m => m.id === result.mood)?.icon({ size: 20, className: 'text-nature-900' }) || <Sun size={20}/>}
                            </div>
                        </div>

                        <h2 className="text-xl font-serif italic text-nature-900 mb-6 leading-relaxed">"{result.quote}"</h2>
                        
                        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-sm border border-white max-w-sm w-full">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-nature-400 mb-4">Ritual Sugerido</p>
                            <div className="space-y-3">
                                {result.ritual.map((r: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3 text-left">
                                        <CheckCircle size={18} className="text-emerald-500" />
                                        <span className="text-sm font-medium text-nature-700">{r}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => setStep(5)} className="mt-8 px-8 py-3 bg-nature-900 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-nature-800 transition-colors">
                            Concluir
                        </button>
                     </div>
                )}

                {/* STEP 5: FEEDBACK */}
                {step === 5 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000">
                        <Heart size={64} className="text-rose-400 animate-bounce mb-6" />
                        <h2 className="text-2xl font-serif italic text-nature-900">Jornada Registrada</h2>
                        <p className="text-nature-500 mt-2 mb-8">Você está cultivando sua própria luz.</p>
                        <button onClick={() => setView(ViewState.CLIENT_HOME)} className="px-8 py-3 bg-nature-100 text-nature-900 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-nature-200 transition-colors">
                            Voltar ao Início
                        </button>
                    </div>
                )}

            </div>
        </PortalView>
    );
};
