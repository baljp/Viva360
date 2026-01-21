
import React from 'react';
import { NanoButton } from '../components/common/NanoComponents';
import { Zap, ArrowRight, Star } from 'lucide-react';
import { ViewState } from '../types';

interface NanoLandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const NanoLanding: React.FC<NanoLandingProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen w-full bg-nano-950 text-white relative overflow-hidden flex flex-col items-center justify-center">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-banana-400/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                <Star size={12} className="text-banana-400 fill-banana-400" />
                <span className="text-xs font-bold tracking-widest uppercase text-banana-100">Viva360 v2.0</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-white via-white to-nano-400 bg-clip-text text-transparent">
                Future.<br/>
                <span className="text-banana-400">Wellness.</span>
            </h1>

            <p className="text-nano-400 text-lg md:text-xl mb-10 max-w-lg mx-auto leading-relaxed">
                Experience the next generation of holistic health. Instant connections, seamless rituals, and nano-speed service.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <NanoButton onClick={onGetStarted} className="w-full sm:w-auto px-8 py-4 text-base shadow-[0_0_40px_rgba(250,204,21,0.3)] hover:shadow-[0_0_60px_rgba(250,204,21,0.5)]">
                    Start Journey <ArrowRight size={18} />
                </NanoButton>
                <NanoButton onClick={onLogin} variant="nano" className="w-full sm:w-auto px-8 py-4 text-base">
                    Member Login
                </NanoButton>
            </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-8 text-center w-full z-10">
             <p className="text-nano-600 text-xs uppercase tracking-widest opacity-50">Powered by Nano Banana Architecture</p>
        </div>
    </div>
  );
};
