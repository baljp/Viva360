
import React, { useReducer, ReactNode, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { GuardiaoState } from './guardiaoTypes';
import { GuardiaoFlowEngine } from './GuardiaoFlowEngine';
import { Appointment, Vacancy, Product, Transaction, Professional, UserRole } from '../../types';
import { api } from '../../services/api';
import { RitualCompletionCard } from '../components/RitualCompletionCard';
import { BaseFlowState, BaseFlowAction, createFlowReducer } from './baseFlow';
import { GuardiaoFlowContextStore } from './GuardiaoFlowContextStore';
import { trackFlowTelemetry } from './flowTelemetry';
import { buildReadFailureCopy, isDegradedReadError } from '../utils/readDegradedUX';
import { useAppToast } from '../contexts/AppToastContext';

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
    selectedPatient?: { id: string; name?: string; mood?: string; sessions?: number; phone?: string; karma?: number } | null;
    selectedChatRoom?: { id: string; name?: string } | null;
    selectedSantuario?: { id: string; name?: string; phone?: string; address?: string; city?: string; image?: string; rating?: number; description?: string } | null;
}

// Actions
type FlowAction =
    | BaseFlowAction<GuardiaoState>
    | { type: 'SET_DATA'; payload: { appointments: Appointment[]; vacancies: Vacancy[]; myProducts: Product[]; transactions: Transaction[] } }
    | { type: 'NOTIFY'; payload: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' } }
    | { type: 'CLEAR_NOTIFICATION' }
    | { type: 'SELECT_APPOINTMENT'; payload: Appointment }
    | { type: 'SELECT_PATIENT'; payload: { id: string; name?: string; mood?: string; sessions?: number; phone?: string; karma?: number } | null }
    | { type: 'SELECT_CHAT_ROOM'; payload: { id: string; name?: string } | null }
    | { type: 'SELECT_SANTUARIO'; payload: { id: string; name?: string; phone?: string; address?: string; city?: string; image?: string; rating?: number; description?: string } | null }
    | { type: 'UPDATE_APPOINTMENT'; payload: Appointment };

// Initial State Factory
const createInitialState = (): GuardiaoContextState => ({
    currentState: 'START',
    history: [],
    engine: new GuardiaoFlowEngine('START'),
    isLoading: false,
    error: null,
    notification: null,
    selectedPatient: null,
    selectedChatRoom: null,
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
const isGuardiaoTransitionPayload = (payload: unknown): payload is { nextState: GuardiaoState; history: GuardiaoState[] } =>
    !!payload && typeof payload === 'object' && 'nextState' in payload && 'history' in payload;
const flowReducer = (state: GuardiaoContextState, action: FlowAction): GuardiaoContextState => {
    switch (action.type) {
        case 'TRANSITION': {
            if (isGuardiaoTransitionPayload(action.payload)) {
                return baseReducer(state, action) as GuardiaoContextState;
            }
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
        case 'SET_DATA':
            return { ...state, data: action.payload };
        case 'NOTIFY':
            return { ...state, notification: action.payload };
        case 'CLEAR_NOTIFICATION':
            return { ...state, notification: null };
        case 'SELECT_APPOINTMENT':
            return { ...state, selectedAppointment: action.payload };
        case 'UPDATE_APPOINTMENT':
            return {
                ...state,
                data: {
                    ...state.data,
                    appointments: state.data.appointments.map(a => a.id === action.payload.id ? action.payload : a)
                }
            };
        case 'SELECT_PATIENT':
            return { ...state, selectedPatient: action.payload };
        case 'SELECT_CHAT_ROOM':
            return { ...state, selectedChatRoom: action.payload };
        default:
            return baseReducer(state, action as BaseFlowAction<GuardiaoState>) as GuardiaoContextState;
    }
}

export type GuardiaoFlowContextValue = {
    state: GuardiaoContextState;
    go: (target: GuardiaoState) => void;
    jump: (target: GuardiaoState) => void;
    back: () => void;
    reset: () => void;
    refreshData: (userId: string) => Promise<void>;
    notify: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    selectAppointment: (apt: Appointment) => void;
    updateAppointment: (apt: Appointment) => void;
    selectPatient: (payload: { id: string; name?: string; mood?: string; sessions?: number; phone?: string; karma?: number } | null) => void;
    selectChatRoom: (payload: { id: string; name?: string } | null) => void;
    selectSantuario: (payload: { id: string; name?: string; phone?: string; address?: string; city?: string; image?: string; rating?: number; description?: string } | null) => void;
};

const GuardiaoFlowContext = GuardiaoFlowContextStore as React.Context<GuardiaoFlowContextValue | undefined>;

export const GuardiaoFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(flowReducer, null, createInitialState);
    const { showToast } = useAppToast();

    useEffect(() => {
        trackFlowTelemetry({
            profile: 'GUARDIAO',
            flow: 'core',
            action: 'state',
            status: 'state_change',
            to: state.currentState,
        });
    }, [state.currentState]);

    const pushNotification = (payload: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => {
        showToast(payload);
    };

    const refreshData = async (userId: string) => {
        if (!userId) return;
        const startedAt = performance.now();
        trackFlowTelemetry({ profile: 'GUARDIAO', flow: 'core', action: 'refreshData', status: 'attempt', from: state.currentState, meta: { userId } });
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const [aptsResult, vacsResult, prodsResult, txResult] = await Promise.allSettled([
                api.appointments.list(userId, UserRole.PROFESSIONAL),
                api.spaces.getVacancies(),
                api.marketplace.listByOwner(userId),
                api.professionals.getFinanceSummary(userId)
            ]);
            const failedDomains: string[] = [];
            const degradedDomains: string[] = [];
            if (aptsResult.status === 'rejected') failedDomains.push('appointments');
            if (vacsResult.status === 'rejected') failedDomains.push('vacancies');
            if (prodsResult.status === 'rejected') {
                failedDomains.push('marketplace');
                if (isDegradedReadError(prodsResult.reason)) degradedDomains.push('marketplace');
            }
            if (txResult.status === 'rejected') {
                failedDomains.push('finance');
                if (isDegradedReadError(txResult.reason)) degradedDomains.push('finance');
            }
            dispatch({
                type: 'SET_DATA',
                payload: {
                    appointments: aptsResult.status === 'fulfilled' ? aptsResult.value : state.data.appointments,
                    vacancies: vacsResult.status === 'fulfilled' ? vacsResult.value : state.data.vacancies,
                    myProducts: prodsResult.status === 'fulfilled' ? prodsResult.value : state.data.myProducts,
                    transactions: txResult.status === 'fulfilled' ? txResult.value.transactions : state.data.transactions
                }
            });
            if (failedDomains.length > 0) {
                const copy = buildReadFailureCopy(degradedDomains.length ? degradedDomains : failedDomains, true);
                dispatch({ type: 'SET_ERROR', payload: copy.message });
                pushNotification({ title: copy.title, message: copy.message, type: 'warning' });
            } else {
                dispatch({ type: 'SET_ERROR', payload: null });
            }
            trackFlowTelemetry({
                profile: 'GUARDIAO',
                flow: 'core',
                action: 'refreshData',
                status: failedDomains.length > 0 ? 'error' : 'success',
                from: state.currentState,
                durationMs: Math.round(performance.now() - startedAt),
                meta: {
                    appointments: aptsResult.status === 'fulfilled' ? aptsResult.value.length : state.data.appointments.length,
                    vacancies: vacsResult.status === 'fulfilled' ? vacsResult.value.length : state.data.vacancies.length,
                    myProducts: prodsResult.status === 'fulfilled' ? prodsResult.value.length : state.data.myProducts.length,
                    partial: failedDomains.length > 0,
                    failedDomains,
                },
            });
        } catch (e) {
            console.error('Failed to fetch Guardiao data', e);
            const copy = buildReadFailureCopy(['marketplace', 'finance'], false);
            dispatch({ type: 'SET_ERROR', payload: copy.message });
            pushNotification({ title: copy.title, message: copy.message, type: 'error' });
            trackFlowTelemetry({
                profile: 'GUARDIAO',
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

    const go = (target: GuardiaoState) => {
        trackFlowTelemetry({ profile: 'GUARDIAO', flow: 'core', action: 'go', status: 'attempt', from: state.currentState, to: target });
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

    // Allows deep linking / sidebar navigation to realign the flow even when engine transition graph is strict.
    const jump = (target: GuardiaoState) => {
        trackFlowTelemetry({ profile: 'GUARDIAO', flow: 'core', action: 'jump', status: 'attempt', from: state.currentState, to: target });
        dispatch({ type: 'JUMP', payload: target });
    };

    const back = () => {
        trackFlowTelemetry({ profile: 'GUARDIAO', flow: 'core', action: 'back', status: 'attempt', from: state.currentState });
        dispatch({ type: 'BACK' });
    };
    const reset = () => {
        trackFlowTelemetry({ profile: 'GUARDIAO', flow: 'core', action: 'reset', status: 'attempt', from: state.currentState, to: 'START' });
        dispatch({ type: 'RESET' });
    };

    const notify = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        pushNotification({ title, message, type });
    };

    const selectAppointment = (apt: Appointment) => dispatch({ type: 'SELECT_APPOINTMENT', payload: apt });
    const updateAppointment = (apt: Appointment) => dispatch({ type: 'UPDATE_APPOINTMENT', payload: apt });
    const selectPatient = (payload: { id: string; name?: string } | null) => dispatch({ type: 'SELECT_PATIENT', payload });
    const selectChatRoom = (payload: { id: string; name?: string } | null) => dispatch({ type: 'SELECT_CHAT_ROOM', payload });
    const selectSantuario = (payload: { id: string; name?: string; phone?: string; address?: string; city?: string; image?: string; rating?: number; description?: string } | null) => dispatch({ type: 'SELECT_SANTUARIO', payload });

    return (
        <GuardiaoFlowContext.Provider value={{ state, go, jump, back, reset, refreshData, notify, selectAppointment, updateAppointment, selectPatient, selectChatRoom, selectSantuario }}>
            {children}
            {state.ritualCompletion && (
                <RitualCompletionCard
                    title={state.ritualCompletion.title}
                    message={state.ritualCompletion.message}
                    onClose={() => dispatch({ type: 'CLEAR_RITUAL' })}
                />
            )}
        </GuardiaoFlowContext.Provider>
    );
};
