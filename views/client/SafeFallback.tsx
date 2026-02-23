
import React from 'react';
import { useBuscadorFlow } from '../../src/flow/useBuscadorFlow';
import { AlertCircle } from 'lucide-react';

export const SafeFallback: React.FC = () => {
    const { back, reset } = useBuscadorFlow();

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 animate-in fade-in">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-sm">
                <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-serif italic text-nature-900">Caminho em Neblina</h3>
                <p className="text-sm text-nature-600">O destino que você procura não está mapeado nas estrelas ainda.</p>
            </div>
            <div className="flex gap-4">
               <button onClick={back} className="px-6 py-3 bg-white border border-nature-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-nature-500 active:scale-95 transition-all">Voltar</button>
               <button onClick={reset} className="px-6 py-3 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Início</button>
            </div>
        </div>
    );
};
