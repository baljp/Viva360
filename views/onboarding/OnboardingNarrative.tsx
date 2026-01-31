import React, { useState } from 'react';
import { Sparkles, ArrowRight, Heart, Zap, Shield, Moon, Sun, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao Viva360',
        subtitle: 'SUA JORNADA DE LUZ COMEÇA AQUI',
        description: 'Um espaço sagrado para cuidar da sua saúde física, mental e espiritual. Onde a ciência encontra a alma.',
        icon: Sparkles,
        color: 'from-amber-400 to-orange-500',
        image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800'
    },
    {
        id: 'rituals',
        title: 'Rituais Diários',
        subtitle: 'CULTIVE SEU JARDIM INTERIOR',
        description: 'Crie hábitos que nutrem sua essência. Registre sua evolução e veja sua planta da alma florescer.',
        icon: Heart,
        color: 'from-emerald-400 to-teal-500',
        image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=800'
    },
    {
        id: 'oracle',
        title: 'Oráculo Phoenix',
        subtitle: 'SABEDORIA PARA CADA INSTANTE',
        description: 'Receba insights personalizados baseados na sua energia do momento. Transforme sombra em luz.',
        icon: Zap,
        color: 'from-indigo-400 to-purple-500',
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800'
    },
    {
        id: 'tribe',
        title: 'Tribo Viva',
        subtitle: 'CONECTE-SE COM A EGRÉGORA',
        description: 'Faça pactos de alma, participe de círculos de cura e eleve a vibração coletiva com sua presença.',
        icon: Shield,
        color: 'from-rose-400 to-pink-500',
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b30c?q=80&w=800'
    }
];

export const OnboardingNarrative: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const step = ONBOARDING_STEPS[currentStep];

    const next = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={step.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 relative"
                >
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0">
                        <img 
                            src={step.image} 
                            className="w-full h-full object-cover"
                            alt={step.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-nature-950 via-nature-950/60 to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="absolute inset-x-0 bottom-0 p-10 pb-20 space-y-6">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-[2rem] flex items-center justify-center text-white shadow-2xl mb-6 shadow-black/40`}>
                                <step.icon size={32} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-2">{step.subtitle}</p>
                            <h2 className="text-4xl font-serif italic text-white leading-tight">{step.title}</h2>
                        </motion.div>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-white/70 text-lg leading-relaxed max-w-sm"
                        >
                            {step.description}
                        </motion.p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="bg-nature-950 px-10 py-10 flex items-center justify-between border-t border-white/5">
                <div className="flex gap-2">
                    {ONBOARDING_STEPS.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1 rounded-full transition-all duration-500 ${currentStep === i ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                        />
                    ))}
                </div>
                
                <button 
                    onClick={next}
                    className="bg-white text-nature-950 px-8 py-4 rounded-3xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95 transition-all shadow-xl"
                >
                    {currentStep === ONBOARDING_STEPS.length - 1 ? 'Começar Jornada' : 'Continuar'}
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};
