import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { Sparkle, Wind, Heart, X, Play, Check, ArrowRight } from 'lucide-react';
import { gardenService } from '../../../services/gardenService';
import { api } from '../../../services/api';

interface MicroJourneyModalProps {
    type: 'Corpo' | 'Mente' | 'Espírito';
    user: User;
    onClose: () => void;
    onComplete: (user: User) => void;
}

const JOURNEYS = {
    'Corpo': {
        title: "Enraizamento",
        icon: Heart,
        steps: [
            "Respire fundo. Sinta seus pés no chão.",
            "Solte os ombros. Libere o peso do mundo.",
            "Escaneie seu corpo. Onde há tensão, envie luz."
        ],
        color: "bg-rose-50 text-rose-600",
        accent: "text-rose-500"
    },
    'Mente': {
        title: "Clareza",
        icon: Wind,
        steps: [
            "Feche os olhos por um instante.",
            "Visualize seus pensamentos como nuvens passando.",
            "Você é o céu. Vasto, imóvel e sereno."
        ],
        color: "bg-indigo-50 text-indigo-600",
        accent: "text-indigo-500"
    },
    'Espírito': {
        title: "Conexão",
        icon: Sparkle,
        steps: [
            "Coloque a mão no coração.",
            "Sinta a pulsação da vida em você.",
            "Agradeça por estar aqui, agora."
        ],
        color: "bg-amber-50 text-amber-600",
        accent: "text-amber-500"
    }
};

export const MicroJourneyModal: React.FC<MicroJourneyModalProps> = ({ type, user, onClose, onComplete }) => {
    const config = JOURNEYS[type] || JOURNEYS['Mente'];
    const [currentStep, setCurrentStep] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    const handleNext = async () => {
        if (currentStep < config.steps.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            finish();
        }
    };

    const finish = async () => {
        setIsCompleted(true);
        const reward = gardenService.calculateMicroJourneyReward(user);
        
        const updatedUser: User = {
            ...user,
            plantHealth: Math.min(100, (user.plantHealth || 0) + reward.health),
            plantXp: (user.plantXp || 0) + reward.xp,
            karma: (user.karma || 0) + reward.karma
        };

        // Don't close immediately, show success state
        await api.users.update(updatedUser);
        
        // Let parent know but keep modal open for a sec to show animation if we wanted
        // For now, simpler:
        setTimeout(() => onComplete(updatedUser), 2000);
    };

    if (isCompleted) {
        return (
            <div className="fixed inset-0 z-[100] bg-nature-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-nature-50/50" />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                             <Sparkle size={32} className="text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif italic text-nature-900">Jardim Nutrido</h3>
                            <p className="text-xs text-nature-400 font-bold uppercase tracking-widest mt-1">Sua luz se expandiu</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-4 py-1.5 bg-nature-100 rounded-full text-[10px] font-bold uppercase text-nature-500">+10 Vitalidade</span>
                            <span className="px-4 py-1.5 bg-nature-100 rounded-full text-[10px] font-bold uppercase text-nature-500">+10 Karma</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-nature-900/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
             <div className="fixed inset-0" onClick={onClose}></div>
             <div className={`bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 relative overflow-hidden`}>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${config.color}`}>
                        <config.icon size={24} />
                     </div>
                     <button onClick={onClose} className="p-2 bg-nature-50 rounded-full hover:bg-nature-100"><X size={20} className="text-nature-400"/></button>
                </div>

                {/* Progress */}
                <div className="flex gap-1 mb-8">
                    {config.steps.map((_, idx) => (
                        <div key={idx} className={`h-1 flex-1 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-primary-500' : 'bg-nature-100'}`} />
                    ))}
                </div>

                {/* Content */}
                <div className="min-h-[160px] flex flex-col justify-center text-center space-y-4 animate-in fade-in duration-500 key={currentStep}">
                    <h3 className="text-xl font-serif italic text-nature-900">Passo {currentStep + 1}</h3>
                    <p className={`text-lg font-medium leading-relaxed ${config.accent}`}>
                        {config.steps[currentStep]}
                    </p>
                </div>

                {/* Footer */}
                <button 
                    onClick={handleNext}
                    className="w-full py-5 bg-nature-900 text-white rounded-3xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-6"
                >
                    {currentStep === config.steps.length - 1 ? (
                        <>Concluir <Check size={18} /></> 
                    ) : ( 
                        <>Próximo <ArrowRight size={18} /></>
                    )}
                </button>

             </div>
        </div>
    );
};
