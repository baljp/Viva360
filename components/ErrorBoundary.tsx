import React from 'react';
import * as Sentry from "@sentry/react";

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
    console.error("Uncaught error:", error, errorInfo);
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-nature-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
             <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-500 text-2xl font-bold">!</div>
             <h2 className="text-xl font-serif italic text-nature-900">Algo não saiu como esperado</h2>
             <p className="text-nature-600 text-sm">Nossos guardiões digitais já foram notificados.</p>
             <button 
                onClick={() => window.location.reload()}
                className="bg-nature-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-nature-800 transition-colors"
             >
                Recarregar Aplicação
             </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}