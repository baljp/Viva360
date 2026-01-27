
import React from 'react';
import { useBuscadorFlow } from '../flow/BuscadorFlowContext';
import { useGuardiaoFlow } from '../flow/GuardiaoFlowContext';
import { useSantuarioFlow } from '../flow/SantuarioFlowContext';
import { screenMap } from './screenMap';
import { AnimatePresence, motion } from 'framer-motion';

interface ConnectorProps {
    profile: 'BUSCADOR' | 'GUARDIAO' | 'SANTUARIO';
    user: any; // User type
    updateUser?: (u: any) => void;
    setView?: (v: any) => void; // Legacy compatibility
}

export const ScreenConnector: React.FC<ConnectorProps & { [key: string]: any }> = ({ profile, user, updateUser, setView, ...rest }) => {
    let currentState: string = 'START';
    let flowContext: any = null;

    if (profile === 'BUSCADOR') {
        const ctx = useBuscadorFlow();
        currentState = ctx.state.currentState;
        flowContext = ctx;
    } else if (profile === 'GUARDIAO') {
        const ctx = useGuardiaoFlow();
        currentState = ctx.state.currentState;
        flowContext = ctx;
    } else if (profile === 'SANTUARIO') {
        const ctx = useSantuarioFlow();
        currentState = ctx.state.currentState;
        flowContext = ctx;
    }

    // Resolve Screen Component
    const ProfileMap = screenMap[profile];
    const ScreenComponent = ProfileMap ? ProfileMap[currentState] : null;

    if (!ScreenComponent) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center opacity-50">
                    <h3 className="text-xl font-bold">Estado Desconhecido: {currentState}</h3>
                    <p>Nenhuma tela mapeada para este fluxo.</p>
                    <button onClick={() => flowContext.reset()} className="mt-4 px-4 py-2 bg-gray-200 rounded">Resetar Fluxo</button>
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
                transition={{ duration: 0.2 }}
                className="w-full h-full"
            >
                <ScreenComponent 
                    user={user} 
                    updateUser={updateUser} 
                    setView={setView} 
                    flow={flowContext}
                    {...rest} 
                />
            </motion.div>
        </AnimatePresence>
    );
};
