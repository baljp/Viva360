
import React, { useEffect } from 'react';
import { Sparkles, Check } from 'lucide-react';

interface RitualCompletionCardProps {
    title: string;
    message: string;
    onClose: () => void;
    mood?: string;
}

export const RitualCompletionCard: React.FC<RitualCompletionCardProps> = ({ title, message, onClose, mood }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[500] w-[90%] max-w-sm animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white/80 backdrop-blur-2xl border border-white/20 p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 overflow-hidden group">
                {/* Gradient background based on mood if provided */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-transparent opacity-50"></div>
                
                <div className="relative w-12 h-12 bg-nature-900 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <Sparkles size={24} className="animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] border-2 border-white">
                        <Check size={10} />
                    </div>
                </div>

                <div className="relative flex-1">
                    <h4 className="font-serif italic text-lg text-nature-900 leading-none">{title}</h4>
                    <p className="text-[11px] text-nature-500 mt-1 uppercase tracking-wider font-bold">{message}</p>
                </div>

                {/* Micro-glow effect */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary-400/20 blur-2xl rounded-full"></div>
            </div>
        </div>
    );
};
