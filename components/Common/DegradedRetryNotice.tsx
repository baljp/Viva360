import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const DegradedRetryNotice: React.FC<{
  title: string;
  message: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}> = ({ title, message, onRetry, compact = false, className = '' }) => {
  return (
    <div data-testid="degraded-retry-notice" className={`rounded-2xl border border-amber-200 bg-amber-50/80 backdrop-blur-sm text-amber-900 ${compact ? 'p-3' : 'p-4'} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[10px] font-bold uppercase tracking-widest">{title}</h4>
          <p className={`mt-1 ${compact ? 'text-[11px]' : 'text-xs'} leading-relaxed text-amber-800`}>{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-amber-200 text-[10px] font-bold uppercase tracking-widest text-amber-700 hover:bg-amber-100/40 active:scale-95 transition-all"
            >
              <RefreshCw size={13} /> Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
