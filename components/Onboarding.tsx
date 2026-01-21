
import React, { useState, useEffect } from 'react';
import { X, Sparkles, MapPin, Camera, Users, ArrowRight } from 'lucide-react';

export const OnboardingTutorial: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('viva360_onboarding_seen');
        if (!hasSeenOnboarding) {
            setIsVisible(true);
        }
    }, []);

    const closeOnboarding = () => {
        localStorage.setItem('viva360_onboarding_seen', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const steps = [
        {
            title: "Cure suas dores",
            desc: "Use o Mapa do Corpo para encontrar terapias específicas para onde você sente tensão hoje.",
            icon: <MapPin className="text-primary-600" size={32} />,
            color: "bg-primary-50"
        },
        {
            title: "Registre sua jornada",
            desc: "Capture fotos diárias e veja sua 'Metamorfose' visual através da nossa Análise de Padrões.",
            icon: <Camera className="text-amber-600" size={32} />,
            color: "bg-amber-50"
        },
        {
            title: "Cultive conexões",
            desc: "Sincronize sua vibração com amigos e familiares na sua Constelação pessoal.",
            icon: <Users className="text-indigo-600" size={32} />,
            color: "bg-indigo-50"
        }
    ];

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-nature-900/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-200/30 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-nature-900 flex items-center justify-center text-white">
                                <Sparkles size={16} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-nature-500">Boas-vindas</span>
                        </div>
                        <button onClick={closeOnboarding} className="p-2 hover:bg-nature-100 rounded-full transition-colors">
                            <X size={20} className="text-nature-400" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div className="flex gap-4 items-start animate-in slide-in-from-right">
                            <div className={`p-4 rounded-2xl shrink-0 ${steps[step].color}`}>
                                {steps[step].icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-serif text-nature-900 mb-2">{steps[step].title}</h3>
                                <p className="text-sm text-nature-600 leading-relaxed">{steps[step].desc}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <div className="flex gap-1.5">
                                {steps.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-nature-900' : 'w-1.5 bg-nature-200'}`} />
                                ))}
                            </div>
                            
                            {step < steps.length - 1 ? (
                                <button 
                                    onClick={() => setStep(step + 1)}
                                    className="bg-nature-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            ) : (
                                <button 
                                    onClick={closeOnboarding}
                                    className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:bg-primary-700 transition-colors"
                                >
                                    Começar Jornada
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
