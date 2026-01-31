
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { BuscadorState } from './types';
import { BuscadorFlowEngine } from './BuscadorFlowEngine';
import { isMockMode } from '../../lib/supabase';
import { Professional, Product } from '../../types';
import { api } from '../../services/api';
import { RitualCompletionCard } from '../components/RitualCompletionCard';
import { BaseFlowState, BaseFlowAction, createFlowReducer } from './baseFlow';

// Define Context State
interface FlowContextState extends BaseFlowState<BuscadorState> {
    engine: BuscadorFlowEngine;
    toast: { title: string; message: string } | null;
    data: {
        pros: Professional[];
        products: Product[];
    };
    selectedProfessionalId: string | null;
    selectedDate: Date | null;
}

// Actions
type FlowAction =
    | BaseFlowAction<BuscadorState>
    | { type: 'SET_DATA'; payload: { pros: Professional[]; products: Product[] } }
    | { type: 'SHOW_TOAST'; payload: { title: string; message: string } }
    | { type: 'CLEAR_TOAST' }
    | { type: 'SELECT_PROFESSIONAL'; payload: string | null }
    | { type: 'SELECT_DATE'; payload: Date | null };

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
    },
    selectedProfessionalId: null,
    selectedDate: new Date(),
    ritualCompletion: null
});

// Reducer
const baseReducer = createFlowReducer<BuscadorState>();
const flowReducer = (state: FlowContextState, action: FlowAction): FlowContextState => {
    switch (action.type) {
        case 'TRANSITION': {
            const tempEngine = new BuscadorFlowEngine(state.currentState, [...state.history]);
            const success = tempEngine.transition(action.payload as any); // payload is handled by base if needed, but here we need engine
            if (success) {
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
        case 'BACK': {
            const tempEngine = new BuscadorFlowEngine(state.currentState, [...state.history]);
            if (tempEngine.back()) {
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
        case 'SET_DATA':
            return { ...state, data: action.payload };
        case 'SHOW_TOAST':
            return { ...state, toast: action.payload };
        case 'CLEAR_TOAST':
            return { ...state, toast: null };
        case 'SELECT_PROFESSIONAL':
            return { ...state, selectedProfessionalId: action.payload };
        case 'SELECT_DATE':
            return { ...state, selectedDate: action.payload };
        default:
            return baseReducer(state, action as any) as FlowContextState;
    }
};

// Create Context
const BuscadorFlowContext = createContext<{
    state: FlowContextState;
    go: (target: BuscadorState) => void;
    jump: (target: BuscadorState) => void;
    back: () => void;
    reset: () => void;
    refreshData: () => Promise<void>;
    selectProfessional: (id: string | null) => void;
    selectDate: (date: Date | null) => void;
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
        
        // Immediate visual feedback for gamification
        if (target === 'METAMORPHOSIS_FEEDBACK') {
            dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Karma +10', message: 'Evolução registrada.' }});
        }
        if (target === 'ORACLE_REVEAL') {
            dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Sabedoria Adquirida', message: 'O Oráculo revelou novos véus.' }});
        }
        if (target === 'PAYMENT_SUCCESS') {
            dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Troca Energética', message: 'O fluxo foi concluído com honra.' }});
        }

        dispatch({ type: 'TRANSITION', payload: target });
        dispatch({ type: 'SET_LOADING', payload: false });
    };

    const jump = (target: BuscadorState) => dispatch({ type: 'JUMP', payload: target });
    const back = () => dispatch({ type: 'BACK' });
    const reset = () => dispatch({ type: 'RESET' });
    const selectProfessional = (id: string | null) => dispatch({ type: 'SELECT_PROFESSIONAL', payload: id });
    const selectDate = (date: Date | null) => dispatch({ type: 'SELECT_DATE', payload: date });

    return (
        <BuscadorFlowContext.Provider value={{ state, go, jump, back, reset, refreshData, selectProfessional, selectDate }}>
            {children}
            {state.ritualCompletion && (
                <RitualCompletionCard 
                    title={state.ritualCompletion.title} 
                    message={state.ritualCompletion.message} 
                    onClose={() => dispatch({ type: 'CLEAR_RITUAL' })} 
                />
            )}
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
