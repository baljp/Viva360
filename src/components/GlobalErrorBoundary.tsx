import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { captureFrontendError } from '../../lib/frontendLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureFrontendError(error, {
      component: 'GlobalErrorBoundary',
      reactComponentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-rose-50 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-rose-500 mb-8">
            <ShieldAlert size={40} />
          </div>
          
          <h2 className="text-2xl font-serif italic text-rose-900 mb-4">Fluxo Interrompido</h2>
          <p className="text-sm text-rose-700/60 max-w-xs mx-auto leading-relaxed mb-12">
            Houve uma oscilação na frequência do sistema. <br/>
            Não se preocupe, sua essência está segura.
          </p>

          <button 
            onClick={this.handleReset}
            className="flex items-center gap-3 px-8 py-4 bg-rose-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
          >
            <RefreshCw size={16} />
            Restaurar Conexão
          </button>
          
          <div className="mt-12 opacity-20">
            <p className="text-[8px] font-mono">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
