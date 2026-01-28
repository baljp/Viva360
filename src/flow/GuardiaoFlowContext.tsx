
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { GuardiaoState } from './guardiaoTypes';
import { GuardiaoFlowEngine } from './GuardiaoFlowEngine';
import { isMockMode } from '../../lib/supabase'; 
import { Appointment, Vacancy, Product, Transaction, Professional, UserRole } from '../../types';
import { api } from '../../services/api';

// Define Context State
interface GuardiaoContextState {
    currentState: GuardiaoState;
    history: GuardiaoState[];
    engine: GuardiaoFlowEngine;
    isLoading: boolean;
    error: string | null;
    notification: { title: string; message: string; type: 'info' | 'success' | 'warning' } | null;
    data: {
        appointments: Appointment[];
        vacancies: Vacancy[];
        myProducts: Product[];
        transactions: Transaction[];
    }
}

// Actions
type FlowAction =
    | { type: 'TRANSITION'; payload: GuardiaoState }
    | { type: 'BACK' }
    | { type: 'RESET' }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_DATA'; payload: { appointments: Appointment[]; vacancies: Vacancy[]; myProducts: Product[]; transactions: Transaction[] } }
    | { type: 'NOTIFY'; payload: { title: string; message: string; type: 'info' | 'success' | 'warning' } }
    | { type: 'CLEAR_NOTIFICATION' };

// Initial State Factory
const createInitialState = (): GuardiaoContextState => ({
    currentState: 'START',
    history: [],
    engine: new GuardiaoFlowEngine('START'),
    isLoading: false,
    error: null,
    notification: null,
    data: {
        appointments: [],
        vacancies: [],
        myProducts: [],
        transactions: [],
    }
});

// Reducer
const flowReducer = (state: GuardiaoContextState, action: FlowAction): GuardiaoContextState => {
    switch (action.type) {
        case 'TRANSITION': {
            const tempEngine = new GuardiaoFlowEngine(state.currentState, [...state.history]);
            const success = tempEngine.transition(action.payload);
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
            const tempEngine = new GuardiaoFlowEngine(state.currentState, [...state.history]);
            tempEngine.back();
            return {
                ...state,
                currentState: tempEngine.currentState,
                history: [...tempEngine.history],
                engine: tempEngine,
                error: null,
            };
        }
        case 'RESET':
            return createInitialState();
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_DATA':
            return { ...state, data: action.payload };
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
    refreshData: (userId: string) => Promise<void>;
} | undefined>(undefined);

export const GuardiaoFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(flowReducer, null, createInitialState);

    const refreshData = async (userId: string) => {
        if (!userId) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const [apts, vacs, prods, txData] = await Promise.all([
                api.appointments.list(userId, UserRole.PROFESSIONAL),
                api.spaces.getVacancies(),
                api.marketplace.listByOwner(userId),
                api.professionals.getFinanceSummary(userId)
            ]);
            dispatch({ 
                type: 'SET_DATA', 
                payload: { 
                    appointments: apts, 
                    vacancies: vacs, 
                    myProducts: prods, 
                    transactions: txData.transactions 
                } 
            });
        } catch (e) {
            console.error('Failed to fetch Guardiao data', e);
            dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados do portal.' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const go = (target: GuardiaoState) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Immediate visual feedback or Notification Hooks
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
    };

    const back = () => dispatch({ type: 'BACK' });
    const reset = () => dispatch({ type: 'RESET' });

    return (
        <GuardiaoFlowContext.Provider value={{ state, go, back, reset, refreshData }}>
            {children}
        </GuardiaoFlowContext.Provider>
    );
};

export const useGuardiaoFlow = () => {
    const context = useContext(GuardiaoFlowContext);
    if (!context) throw new Error('useGuardiaoFlow must be used within GuardiaoFlowProvider');
    return context;
};
