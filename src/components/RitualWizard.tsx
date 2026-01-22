import React, { useState } from 'react';
import { Camera, X, Check, Heart, Smile, Sun, Cloud, CloudRain, Zap, Wind } from 'lucide-react';
import { CameraWidget, MoodTracker } from './Common';
import { MoodType, User } from '../types';

interface RitualWizardProps {
    user: User;
    onClose: () => void;
    onComplete: (data: { image?: string; mood: MoodType; gratitude: string }) => void;
}

export const RitualWizard: React.FC<RitualWizardProps> = ({ user, onClose, onComplete }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [image, setImage] = useState<string | null>(null);
    const [mood, setMood] = useState<MoodType | null>(null);
    const [gratitude, setGratitude] = useState('');

    const handleNext = () => {
        if (step === 1) setStep(2);
        else if (step === 2 && mood) setStep(3);
        else if (step === 3 && gratitude) {
             onComplete({ image: image || undefined, mood: mood!, gratitude });
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-nature-900 flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <div className="relative p-6 flex items-center justify-between text-white/80">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                <div className="flex gap-2">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`w-2 h-2 rounded-full transition-all duration-500 ${step >= s ? 'bg-white scale-110' : 'bg-white/20'}`}></div>
                    ))}
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center max-w-md mx-auto w-full">
                
                {/* STEP 1: CAPTURE */}
                {step === 1 && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-500 w-full">
                        <div>
                            <h2 className="text-3xl font-serif italic text-white">Registre o Momento</h2>
                            <p className="text-nature-400 mt-2 text-sm">Uma foto do seu altar, do céu ou de você.</p>
                        </div>
                        
                        {image ? (
                            <div className="relative aspect-[3/4] w-full rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-2xl">
                                <img src={image} className="w-full h-full object-cover" />
                                <button onClick={() => setImage(null)} className="absolute bottom-4 right-4 p-3 bg-black/50 text-white rounded-full backdrop-blur-md">
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="aspect-[3/4] w-full bg-nature-800 rounded-[2.5rem] border-2 border-dashed border-nature-700 flex flex-col items-center justify-center gap-4 hover:bg-nature-800/80 transition-colors cursor-pointer relative overflow-hidden">
                                <CameraWidget onCapture={setImage} />
                                <div className="absolute pointer-events-none flex flex-col items-center">
                                    <Camera size={48} className="text-nature-600 mb-2" />
                                    <span className="text-nature-500 text-xs uppercase tracking-widest font-bold">Toque para capturar</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: MOOD */}
                {step === 2 && (
                    <div className="space-y-12 animate-in slide-in-from-right duration-500 w-full">
                        <div>
                            <h2 className="text-3xl font-serif italic text-white">Como você está?</h2>
                            <p className="text-nature-400 mt-2 text-sm">Sintonize com sua frequência atual.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {(['SERENO', 'VIBRANTE', 'FOCADO', 'MELANCÓLICO', 'EXAUSTO', 'GRATO'] as MoodType[]).map(m => (
                                <button 
                                    key={m}
                                    onClick={() => setMood(m)}
                                    className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-3 ${mood === m ? 'bg-white text-nature-900 border-white scale-105 shadow-xl' : 'bg-transparent text-nature-400 border-white/10 hover:bg-white/5'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mood === m ? 'bg-nature-100' : 'bg-white/10'}`}>
                                        {m === 'SERENO' && <Wind size={24} />}
                                        {m === 'VIBRANTE' && <Sun size={24} />}
                                        {m === 'FOCADO' && <Zap size={24} />}
                                        {m === 'MELANCÓLICO' && <CloudRain size={24} />}
                                        {m === 'EXAUSTO' && <Cloud size={24} />}
                                        {m === 'GRATO' && <Heart size={24} />}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{m}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: GRATITUDE */}
                {step === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-500 w-full">
                        <div>
                            <h2 className="text-3xl font-serif italic text-white">Gratidão do Dia</h2>
                            <p className="text-nature-400 mt-2 text-sm">Uma palavra ou frase que resume seu agora.</p>
                        </div>

                        <textarea 
                            value={gratitude}
                            onChange={(e) => setGratitude(e.target.value)}
                            placeholder="Hoje, eu agradeço por..."
                            className="w-full h-48 bg-white/10 border border-white/20 rounded-3xl p-6 text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-lg font-serif italic leading-relaxed"
                            autoFocus
                        />
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="p-8 pb-12 w-full max-w-md mx-auto">
                <button 
                    onClick={handleNext}
                    disabled={step === 2 && !mood || step === 3 && !gratitude}
                    className="w-full py-5 bg-white text-nature-900 rounded-[2rem] font-bold uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-nature-50 flex items-center justify-center gap-2"
                >
                    {step === 3 ? (
                        <>Finalizar Ritual <Check size={16} /></>
                    ) : (
                        <>Continuar</>
                    )}
                </button>
                {step > 1 && (
                     <button onClick={() => setStep(prev => (prev - 1) as any)} className="w-full mt-4 py-2 text-nature-500 text-[10px] uppercase tracking-widest font-bold hover:text-white transition-colors">Voltar</button>
                )}
            </div>
        </div>
    );
};
