
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
    <div className="min-h-screen w-full bg-nature-900 text-white relative overflow-hidden flex flex-col items-center justify-center selection:bg-primary-500 selection:text-white">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-nature-500/10 rounded-full blur-[100px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md shadow-lg">
                <Star size={12} className="text-primary-400 fill-primary-400" />
                <span className="text-xs font-bold tracking-widest uppercase text-primary-200">Viva360 v2.0</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tight mb-6 bg-gradient-to-r from-white via-white to-nature-400 bg-clip-text text-transparent drop-shadow-sm">
                Future.<br/>
                <span className="text-primary-500 italic">Wellness.</span>
            </h1>

            <p className="text-nature-200 text-lg md:text-xl mb-12 max-w-lg mx-auto leading-relaxed font-light">
                Experience the next generation of holistic health. Instant connections, seamless rituals, and natural harmony.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <NanoButton onClick={onGetStarted} className="w-full sm:w-auto px-10 py-4 text-base shadow-[0_0_40px_rgba(14,165,233,0.3)] hover:shadow-[0_0_60px_rgba(14,165,233,0.5)] bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-full">
                    Start Journey <ArrowRight size={18} />
                </NanoButton>
                <NanoButton onClick={onLogin} variant="nano" className="w-full sm:w-auto px-10 py-4 text-base border border-white/10 hover:bg-white/5 rounded-full">
                    Member Login
                </NanoButton>
            </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-8 text-center w-full z-10">
             <p className="text-nature-500 text-xs uppercase tracking-widest opacity-60">Powered by Viva360 Ecosystem</p>
        </div>
    </div>
  );
};
