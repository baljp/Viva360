import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Viva360 Fatal Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f2f7f5] flex flex-col items-center justify-center p-8 text-center text-nature-800 font-sans">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-400">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <h1 className="text-2xl font-serif font-semibold mb-2">Momento de Calma</h1>
          <p className="text-nature-50 mb-8 max-w-xs leading-relaxed">
            Algo inesperado aconteceu no fluxo. Não se preocupe, seus rituais estão seguros.
          </p>
          <div className="bg-white p-4 rounded-xl border border-nature-200 w-full max-w-sm overflow-auto max-h-32 text-xs text-left font-mono text-nature-400 mb-6">
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('viva360_user');
              window.location.reload();
            }} 
            className="bg-nature-900 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform"
          >
            Reiniciar Jornada
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}