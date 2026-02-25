
import React, { useEffect, useReducer, ReactNode } from 'react';
import { BuscadorState } from './types';
import { BuscadorFlowEngine } from './BuscadorFlowEngine';
import { Professional, Product } from '../../types';
import { api } from '../../services/api';
import { RitualCompletionCard } from '../components/RitualCompletionCard';
import { BaseFlowState, BaseFlowAction, createFlowReducer } from './baseFlow';
import { isInAppMuted } from '../utils/inAppMute';
import { BuscadorFlowContextStore } from './BuscadorFlowContextStore';
import { trackFlowTelemetry } from './flowTelemetry';
import { buildReadFailureCopy, isDegradedReadError } from '../utils/readDegradedUX';

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
    selectedChatRoom: { id: string; name?: string } | null;
    tribeRoomContext: { type: 'support_room' | 'healing_circle'; contextId?: string } | null;
}

// Actions
type FlowAction =
    | BaseFlowAction<BuscadorState>
    | { type: 'SET_DATA'; payload: { pros: Professional[]; products: Product[] } }
    | { type: 'SHOW_TOAST'; payload: { title: string; message: string } }
    | { type: 'CLEAR_TOAST' }
    | { type: 'SELECT_PROFESSIONAL'; payload: string | null }
    | { type: 'SELECT_DATE'; payload: Date | null }
    | { type: 'SELECT_CHAT_ROOM'; payload: { id: string; name?: string } | null }
    | { type: 'SET_TRIBE_ROOM_CONTEXT'; payload: { type: 'support_room' | 'healing_circle'; contextId?: string } | null }
    | { type: 'SHOW_RITUAL'; payload: { title: string; message: string; type?: 'success' | 'info' | 'error' | 'warning' } }
    | { type: 'CLEAR_RITUAL' };

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
    selectedChatRoom: null,
    ritualCompletion: null,
    tribeRoomContext: null,
});

// Reducer
const baseReducer = createFlowReducer<BuscadorState>();
const isFlowTransitionPayload = (payload: unknown): payload is { nextState: BuscadorState; history: BuscadorState[] } =>
    !!payload && typeof payload === 'object' && 'nextState' in payload && 'history' in payload;
const flowReducer = (state: FlowContextState, action: FlowAction): FlowContextState => {
    switch (action.type) {
        case 'TRANSITION': {
            if (isFlowTransitionPayload(action.payload)) {
                return baseReducer(state, action) as FlowContextState;
            }
            const tempEngine = new BuscadorFlowEngine(state.currentState, [...state.history]);
            const success = tempEngine.transition(action.payload); // payload is handled by base if needed, but here we need engine
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
        case 'SELECT_CHAT_ROOM':
            return { ...state, selectedChatRoom: action.payload };
        case 'SET_TRIBE_ROOM_CONTEXT':
            return { ...state, tribeRoomContext: action.payload };
        default:
            return baseReducer(state, action as BaseFlowAction<BuscadorState>) as FlowContextState;
    }
};

// Create Context
export type BuscadorFlowContextValue = {
    state: FlowContextState;
    go: (target: BuscadorState) => void;
    jump: (target: BuscadorState) => void;
    back: () => void;
    reset: () => void;
    refreshData: () => Promise<void>;
    selectProfessional: (id: string | null) => void;
    selectDate: (date: Date | null) => void;
    selectChatRoom: (room: { id: string; name?: string } | null) => void;
    selectTribeRoomContext: (ctx: { type: 'support_room' | 'healing_circle'; contextId?: string } | null) => void;
    notify: (title: string, message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
    clearToast: () => void;
};

const BuscadorFlowContext = BuscadorFlowContextStore as React.Context<BuscadorFlowContextValue | undefined>;

// Provider Component
export const BuscadorFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(flowReducer, null, createInitialState);
    useEffect(() => {
        trackFlowTelemetry({
            profile: 'BUSCADOR',
            flow: 'core',
            action: 'state',
            status: 'state_change',
            to: state.currentState,
        });
    }, [state.currentState]);

    const refreshData = async () => {
        const startedAt = performance.now();
        trackFlowTelemetry({ profile: 'BUSCADOR', flow: 'core', action: 'refreshData', status: 'attempt', from: state.currentState });
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const [prosResult, productsResult] = await Promise.allSettled([
                api.professionals.list(),
                api.marketplace.listAll()
            ]);
            const failedDomains: string[] = [];
            const degradedDomains: string[] = [];
            const nextPros = prosResult.status === 'fulfilled' ? prosResult.value : state.data.pros;
            const nextProducts = productsResult.status === 'fulfilled' ? productsResult.value : state.data.products;

            if (prosResult.status === 'rejected') {
                failedDomains.push('professionals');
                if (isDegradedReadError(prosResult.reason)) degradedDomains.push('professionals');
            }
            if (productsResult.status === 'rejected') {
                failedDomains.push('marketplace');
                if (isDegradedReadError(productsResult.reason)) degradedDomains.push('marketplace');
            }

            dispatch({ type: 'SET_DATA', payload: { pros: nextPros, products: nextProducts } });
            if (failedDomains.length > 0) {
                const copy = buildReadFailureCopy(degradedDomains.length ? degradedDomains : failedDomains, true);
                dispatch({ type: 'SET_ERROR', payload: copy.message });
            } else {
                dispatch({ type: 'SET_ERROR', payload: null });
            }
            trackFlowTelemetry({
                profile: 'BUSCADOR',
                flow: 'core',
                action: 'refreshData',
                status: failedDomains.length > 0 ? 'error' : 'success',
                from: state.currentState,
                durationMs: Math.round(performance.now() - startedAt),
                meta: {
                    pros: nextPros.length,
                    products: nextProducts.length,
                    partial: failedDomains.length > 0,
                    failedDomains,
                },
            });
        } catch (e) {
            console.error('Failed to fetch Buscador data', e);
            const copy = buildReadFailureCopy(['marketplace'], false);
            dispatch({ type: 'SET_ERROR', payload: copy.message });
            trackFlowTelemetry({
                profile: 'BUSCADOR',
                flow: 'core',
                action: 'refreshData',
                status: 'error',
                from: state.currentState,
                durationMs: Math.round(performance.now() - startedAt),
                errorMessage: e instanceof Error ? e.message : 'refreshData failed',
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const go = (target: BuscadorState) => {
        trackFlowTelemetry({
            profile: 'BUSCADOR',
            flow: 'core',
            action: 'go',
            status: 'attempt',
            from: state.currentState,
            to: target,
        });
        dispatch({ type: 'SET_LOADING', payload: true });

        // Immediate visual feedback for gamification
        if (target === 'METAMORPHOSIS_FEEDBACK') {
            dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Karma +10', message: 'Evolução registrada.' } });
        }
        if (target === 'ORACLE_REVEAL') {
            dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Sabedoria Adquirida', message: 'O Oráculo revelou novos véus.' } });
        }
        if (target === 'PAYMENT_SUCCESS') {
            dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Troca Energética', message: 'O fluxo foi concluído com honra.' } });
        }

        dispatch({ type: 'TRANSITION', payload: target });
        dispatch({ type: 'SET_LOADING', payload: false });
    };

    const jump = (target: BuscadorState) => {
        trackFlowTelemetry({ profile: 'BUSCADOR', flow: 'core', action: 'jump', status: 'attempt', from: state.currentState, to: target });
        dispatch({ type: 'JUMP', payload: target });
    };
    const back = () => {
        trackFlowTelemetry({ profile: 'BUSCADOR', flow: 'core', action: 'back', status: 'attempt', from: state.currentState });
        dispatch({ type: 'BACK' });
    };
    const reset = () => {
        trackFlowTelemetry({ profile: 'BUSCADOR', flow: 'core', action: 'reset', status: 'attempt', from: state.currentState, to: 'START' });
        dispatch({ type: 'RESET' });
    };
    const selectProfessional = (id: string | null) => dispatch({ type: 'SELECT_PROFESSIONAL', payload: id });
    const selectDate = (date: Date | null) => dispatch({ type: 'SELECT_DATE', payload: date });
    const selectChatRoom = (room: { id: string; name?: string } | null) => dispatch({ type: 'SELECT_CHAT_ROOM', payload: room });
    const selectTribeRoomContext = (ctx: { type: 'support_room' | 'healing_circle'; contextId?: string } | null) =>
        dispatch({ type: 'SET_TRIBE_ROOM_CONTEXT', payload: ctx });
    const notify = (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
        // Retiro Offline silences in-app notifications (toasts/ritual cards) while active.
        if (isInAppMuted()) return;
        dispatch({ type: 'SHOW_RITUAL', payload: { title, message, type } });
    };

    return (
        <BuscadorFlowContext.Provider value={{
            state, go, jump, back, reset, refreshData, selectProfessional, selectDate, selectChatRoom, selectTribeRoomContext, notify,
            clearToast: () => dispatch({ type: 'CLEAR_TOAST' })
        }}>
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
