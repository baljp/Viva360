import React from 'react';
import { ChevronRight, X } from 'lucide-react';
import { ICON_SIZE } from './constants';

export const PortalView: React.FC<{ 
    title: string, 
    subtitle: string, 
    onBack?: () => void, 
    onClose?: () => void,
    children: React.ReactNode, 
    footer?: React.ReactNode,
    headerRight?: React.ReactNode,
    heroImage?: string
}> = ({ title, subtitle, onBack, onClose, children, footer, headerRight, heroImage }) => (
    <div className="fixed inset-0 z-[150] flex flex-col bg-nature-50 animate-in slide-in-from-right duration-300 h-full w-full lg:items-center lg:justify-center lg:bg-nature-900/40 lg:backdrop-blur-sm">
        <div className="flex flex-col h-full w-full lg:max-w-xl lg:h-[90vh] lg:rounded-[3rem] lg:shadow-elegant lg:overflow-hidden lg:bg-nature-50 relative">
            <header className={`flex-none flex items-center justify-between px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 z-20 transition-colors ${heroImage ? 'bg-transparent text-white absolute top-0 w-full' : 'bg-white border-b border-nature-100 shadow-sm relative'}`}>
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className={`p-2.5 rounded-xl active:scale-90 transition-all shadow-sm ${heroImage ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-nature-50 text-nature-600'}`}>
                            <ChevronRight className="rotate-180" size={ICON_SIZE.MD} />
                        </button>
                    )}
                    <div className="space-y-0.5">
                        <h2 className={`text-lg font-serif italic leading-none ${heroImage ? 'text-white drop-shadow-md' : 'text-nature-900'}`}>{title}</h2>
                        <p className={`text-[9px] uppercase tracking-[0.3em] font-bold ${heroImage ? 'text-white/80 drop-shadow-sm' : 'text-nature-400'}`}>{subtitle}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {headerRight}
                    {onClose && (
                        <button onClick={onClose} className={`p-2.5 rounded-xl active:scale-90 transition-all shadow-sm ${heroImage ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-rose-50 text-rose-400'}`}>
                            <X size={ICON_SIZE.MD} />
                        </button>
                    )}
                </div>
            </header>
            
            
            <div className="flex-1 overflow-y-auto no-scrollbar pb-[calc(8rem+env(safe-area-inset-bottom))] overscroll-contain relative lg:pb-12">
                {heroImage && (
                    <div className="w-full h-72 relative shrink-0">
                        <img 
                            src={heroImage} 
                            crossOrigin="anonymous"
                            onError={(e) => { 
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800';
                            }}
                            className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-nature-50/20"></div>
                    </div>
                )}
                <div className={`flex flex-col ${heroImage ? '-mt-12 relative z-10 bg-nature-50 rounded-t-[2.5rem] min-h-[50vh] p-6 shadow-2xl border-t border-white/20' : 'p-6'}`}>
                    {children}
                </div>
            </div>
            
            {footer && <div className="flex-none bg-white border-t border-nature-100 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] relative z-30 lg:rounded-b-[3rem]">
                {footer}
            </div>}
        </div>
    </div>
);
