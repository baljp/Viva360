import React from 'react';
import { ICON_SIZE } from './constants';

export const HeroCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
    <div className={`card-hero bg-gradient-to-br from-primary-600 to-primary-900 text-white ${className}`}>
        {children}
    </div>
);

export const FunctionalCard: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = "", onClick }) => {
    const Comp = onClick ? 'button' : 'div';
    return (
        <Comp 
            onClick={onClick} 
            className={`card-functional text-left w-full ${className} ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''}`}
        >
            {children}
        </Comp>
    );
};

export const RitualCard: React.FC<{ children: React.ReactNode, color?: 'green' | 'purple' | 'gold', className?: string, onClick?: () => void }> = ({ children, color = 'green', className = "", onClick }) => {
    const colors = {
        green: 'bg-[#E7F3ED] text-[#3F8F6B]',
        purple: 'bg-[#ECE9FA] text-[#5A4CA8]',
        gold: 'bg-[#FBF3D9] text-[#C8A34A]'
    };
    const Comp = onClick ? 'button' : 'div';
    return (
        <Comp 
            onClick={onClick} 
            className={`card-ritual text-left w-full ${colors[color]} ${className} ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''}`}
        >
            {children}
        </Comp>
    );
};

export const PortalCard: React.FC<{ id?: string, title: string, subtitle: string, icon: React.FC<any>, bgImage: string, onClick: () => void, delay?: number }> = ({ id, title, subtitle, icon: Icon, bgImage, onClick, delay = 0 }) => (
  <button id={id} onClick={onClick} style={{ animationDelay: `${delay}ms` }} className="relative aspect-square rounded-2xl overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-up">
    <img 
        src={bgImage} 
        loading="lazy" 
        crossOrigin="anonymous"
        onError={(e) => { 
            e.currentTarget.src = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800';
        }}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        alt={title} 
    />
    <div className="absolute inset-0 bg-gradient-to-t from-nature-900/90 via-nature-900/40 to-transparent group-hover:from-primary-900/90 transition-colors"></div>
    <div className="absolute inset-0 p-5 flex flex-col justify-end text-left">
      <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white mb-2 group-hover:bg-white/20 transition-all"><Icon size={ICON_SIZE.MD} /></div>
      <p className="text-[8px] font-bold text-white/60 uppercase tracking-[0.3em] mb-1">{subtitle}</p>
      <h3 className="text-base font-serif italic text-white leading-tight">{title}</h3>
    </div>
  </button>
);

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm ${className}`}>{children}</div>
);
