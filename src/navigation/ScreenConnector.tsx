
import React from 'react';
import { screenMap } from './screenMap';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import type { User, ViewState } from '../../types';

type ConnectorFlowLike = {
    state: { currentState: string };
    reset: () => void;
    go?: (target: string) => void;
    back?: () => void;
    jump?: (target: string) => void;
    notify?: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
};

interface ConnectorProps {
    profile: 'BUSCADOR' | 'GUARDIAO' | 'SANTUARIO';
    user: User;
    flow: ConnectorFlowLike;
    updateUser?: (u: User) => void;
    setView?: (v: ViewState) => void; // Legacy compatibility
}

export const ScreenConnector: React.FC<ConnectorProps & Record<string, unknown>> = ({ profile, user, flow, updateUser, setView, ...rest }) => {
    const currentState = flow.state.currentState;

    // Resolve Screen Component
    const ProfileMap = (screenMap as Record<string, Record<string, React.ComponentType<Record<string, unknown>>>>)[profile];
    const ScreenComponent = ProfileMap ? ProfileMap[currentState] : null;

    if (!ScreenComponent) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-nature-50 p-8 text-center">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-nature-300 mb-8 animate-pulse">
                    <Compass size={48} />
                </div>
                <h3 className="text-2xl font-serif italic text-nature-900 mb-4">Sintonização Necessária</h3>
                <p className="text-sm text-nature-500 max-w-xs leading-relaxed mb-8">
                    Seu fluxo de energia encontrou um ponto de quietude. <br />
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

    const animConfig = profileTransitions[profile] || profileTransitions.DEFAULT;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentState}
                initial={animConfig.initial}
                animate={animConfig.animate}
                exit={animConfig.exit}
                transition={animConfig.transition}
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

const profileTransitions = {
    BUSCADOR: {
        initial: { opacity: 0, scale: 0.98, filter: "blur(4px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 1.02, filter: "blur(4px)" },
        transition: { duration: 0.4, ease: "easeOut" as const }
    },
    GUARDIAO: {
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -15 },
        transition: { duration: 0.3, ease: "easeOut" as const }
    },
    SANTUARIO: {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.3, ease: "circOut" as const }
    },
    DEFAULT: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 }
    }
} as const;
