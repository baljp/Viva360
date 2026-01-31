import React from 'react';
import { Compass, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFoundScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8faf9] p-8 text-center">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center text-nature-200 mb-8 relative">
                <Compass size={48} className="animate-pulse" />
                <div className="absolute top-0 right-0 w-6 h-6 bg-rose-400 rounded-full border-4 border-white"></div>
            </div>
            
            <h1 className="text-4xl font-serif italic text-nature-900 mb-4">Caminho Desviado</h1>
            <p className="text-sm text-nature-500 max-w-xs mx-auto leading-relaxed mb-12 uppercase tracking-widest font-bold">
                A rota que você procura não faz parte do mapa atual.
            </p>

            <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-3 px-8 py-4 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
            >
                <Home size={16} />
                Voltar ao Início
            </button>
            
            <div className="mt-16 opacity-30">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Erro 404 • Harmonia em Progresso</p>
            </div>
        </div>
    );
};
