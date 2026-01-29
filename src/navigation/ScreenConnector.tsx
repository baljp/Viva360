
import React from 'react';
import { useBuscadorFlow } from '../flow/BuscadorFlowContext';
import { useGuardiaoFlow } from '../flow/GuardiaoFlowContext';
import { useSantuarioFlow } from '../flow/SantuarioFlowContext';
import { screenMap } from './screenMap';
import { AnimatePresence, motion } from 'framer-motion';

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
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center opacity-50">
                    <h3 className="text-xl font-bold">Estado Desconhecido: {currentState}</h3>
                    <p>Nenhuma tela mapeada para este fluxo.</p>
                    <button onClick={() => flow.reset()} className="mt-4 px-4 py-2 bg-gray-200 rounded">Resetar Fluxo</button>
                </div>
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
