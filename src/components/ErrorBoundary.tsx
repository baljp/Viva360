import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Shield, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Report to Sentry in production
    import('@sentry/react').then(Sentry => {
      Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }).catch(() => { /* Sentry not available */ });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-nature-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Shield size={48} className="text-red-500" />
            </div>
            
            <h1 className="text-3xl font-serif text-nature-900 mb-4">Ops! Algo deu errado.</h1>
            <p className="text-nature-600 max-w-md mb-8">
                Não se preocupe, nossas raízes são fortes. Tente recarregar a página para restaurar o equilíbrio.
            </p>

            {this.state.error && import.meta.env.DEV && (
                <pre className="text-xs text-left bg-red-50 p-4 rounded-lg text-red-800 mb-8 overflow-auto max-w-lg w-full">
                    {this.state.error.toString()}
                </pre>
            )}

            <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-8 py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-nature-800 transition-colors"
            >
                <RefreshCw size={18} />
                Recarregar Viva360
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}