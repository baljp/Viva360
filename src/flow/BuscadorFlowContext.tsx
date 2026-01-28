
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { BuscadorState } from './types';
import { BuscadorFlowEngine } from './BuscadorFlowEngine';
import { isMockMode } from '../../lib/supabase';
import { Professional, Product } from '../../types';
import { api } from '../../services/api';

// Define Context State
interface FlowContextState {
    currentState: BuscadorState;
    history: BuscadorState[];
    engine: BuscadorFlowEngine;
    isLoading: boolean;
    error: string | null;
    toast: { title: string; message: string } | null;
    data: {
        pros: Professional[];
        products: Product[];
    }
}

// Actions
type FlowAction =
    | { type: 'TRANSITION'; payload: BuscadorState }
    | { type: 'BACK' }
    | { type: 'RESET' }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_DATA'; payload: { pros: Professional[]; products: Product[] } }
    | { type: 'SHOW_TOAST'; payload: { title: string; message: string } }
    | { type: 'CLEAR_TOAST' };

// Initial State Factory
const createInitialState = (): FlowContextState => ({
    currentState: 'START',
    history: [],
    engine: new BuscadorFlowEngine('START'),
    isLoading: false,
    error: null,
    toast: null,
    data: {
        pros: [],
        products: [],
    }
});

// Reducer
const flowReducer = (state: FlowContextState, action: FlowAction): FlowContextState => {
    switch (action.type) {
        case 'TRANSITION': {
            const tempEngine = new BuscadorFlowEngine(state.currentState, [...state.history]);
            const success = tempEngine.transition(action.payload);
            if (success) {
                return {
                    ...state,
                    currentState: tempEngine.currentState,
                    history: [...tempEngine.history],
                    engine: tempEngine,
                    error: null,
                };
            } else {
                return {
                    ...state,
                    error: `Invalid transition from ${state.currentState} to ${action.payload}`,
                };
            }
        }
        case 'BACK': {
            const tempEngine = new BuscadorFlowEngine(state.currentState, [...state.history]);
            const canBack = tempEngine.back();
            if (canBack) {
                return {
                    ...state,
                    currentState: tempEngine.currentState,
                    history: [...tempEngine.history],
                    engine: tempEngine,
                    error: null,
                };
            }
            return state;
        }
        case 'RESET':
            return createInitialState();
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_DATA':
            return { ...state, data: action.payload };
        case 'SHOW_TOAST':
            return { ...state, toast: action.payload };
        case 'CLEAR_TOAST':
            return { ...state, toast: null };
        default:
            return state;
    }
};

// Create Context
const BuscadorFlowContext = createContext<{
    state: FlowContextState;
    go: (target: BuscadorState) => void;
    back: () => void;
    reset: () => void;
    refreshData: () => Promise<void>;
} | undefined>(undefined);

// Provider Component
export const BuscadorFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(flowReducer, null, createInitialState);

    const refreshData = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const [pros, products] = await Promise.all([
                api.professionals.list(),
                api.marketplace.listAll()
            ]);
            dispatch({ type: 'SET_DATA', payload: { pros, products } });
        } catch (e) {
            console.error('Failed to fetch Buscador data', e);
            dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados do Jardim.' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const go = (target: BuscadorState) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        const delay = isMockMode ? 800 : 0; 
        
        setTimeout(() => {
             // Gamification Triggers
             if (target === 'METAMORPHOSIS_FEEDBACK') {
                 dispatch({ type: 'SHOW_TOAST', payload: { title: 'Karma +10', message: 'Evolução registrada.' }});
             }
             if (target === 'ORACLE_REVEAL') {
                 dispatch({ type: 'SHOW_TOAST', payload: { title: 'Karma +2', message: 'Sabedoria adquirida.' }});
             }
             if (target === 'PAYMENT_SUCCESS') {
                 dispatch({ type: 'SHOW_TOAST', payload: { title: 'Karma +5', message: 'Troca energética realizada.' }});
             }

             dispatch({ type: 'TRANSITION', payload: target });
             dispatch({ type: 'SET_LOADING', payload: false });
        }, delay);
    };

    const back = () => dispatch({ type: 'BACK' });
    const reset = () => dispatch({ type: 'RESET' });

    return (
        <BuscadorFlowContext.Provider value={{ state, go, back, reset, refreshData }}>
            {children}
        </BuscadorFlowContext.Provider>
    );
};

// Hook
export const useBuscadorFlow = () => {
    const context = useContext(BuscadorFlowContext);
    if (!context) {
        throw new Error('useBuscadorFlow must be used within a BuscadorFlowProvider');
    }
    return context;
};
