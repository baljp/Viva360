
import dynamic from 'next/dynamic';
import React from 'react';

// Importação dinâmica do componente App principal com SSR desativado
// Isso é crucial porque o app original depende pesadamente de 'window' e 'localStorage'
const App = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-[#f4f7f5]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-[#263732] rounded-2xl flex items-center justify-center text-white font-serif text-2xl animate-pulse">V</div>
        <p className="text-[#558273] text-xs font-bold uppercase tracking-widest">Carregando Frequência...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
