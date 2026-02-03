import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';

export const ZenToast: React.FC<{ toast: { title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning' }, onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 4000); return () => clearTimeout(timer); }, [onClose]);
  
  const typeConfig = {
      success: { bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 },
      error: { bg: 'bg-rose-50 border-rose-100', iconBg: 'bg-rose-100 text-rose-600', icon: AlertCircle },
      warning: { bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100 text-amber-600', icon: AlertCircle },
      info: { bg: 'bg-white/90 border-white', iconBg: 'bg-primary-50 text-primary-600', icon: Sparkles }
  };

  const config = typeConfig[toast.type || 'info'];
  const Icon = config.icon;

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-[350px] animate-in slide-in-from-top-10 fade-in duration-500 pointer-events-none">
      <div className={`${config.bg} backdrop-blur-xl border p-4 rounded-[2rem] shadow-2xl flex items-center text-left gap-4 pointer-events-auto border-white/50 relative overflow-hidden group min-h-[80px]`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full blur-2xl -translate-y-1/3 translate-x-1/3"></div>
        
        <div className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
             <Icon size={20} className="animate-pulse" />
        </div>
        
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="font-serif italic text-sm text-nature-900 leading-tight mb-0.5">{toast.title}</h4>
          <p className="text-[10px] font-bold text-nature-500 uppercase tracking-wide leading-tight line-clamp-2">{toast.message}</p>
        </div>

        <button onClick={onClose} className="absolute top-3 right-3 text-nature-300 hover:text-nature-900 transition-colors p-1 bg-white/20 rounded-full hover:bg-white/40"><X size={14}/></button>
      </div>
    </div>
  );
};
