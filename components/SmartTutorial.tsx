import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, MapPin, Camera, Compass, Sparkles, Zap } from 'lucide-react';
import { User } from '../types';

interface TutorialStep {
    targetId?: string; // ID of the element to highlight. If null, centers.
    title: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
}

const tutorialSteps: TutorialStep[] = [
    {
        title: "Guia de Luz",
        desc: "Bem-vindo ao Viva360. Este sistema foi desenhado para acolher sua jornada. Vamos sintonizar sua frequência?",
        icon: <Sparkles className="text-amber-400" size={32} />,
        color: "bg-amber-900 text-white"
    },
    {
        targetId: "body-map-card", // Example ID, need to ensure these exist in the app
        title: "Cure suas Dores",
        desc: "Use o Mapa do Corpo para encontrar terapias específicas. Se algo dói, o remédio está a um toque.",
        icon: <MapPin className="text-rose-500" size={28} />,
        color: "bg-rose-50 text-nature-900"
    },
    {
        targetId: "metamorphosis-card",
        title: "Registre sua Jornada",
        desc: "Capture fotos diárias. Nosso análise de padrões revela sua 'Metamorfose' visual ao longo do tempo.",
        icon: <Camera className="text-indigo-500" size={28} />,
        color: "bg-indigo-50 text-nature-900"
    },
    {
        targetId: "karma-summary", // Added ID for karma
        title: "Milhas Aéreas da Alma",
        desc: "Seu Karma não é apenas um número. São pontos de luz que você acumula e troca por benefícios reais.",
        icon: <Zap className="text-amber-500" size={28} />,
        color: "bg-amber-50 text-nature-900"
    },
    {
        title: "Bússola Sempre Ativa",
        desc: "A qualquer momento, toque neste ícone para relembrar o caminho ou tirar dúvidas no Glossário.",
        icon: <Compass className="text-primary-600" size={28} />,
        color: "bg-primary-50 text-nature-900"
    }
];

export const SmartTutorial: React.FC<{ user: User | null }> = ({ user }) => {
    const [isActive, setIsActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [position, setPosition] = useState<{ top?: number, left?: number, bottom?: number, right?: number, width?: number, isCentered?: boolean }>({ isCentered: true });
    
    // Check local storage on mount
    useEffect(() => {
        const seen = localStorage.getItem('viva360_smart_tutorial_seen');
        if (!seen) {
             // Only auto-start if user is logged in, optionally
            if (user) setIsActive(true);
        }
    }, [user]);

    const step = tutorialSteps[stepIndex];
    const cardRef = useRef<HTMLDivElement>(null);

    // Smart Positioning Logic
    useEffect(() => {
        if (!isActive) return;

        const calculatePosition = () => {
            if (!step.targetId) {
                setPosition({ isCentered: true });
                return;
            }

            const target = document.getElementById(step.targetId);
            if (!target) {
                // Return to center if target not found (fallback)
                setPosition({ isCentered: true });
                return;
            }

            const rect = target.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const cardHeight = cardRef.current?.offsetHeight || 200; // Estimate if not rendered
            const margin = 20;

            // Logic: Flip
            // If space below is tight (element is low), place above.
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;

            const newPos: any = { left: rect.left, width: rect.width, isCentered: false };

            // Centralized Mode for huge elements
            if (rect.height > viewportHeight * 0.6) {
                 setPosition({ isCentered: true });
                 return;
            }

            if (spaceBelow < cardHeight + margin && spaceAbove > cardHeight + margin) {
                // Place On Top
                newPos.bottom = viewportHeight - rect.top + margin;
                newPos.top = undefined;
            } else {
                // Place Below (Default)
                newPos.top = rect.bottom + margin;
                newPos.bottom = undefined;
            }
            
            // Adjust horizontal if going off screen
            if (rect.left + 300 > window.innerWidth) {
                 newPos.left = undefined;
                 newPos.right = 20;
                 newPos.width = 300; 
            }

            setPosition(newPos);
        };

        calculatePosition();
        window.addEventListener('resize', calculatePosition);
        window.addEventListener('scroll', calculatePosition);
        
        return () => {
            window.removeEventListener('resize', calculatePosition);
            window.removeEventListener('scroll', calculatePosition);
        };
    }, [stepIndex, isActive, step.targetId]);

    const handleNext = () => {
        if (stepIndex < tutorialSteps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            finishTutorial();
        }
    };

    const finishTutorial = () => {
        setIsActive(false);
        if (user) {
            localStorage.setItem(`viva360_tutorial_seen_${user.id}`, 'true');
            localStorage.setItem('viva360_smart_tutorial_seen', 'true'); // Fallback
        }
    };

    const restartTutorial = () => {
        setStepIndex(0);
        setIsActive(true);
    };

    if (!isActive) {
        if (!user) return null; 
        
        // Double check path to ensure hidden on public routes
        const hiddenPaths = ['/', '/login', '/register', '/register/client', '/register/pro', '/register/space'];
        if (hiddenPaths.includes(window.location.pathname)) return null;

        
        return (
            <button 
                onClick={restartTutorial}
                className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-6 z-[90] w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-nature-100 flex items-center justify-center text-nature-400 hover:text-primary-600 active:scale-95 transition-all"
                title="Abrir Bússola (Ajuda)"
            >
                <Compass size={24} />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[1000] overflow-hidden pointer-events-none">
            {/* Dimmed Background */}
            <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-500" />

            {/* Target Highlight Cutout (Optional sophisticated effect, simplified here as focus rect) */}
            {!position.isCentered && position.width && (
                <div 
                    className="absolute border-4 border-white/50 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-500 ease-in-out"
                    style={{
                        top: position.top !== undefined ? position.top - (position.top > 100 ? 0 : 0) - 20 - (document.getElementById(step.targetId!)?.offsetHeight || 0) : undefined, // Quick hack to reconstruct rect top from computed pos
                        // Actually, using the stored rect would be cleaner, but for this 'Smart Position' logic let's keep it simple: 
                        // The highlight is often better handled by just dimming everything else.
                        // For this implementation, we will just float the card correctly.
                    }}
                />
            )}

            {/* Smart Card */}
            <div 
                ref={cardRef}
                className={`absolute pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${position.isCentered ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm' : ''}`}
                style={{
                    top: position.top,
                    bottom: position.bottom,
                    left: position.isCentered ? undefined : (position.left || 20),
                    right: position.right
                }}
            >
                <div className={`${step.color === 'bg-amber-900 text-white' ? 'bg-amber-900 text-white' : 'bg-white text-nature-900'} p-6 rounded-[2.5rem] shadow-2xl border border-white/20 relative overflow-hidden`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${step.color.includes('bg-white') ? 'bg-nature-50' : 'bg-white/10'}`}>
                            {step.icon}
                        </div>
                        <button onClick={finishTutorial} className="p-2 opacity-50 hover:opacity-100"><X size={20}/></button>
                    </div>

                    <h3 className="text-xl font-bold font-serif italic mb-2">{step.title}</h3>
                    <div className="max-h-32 overflow-y-auto pr-2 no-scrollbar">
                        <p className="text-sm font-medium opacity-80 leading-relaxed">{step.desc}</p>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                        <div className="flex gap-1">
                            {tutorialSteps.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? 'w-6 bg-current opacity-100' : 'w-1.5 bg-current opacity-30'}`} />
                            ))}
                        </div>
                        <button 
                            onClick={handleNext}
                            className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-transform active:scale-95 ${step.color.includes('amber-900') ? 'bg-white text-amber-900' : 'bg-nature-900 text-white'}`}
                        >
                            {stepIndex === tutorialSteps.length - 1 ? 'Concluir' : 'Próximo'} <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Safe Area Spacer for Bottom Mobile Bar */}
            <div className="fixed bottom-0 w-full h-[env(safe-area-inset-bottom)] pointer-events-none" />
        </div>
    );
};
