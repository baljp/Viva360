import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig: Record<ToastType, { icon: React.FC<any>; bgColor: string; textColor: string }> = {
  success: { icon: CheckCircle, bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
  error: { icon: AlertCircle, bgColor: 'bg-rose-50', textColor: 'text-rose-700' },
  info: { icon: Info, bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  warning: { icon: AlertTriangle, bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;
          
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto max-w-sm w-full ${config.bgColor} rounded-2xl shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right duration-300`}
            >
              <div className={`flex-shrink-0 ${config.textColor}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${config.textColor}`}>{toast.title}</p>
                {toast.message && (
                  <p className={`text-xs mt-0.5 ${config.textColor} opacity-80`}>{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className={`flex-shrink-0 p-1 rounded-full hover:bg-black/5 ${config.textColor} opacity-50 hover:opacity-100`}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
