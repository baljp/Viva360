import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { captureFrontendError } from '../lib/frontendLogger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[FlowGuard] Uncaught frequency shift:", error, errorInfo);
    captureFrontendError(error, { component: 'ErrorBoundary', errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfdfc] p-8 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-[2rem] shadow-xl flex items-center justify-center text-rose-500 mb-8 animate-in zoom-in duration-500">
            <ShieldAlert size={40} />
          </div>
          
          <h2 className="text-2xl font-serif italic text-nature-900 mb-4">Oscilação de Energia</h2>
          <p className="text-sm text-nature-500 max-w-xs mx-auto leading-relaxed mb-12">
            Houve uma interferência momentânea no fluxo do portal. <br/>
            Nossos guardiões já estão harmonizando o sistema.
          </p>

          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-3 px-8 py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
          >
            <RefreshCw size={16} />
            Restaurar Conexão
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
