import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Sparkles, X } from 'lucide-react';
import { SantuarioState } from './santuarioTypes';
import { SantuarioFlowEngine } from './SantuarioFlowEngine';
import { isMockMode } from '../../lib/supabase';
import { api } from '../../services/api';
import { SpaceRoom, Professional, Vacancy, Transaction, Product } from '../../types';
import { RitualCompletionCard } from '../components/RitualCompletionCard';
import { BaseFlowState, BaseFlowAction, createFlowReducer } from './baseFlow';

interface SantuarioContextState extends BaseFlowState<SantuarioState> {
    engine: SantuarioFlowEngine;
    notification: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null;
    // Data State
    data: {
        rooms: SpaceRoom[];
        team: Professional[];
        vacancies: Vacancy[];
        transactions: Transaction[];
        myProducts: Product[];
    };
    selectedProId: string | null;
    // Mock Data for Admin Dashboard (standardized)
    adminStats: {
        activePros: number;
        totalPatients: number;
        occupancyRate: number;
        monthlyRevenue: number;
    };
}

type FlowAction =
    | BaseFlowAction<SantuarioState>
    | { type: 'SET_DATA'; payload: { rooms: SpaceRoom[]; team: Professional[]; vacancies: Vacancy[]; transactions: Transaction[]; myProducts: Product[] } }
    | { type: 'NOTIFY'; payload: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' } }
    | { type: 'SELECT_PRO'; payload: string | null }
    | { type: 'CLEAR_NOTIFICATION' };

const createInitialState = (): SantuarioContextState => ({
    currentState: 'START',
    history: [],
    engine: new SantuarioFlowEngine('START'),
    isLoading: false,
    error: null,
    notification: null,
    data: {
        rooms: [],
        team: [],
        vacancies: [],
        transactions: [],
        myProducts: []
    },
    selectedProId: null,
    adminStats: {
        activePros: 12,
        totalPatients: 450,
        occupancyRate: 85,
        monthlyRevenue: 125000
    },
    ritualCompletion: null
});

const baseReducer = createFlowReducer<SantuarioState>();
const flowReducer = (state: SantuarioContextState, action: FlowAction): SantuarioContextState => {
    switch (action.type) {
        case 'TRANSITION': {
            const tempEngine = new SantuarioFlowEngine(state.currentState, [...state.history]);
            const success = tempEngine.transition(action.payload as any);
            
            if (success) {
                return {
                    ...state,
                    currentState: tempEngine.currentState,
                    history: [...tempEngine.history],
                    engine: tempEngine,
                    error: null
                };
            }
            return state;
        }
        case 'BACK': {
            const tempEngine = new SantuarioFlowEngine(state.currentState, [...state.history]);
            const success = tempEngine.back();
            if (success) {
                return {
                    ...state,
                    currentState: tempEngine.currentState,
                    history: [...tempEngine.history],
                    engine: tempEngine,
                    error: null
                };
            }
            return state;
        }
        case 'SET_DATA':
            return { ...state, data: action.payload };
        case 'NOTIFY':
            return { ...state, notification: action.payload };
        case 'SELECT_PRO':
            return { ...state, selectedProId: action.payload };
        case 'CLEAR_NOTIFICATION':
            return { ...state, notification: null };
        default:
            return baseReducer(state, action as any) as SantuarioContextState;
    }
};

const SantuarioFlowContext = createContext<{
    state: SantuarioContextState;
    go: (target: SantuarioState) => void;
    back: () => void;
    reset: () => void;
    refreshData: (userId: string) => Promise<void>;
    selectPro: (proId: string | null) => void;
    notify: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
} | undefined>(undefined);

export const SantuarioFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(flowReducer, null, createInitialState);

    const refreshData = async (userId: string) => {
        if (!userId) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const [r, t, v, tx, prods] = await Promise.all([
                  api.spaces.getRooms(userId),
                  api.spaces.getTeam(userId),
                  api.spaces.getVacancies(),
                  api.spaces.getTransactions(userId),
                  api.marketplace.listByOwner(userId)
            ]);
            
            dispatch({
                type: 'SET_DATA',
                payload: {
                    rooms: r,
                    team: t, 
                    vacancies: v,
                    transactions: tx,
                    myProducts: prods
                }
            });
        } catch (e) {
            console.error('Failed to fetch Santuario data', e);
            dispatch({ type: 'SET_ERROR', payload: 'Erro ao conectar aos altares.' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const go = (target: SantuarioState) => {
        console.log(`[SantuarioFlow] go('${target}') called. Current: ${state.currentState}`);
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const delay = isMockMode ? 500 : 0;
        
        setTimeout(() => {
            if (target === 'FINANCE_REPASSES') {
                dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Fluxo Calculado', message: 'Os repasses do santuário foram harmonizados.' } });
            }
            if (target === 'VAGA_CREATE') {
                dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Nova Semente', message: 'Uma oportunidade de expansão foi lançada.' } });
            }

            dispatch({ type: 'TRANSITION', payload: target });
            dispatch({ type: 'SET_LOADING', payload: false });
        }, delay);
    };

    const back = () => dispatch({ type: 'BACK' });
    const reset = () => dispatch({ type: 'RESET' });

    const selectPro = (proId: string | null) => {
        dispatch({ type: 'SELECT_PRO', payload: proId });
    };

    const notify = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        dispatch({ type: 'NOTIFY', payload: { title, message, type } });
        setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 4000);
    };

    return (
        <SantuarioFlowContext.Provider value={{ state, go, back, reset, refreshData, selectPro, notify }}>
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
        </SantuarioFlowContext.Provider>
    );
};

export const useSantuarioFlow = () => {
    const context = useContext(SantuarioFlowContext);
    if (!context) throw new Error('useSantuarioFlow must be used within SantuarioFlowProvider');
    return context;
};
