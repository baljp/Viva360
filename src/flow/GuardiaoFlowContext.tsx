
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GuardiaoState } from './guardiaoTypes';
import { GuardiaoFlowEngine } from './GuardiaoFlowEngine';
import { isMockMode } from '../../lib/supabase'; 

// Define Context State
interface GuardiaoContextState {
    currentState: GuardiaoState;
    history: GuardiaoState[];
    engine: GuardiaoFlowEngine;
    isLoading: boolean;
    error: string | null;
    notification: { title: string; message: string; type: 'info' | 'success' | 'warning' } | null;
    // Mock Data Holders
    mockStats: {
        pendingAppointments: number;
        revenueToday: number;
        reputation: number;
    }
}

// Actions
type FlowAction =
    | { type: 'TRANSITION'; payload: GuardiaoState }
    | { type: 'BACK' }
    | { type: 'RESET' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'NOTIFY'; payload: { title: string; message: string; type: 'info' | 'success' | 'warning' } }
    | { type: 'CLEAR_NOTIFICATION' };

// Initial State
const initialState: GuardiaoContextState = {
    currentState: 'START',
    history: [],
    engine: new GuardiaoFlowEngine('START'),
    isLoading: false,
    error: null,
    notification: null,
    mockStats: {
        pendingAppointments: 3,
        revenueToday: 450.00,
        reputation: 4.9
    }
};

// Reducer
const flowReducer = (state: GuardiaoContextState, action: FlowAction): GuardiaoContextState => {
    switch (action.type) {
        case 'TRANSITION':
            const success = state.engine.transition(action.payload);
            if (success) {
                return {
                    ...state,
                    currentState: state.engine.getState(),
                    history: [...state.engine['history']],
                };
            }
            return state;
        case 'BACK':
            state.engine.back();
            return {
                ...state,
                currentState: state.engine.getState(),
                history: [...state.engine['history']],
            };
        case 'RESET':
            state.engine.reset();
            return { ...initialState };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'NOTIFY':
            return { ...state, notification: action.payload };
        case 'CLEAR_NOTIFICATION':
            return { ...state, notification: null };
        default:
            return state;
    }
};

const GuardiaoFlowContext = createContext<{
    state: GuardiaoContextState;
    go: (target: GuardiaoState) => void;
    back: () => void;
    reset: () => void;
} | undefined>(undefined);

export const GuardiaoFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(flowReducer, initialState);

    const go = (target: GuardiaoState) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Mock Latency & Logic
        const delay = isMockMode ? 600 : 0;
        
        setTimeout(() => {
            // Logic Hooks
            if (target === 'ESCAMBO_CONFIRM') {
                dispatch({ type: 'NOTIFY', payload: { title: 'Proposta Enviada', message: 'O guardião receberá seu chamado de troca.', type: 'success' } });
            }
            if (target === 'SANTUARIO_CONTRACT') {
                 dispatch({ type: 'NOTIFY', payload: { title: 'Vínculo Estabelecido', message: 'Contrato energético firmado com o Santuário.', type: 'success' } });
            }
            if (target === 'VAGA_APPLY') {
                 dispatch({ type: 'NOTIFY', payload: { title: 'Candidatura Realizada', message: 'Sua intenção foi enviada ao espaço.', type: 'success' } });
            }

            dispatch({ type: 'TRANSITION', payload: target });
            dispatch({ type: 'SET_LOADING', payload: false });
        }, delay);
    };

    const back = () => dispatch({ type: 'BACK' });
    const reset = () => dispatch({ type: 'RESET' });

    return (
        <GuardiaoFlowContext.Provider value={{ state, go, back, reset }}>
            {children}
        </GuardiaoFlowContext.Provider>
    );
};

export const useGuardiaoFlow = () => {
    const context = useContext(GuardiaoFlowContext);
    if (!context) throw new Error('useGuardiaoFlow must be used within GuardiaoFlowProvider');
    return context;
};
