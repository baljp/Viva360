
import React from 'react';
import { useBuscadorFlow } from '../flow/BuscadorFlowContext';
import { useGuardiaoFlow } from '../flow/GuardiaoFlowContext';
import { useSantuarioFlow } from '../flow/SantuarioFlowContext';
import { screenMap } from './screenMap';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass } from 'lucide-react';

interface ConnectorProps {
    profile: 'BUSCADOR' | 'GUARDIAO' | 'SANTUARIO';
    user: any; // User type
    flow: any; // Flow Context
    updateUser?: (u: any) => void;
    setView?: (v: any) => void; // Legacy compatibility
}

export const ScreenConnector: React.FC<ConnectorProps & { [key: string]: any }> = ({ profile, user, flow, updateUser, setView, ...rest }) => {
    const currentState = flow.state.currentState;

    console.log(`[ScreenConnector] profile=${profile} currentState=${currentState}`);

    // Resolve Screen Component
    const ProfileMap = screenMap[profile];
    const ScreenComponent = ProfileMap ? ProfileMap[currentState] : null;

    if (!ScreenComponent) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-nature-50 p-8 text-center">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-nature-300 mb-8 animate-pulse">
                    <Compass size={48} />
                </div>
                <h3 className="text-2xl font-serif italic text-nature-900 mb-4">Sintonização Necessária</h3>
                <p className="text-sm text-nature-500 max-w-xs leading-relaxed mb-8">
                    Seu fluxo de energia encontrou um ponto de quietude. <br/>
                    Vamos voltar ao centro para retomar sua jornada.
                </p>
                <button 
                    onClick={() => flow.reset()} 
                    className="px-8 py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
                >
                    Voltar ao Centro
                </button>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentState}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.05 }}
                className="w-full h-full"
            >
                <React.Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-nature-200 border-t-nature-900 rounded-full animate-spin"></div>
                    </div>
                }>
                    <ScreenComponent 
                        user={user} 
                        updateUser={updateUser} 
                        setView={setView} 
                        flow={flow}
                        {...rest} 
                    />
                </React.Suspense>
            </motion.div>
        </AnimatePresence>
    );
};
