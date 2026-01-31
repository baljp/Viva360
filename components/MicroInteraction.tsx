
import React, { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface MicroInteractionProps {
    title: string;
    message: string;
    icon?: React.ReactNode;
    onClose?: () => void;
    onComplete?: () => void;
    duration?: number;
}

export const MicroInteraction: React.FC<MicroInteractionProps> = ({ 
    title, 
    message, 
    icon = <Sparkles size={24} />, 
    onClose, 
    onComplete,
    duration = 4000 
}) => {
    useEffect(() => {
        const callback = onComplete || onClose;
        if (!callback) return;
        const timer = setTimeout(callback, duration);
        return () => clearTimeout(timer);
    }, [onClose, onComplete, duration]);

    return (
        <div className="micro-interaction-container flex flex-col items-center justify-center text-center gap-4 border-white/50 animate-in slide-in-from-bottom-10 pointer-events-auto">
            {/* Elegant Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent rounded-[2rem] pointer-events-none"></div>
            
            <div className="relative">
                <div className="absolute inset-0 bg-primary-400/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 relative z-10 border border-primary-100 shadow-inner group-hover:rotate-12 transition-transform duration-700">
                    {icon}
                </div>
            </div>

            <div className="space-y-1 relative z-10">
                <h3 className="text-xl font-serif italic text-nature-900 leading-tight">{title}</h3>
                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto">
                    {message}
                </p>
            </div>

            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 text-nature-300 hover:text-nature-900 transition-colors"
                aria-label="Fechar"
            >
                <X size={16} />
            </button>
            
            {/* Visual Continuity Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-primary-500/20 transition-all duration-[4000ms] ease-linear w-full origin-left animate-shrink-x"></div>
        </div>
    );
};
