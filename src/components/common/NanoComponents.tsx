
import React from 'react';

interface NanoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'banana' | 'nano' | 'ghost';
  icon?: React.ElementType;
}

export const NanoButton: React.FC<NanoButtonProps> = ({ children, variant = 'banana', icon: Icon, className = '', ...props }) => {
  const baseStyle = "flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    banana: "btn-banana text-nano-900 font-bold uppercase tracking-wide",
    nano: "btn-nano text-white/90 hover:text-white uppercase tracking-wide text-sm",
    ghost: "bg-transparent text-nano-400 hover:text-banana-400 hover:bg-white/5 px-4 py-2 rounded-lg"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export const NanoCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`nano-card p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};
