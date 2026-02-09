
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { GuardiaoState } from './guardiaoTypes';
import { GuardiaoFlowEngine } from './GuardiaoFlowEngine';
import { Appointment, Vacancy, Product, Transaction, Professional, UserRole } from '../../types';
import { api } from '../../services/api';
import { RitualCompletionCard } from '../components/RitualCompletionCard';
import { BaseFlowState, BaseFlowAction, createFlowReducer } from './baseFlow';

// Define Context State
interface GuardiaoContextState extends BaseFlowState<GuardiaoState> {
    engine: GuardiaoFlowEngine;
    data: {
        appointments: Appointment[];
        vacancies: Vacancy[];
        myProducts: Product[];
        transactions: Transaction[];
    };
    notification: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null;
    selectedAppointment?: Appointment;
    selectedPatient?: { id: string; name?: string } | null;
}

// Actions
type FlowAction =
    | BaseFlowAction<GuardiaoState>
    | { type: 'SET_DATA'; payload: { appointments: Appointment[]; vacancies: Vacancy[]; myProducts: Product[]; transactions: Transaction[] } }
    | { type: 'NOTIFY'; payload: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' } }
    | { type: 'CLEAR_NOTIFICATION' }
    | { type: 'SELECT_APPOINTMENT'; payload: Appointment }
    | { type: 'SELECT_PATIENT'; payload: { id: string; name?: string } | null };

// Initial State Factory
const createInitialState = (): GuardiaoContextState => ({
    currentState: 'START',
    history: [],
    engine: new GuardiaoFlowEngine('START'),
    isLoading: false,
    error: null,
    notification: null,
    selectedPatient: null,
    data: {
        appointments: [],
        vacancies: [],
        myProducts: [],
        transactions: [],
    },
    ritualCompletion: null
});

// Reducer
const baseReducer = createFlowReducer<GuardiaoState>();
const flowReducer = (state: GuardiaoContextState, action: FlowAction): GuardiaoContextState => {
    switch (action.type) {
        case 'TRANSITION': {
            const tempEngine = new GuardiaoFlowEngine(state.currentState, [...state.history]);
            const success = tempEngine.transition(action.payload as any);
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
        case 'SET_DATA':
            return { ...state, data: action.payload };
        case 'NOTIFY':
            return { ...state, notification: action.payload };
        case 'CLEAR_NOTIFICATION':
            return { ...state, notification: null };
        case 'SELECT_APPOINTMENT':
            return { ...state, selectedAppointment: action.payload };
        case 'SELECT_PATIENT':
            return { ...state, selectedPatient: action.payload };
        default:
            return baseReducer(state, action as any) as GuardiaoContextState;
    }
}

const GuardiaoFlowContext = createContext<{
    state: GuardiaoContextState;
    go: (target: GuardiaoState) => void;
    back: () => void;
    reset: () => void;
    refreshData: (userId: string) => Promise<void>;
    notify: (title: string, message: string, type?: 'info' | 'success' | 'warning') => void;
    selectAppointment: (apt: Appointment) => void;
    selectPatient: (payload: { id: string; name?: string } | null) => void;
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
            dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Elo Estabelecido', message: 'Seu chamado ecoou na teia.' } });
        }
        if (target === 'SANTUARIO_CONTRACT') {
             dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Raizes Firmas', message: 'Seu vínculo com o Santuário floresceu.' } });
        }
        if (target === 'VAGA_APPLY') {
             dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Intenção Semeada', message: 'Sua prontidão foi registrada no portal.' } });
        }

        dispatch({ type: 'TRANSITION', payload: target });
        dispatch({ type: 'SET_LOADING', payload: false });
    };

    const back = () => dispatch({ type: 'BACK' });
    const reset = () => dispatch({ type: 'RESET' });

    const notify = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        dispatch({ type: 'NOTIFY', payload: { title, message, type } });
        // Auto-clear notification after 4 seconds
        setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 4000);
    };

    const selectAppointment = (apt: Appointment) => dispatch({ type: 'SELECT_APPOINTMENT', payload: apt });
    const selectPatient = (payload: { id: string; name?: string } | null) => dispatch({ type: 'SELECT_PATIENT', payload });

    return (
        <GuardiaoFlowContext.Provider value={{ state, go, back, reset, refreshData, notify, selectAppointment, selectPatient }}>
            {children}
            {state.ritualCompletion && (
                <RitualCompletionCard 
                    title={state.ritualCompletion.title} 
                    message={state.ritualCompletion.message} 
                    onClose={() => dispatch({ type: 'CLEAR_RITUAL' })} 
                />
            )}
            {state.notification && (
                <div className="fixed top-20 left-0 right-0 z-[1000] px-4 animate-in slide-in-from-top duration-500">
                     <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
                         state.notification.type === 'success' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-900' :
                         state.notification.type === 'error' ? 'bg-rose-50/90 border-rose-100 text-rose-900' :
                         'bg-white/90 border-nature-100 text-nature-900'
                     }`}>
                         <Sparkles size={20} className={state.notification.type === 'success' ? 'text-emerald-500' : 'text-nature-400'} />
                         <div className="flex-1">
                             <h4 className="font-bold text-xs">{state.notification.title}</h4>
                             <p className="text-[10px] opacity-70">{state.notification.message}</p>
                         </div>
                         <button onClick={() => dispatch({ type: 'CLEAR_NOTIFICATION' })} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
                             <X size={16} />
                         </button>
                     </div>
                </div>
            )}
        </GuardiaoFlowContext.Provider>
    );
};

export const useGuardiaoFlow = () => {
    const context = useContext(GuardiaoFlowContext);
    if (!context) throw new Error('useGuardiaoFlow must be used within GuardiaoFlowProvider');
    return context;
};
