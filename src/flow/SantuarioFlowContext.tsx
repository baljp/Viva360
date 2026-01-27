
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SantuarioState } from './santuarioTypes';
import { SantuarioFlowEngine } from './SantuarioFlowEngine';
import { isMockMode } from '../../lib/supabase'; // Reuse existing mock check

interface SantuarioContextState {
    currentState: SantuarioState;
    history: SantuarioState[];
    engine: SantuarioFlowEngine;
    isLoading: boolean;
    error: string | null;
    notification: { title: string; message: string; type: 'info' | 'success' | 'warning' } | null;
    // Mock Data for Admin Dashboard
    adminStats: {
        activePros: number;
        totalPatients: number;
        occupancyRate: number;
        monthlyRevenue: number;
    }
}

type FlowAction =
    | { type: 'TRANSITION'; payload: SantuarioState }
    | { type: 'BACK' }
    | { type: 'RESET' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'NOTIFY'; payload: { title: string; message: string; type: 'info' | 'success' | 'warning' } }
    | { type: 'CLEAR_NOTIFICATION' };

const initialState: SantuarioContextState = {
    currentState: 'START',
    history: [],
    engine: new SantuarioFlowEngine('START'),
    isLoading: false,
    error: null,
    notification: null,
    adminStats: {
        activePros: 12,
        totalPatients: 450,
        occupancyRate: 85,
        monthlyRevenue: 125000
    }
};

const flowReducer = (state: SantuarioContextState, action: FlowAction): SantuarioContextState => {
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

const SantuarioFlowContext = createContext<{
    state: SantuarioContextState;
    go: (target: SantuarioState) => void;
    back: () => void;
    reset: () => void;
} | undefined>(undefined);

export const SantuarioFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(flowReducer, initialState);

    const go = (target: SantuarioState) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Mock Latency
        const delay = isMockMode ? 500 : 0;
        
        setTimeout(() => {
            // Logic Hooks for Notifications
            if (target === 'FINANCE_REPASSES') {
                dispatch({ type: 'NOTIFY', payload: { title: 'Lote Processado', message: 'Cálculo de repasses atualizado.', type: 'info' } });
            }
            if (target === 'VAGA_CREATE') {
                dispatch({ type: 'NOTIFY', payload: { title: 'Expansão', message: 'Nova oportunidade aberta no portal.', type: 'success' } });
            }

            dispatch({ type: 'TRANSITION', payload: target });
            dispatch({ type: 'SET_LOADING', payload: false });
        }, delay);
    };

    const back = () => dispatch({ type: 'BACK' });
    const reset = () => dispatch({ type: 'RESET' });

    return (
        <SantuarioFlowContext.Provider value={{ state, go, back, reset }}>
            {children}
        </SantuarioFlowContext.Provider>
    );
};

export const useSantuarioFlow = () => {
    const context = useContext(SantuarioFlowContext);
    if (!context) throw new Error('useSantuarioFlow must be used within SantuarioFlowProvider');
    return context;
};
