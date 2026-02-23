import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';

const DURATION = 4000;

export const ZenToast: React.FC<{ toast: { title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning' }, onClose: () => void }> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Auto-dismiss timer + progress bar
  useEffect(() => {
    startTimeRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(onClose, DURATION);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onClose]);

  // Swipe gesture
  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    setOffsetX(e.touches[0].clientX - startXRef.current);
  };
  const onTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(offsetX) > 80) {
      onClose();
    } else {
      setOffsetX(0);
    }
    startXRef.current = null;
  };

  const typeConfig = {
    success: { bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-400', icon: CheckCircle2 },
    error: { bg: 'bg-rose-50 border-rose-100', iconBg: 'bg-rose-100 text-rose-600', bar: 'bg-rose-400', icon: AlertCircle },
    warning: { bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100 text-amber-600', bar: 'bg-amber-400', icon: AlertCircle },
    info: { bg: 'bg-white/90 border-white', iconBg: 'bg-primary-50 text-primary-600', bar: 'bg-primary-400', icon: Sparkles },
  };

  const config = typeConfig[toast.type || 'info'];
  const Icon = config.icon;
  const opacity = Math.max(0, 1 - Math.abs(offsetX) / 160);

  return (
    <div
      data-testid="zen-toast"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-[max(env(safe-area-inset-top),0.75rem)] sm:top-[calc(env(safe-area-inset-top)+1rem)] left-0 right-0 mx-auto z-[1000] w-[92vw] sm:w-[90%] max-w-[360px] animate-in slide-in-from-top-10 fade-in duration-500 pointer-events-none px-1"
    >
      <div
        className={`${config.bg} backdrop-blur-xl border p-4 rounded-[2rem] shadow-2xl flex items-center text-left gap-3 pointer-events-auto border-white/50 relative overflow-hidden group min-h-[84px]`}
        style={{
          transform: `translateX(${offsetX}px)`,
          opacity,
          transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full blur-2xl -translate-y-1/3 translate-x-1/3"></div>

        {/* Timer progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 rounded-b-[2rem] overflow-hidden">
          <div
            className={`h-full ${config.bar} transition-none`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
          <Icon size={20} className="animate-pulse" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <h4 className="font-serif italic text-sm text-nature-900 leading-tight mb-0.5">{toast.title}</h4>
          <p className="text-[11px] font-medium text-nature-600 leading-snug break-words line-clamp-3">{toast.message}</p>
        </div>

        <button
          data-testid="zen-toast-close"
          onClick={onClose}
          aria-label="Fechar notificação"
          className="absolute top-3 right-3 text-nature-300 hover:text-nature-900 transition-colors p-1 bg-white/20 rounded-full hover:bg-white/40"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
