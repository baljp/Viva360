import React, { useReducer, ReactNode } from 'react';
import { Sparkles, X } from 'lucide-react';
import { SantuarioState } from './santuarioTypes';
import { SantuarioFlowEngine } from './SantuarioFlowEngine';
import { api } from '../../services/api';
import { SpaceRoom, Professional, Vacancy, Transaction, Product } from '../../types';
import { RitualCompletionCard } from '../components/RitualCompletionCard';
import { BaseFlowState, BaseFlowAction, createFlowReducer } from './baseFlow';
import { SantuarioFlowContextStore } from './SantuarioFlowContextStore';
import { trackFlowTelemetry } from './flowTelemetry';
import { buildReadFailureCopy, isDegradedReadError } from '../utils/readDegradedUX';

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
    selectedRoomId: string | null;
    selectedPatientId: string | null;
    selectedEventId: string | null;
    selectedChatRoom: { id: string; name?: string } | null;
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
    | { type: 'SELECT_ROOM'; payload: string | null }
    | { type: 'SELECT_PATIENT'; payload: string | null }
    | { type: 'SELECT_EVENT'; payload: string | null }
    | { type: 'SELECT_CHAT_ROOM'; payload: { id: string; name?: string } | null }
    | { type: 'SET_ADMIN_STATS'; payload: { activePros: number; totalPatients: number; occupancyRate: number; monthlyRevenue: number } }
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
    selectedRoomId: null,
    selectedPatientId: null,
    selectedEventId: null,
    selectedChatRoom: null,
    adminStats: {
        // Derived from real data in refreshData - not hardcoded
        activePros: 0,
        totalPatients: 0,
        occupancyRate: 0,
        monthlyRevenue: 0
    },
    ritualCompletion: null
});

const baseReducer = createFlowReducer<SantuarioState>();
const isSantuarioTransitionPayload = (payload: unknown): payload is { nextState: SantuarioState; history: SantuarioState[] } =>
    !!payload && typeof payload === 'object' && 'nextState' in payload && 'history' in payload;
const flowReducer = (state: SantuarioContextState, action: FlowAction): SantuarioContextState => {
    switch (action.type) {
        case 'TRANSITION': {
            if (isSantuarioTransitionPayload(action.payload)) {
                return baseReducer(state, action) as SantuarioContextState;
            }
            const tempEngine = new SantuarioFlowEngine(state.currentState, [...state.history]);
            const success = tempEngine.transition(action.payload);
            
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
        case 'SELECT_ROOM':
            return { ...state, selectedRoomId: action.payload };
        case 'SELECT_PATIENT':
            return { ...state, selectedPatientId: action.payload };
        case 'SELECT_EVENT':
            return { ...state, selectedEventId: action.payload };
        case 'SELECT_CHAT_ROOM':
            return { ...state, selectedChatRoom: action.payload };
        case 'SET_ADMIN_STATS':
            return { ...state, adminStats: action.payload };
        case 'CLEAR_NOTIFICATION':
            return { ...state, notification: null };
        default:
            return baseReducer(state, action as BaseFlowAction<SantuarioState>) as SantuarioContextState;
    }
};

export type SantuarioFlowContextValue = {
    state: SantuarioContextState;
    go: (target: SantuarioState) => void;
    jump: (target: SantuarioState) => void;
    back: () => void;
    reset: () => void;
    refreshData: (userId: string) => Promise<void>;
    selectPro: (proId: string | null) => void;
    selectRoom: (roomId: string | null) => void;
    selectPatient: (patientId: string | null) => void;
    selectEvent: (eventId: string | null) => void;
    selectChatRoom: (chatRoom: { id: string; name?: string } | null) => void;
    notify: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
};

const SantuarioFlowContext = SantuarioFlowContextStore as React.Context<SantuarioFlowContextValue | undefined>;

export const SantuarioFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(flowReducer, null, createInitialState);
    React.useEffect(() => {
        trackFlowTelemetry({
            profile: 'SANTUARIO',
            flow: 'core',
            action: 'state',
            status: 'state_change',
            to: state.currentState,
        });
    }, [state.currentState]);

    const pushNotification = (payload: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => {
        dispatch({ type: 'NOTIFY', payload });
        setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 4000);
    };

    const refreshData = async (userId: string) => {
        if (!userId) return;
        const startedAt = performance.now();
        trackFlowTelemetry({ profile: 'SANTUARIO', flow: 'core', action: 'refreshData', status: 'attempt', from: state.currentState, meta: { userId } });
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const [rResult, tResult, vResult, txResult, prodsResult] = await Promise.allSettled([
                  api.spaces.getRooms(),
                  api.spaces.getTeam(),
                  api.spaces.getVacancies(),
                  api.spaces.getTransactions(),
                  api.marketplace.listByOwner(userId)
            ]);
            const failedDomains: string[] = [];
            const degradedDomains: string[] = [];
            if (rResult.status === 'rejected') failedDomains.push('spaces');
            if (tResult.status === 'rejected') failedDomains.push('team');
            if (vResult.status === 'rejected') failedDomains.push('vacancies');
            if (txResult.status === 'rejected') {
                failedDomains.push('finance');
                if (isDegradedReadError(txResult.reason)) degradedDomains.push('finance');
            }
            if (prodsResult.status === 'rejected') {
                failedDomains.push('marketplace');
                if (isDegradedReadError(prodsResult.reason)) degradedDomains.push('marketplace');
            }
            
            const realTeam = tResult.status === 'fulfilled' ? tResult.value : state.data.team;
            const realTx = txResult.status === 'fulfilled' ? txResult.value : state.data.transactions;
            const realRooms = rResult.status === 'fulfilled' ? rResult.value : state.data.rooms;
            dispatch({
                type: 'SET_DATA',
                payload: {
                    rooms: realRooms,
                    team: realTeam,
                    vacancies: vResult.status === 'fulfilled' ? vResult.value : state.data.vacancies,
                    transactions: realTx,
                    myProducts: prodsResult.status === 'fulfilled' ? prodsResult.value : state.data.myProducts
                }
            });
            // Derive adminStats from real data
            const incomeTotal = Array.isArray(realTx)
                ? realTx.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount || 0), 0)
                : 0;
            const occupiedRooms = Array.isArray(realRooms)
                ? realRooms.filter((r: any) => String(r.status || '').toLowerCase() === 'occupied').length
                : 0;
            const occupancyRate = realRooms.length > 0 ? Math.round((occupiedRooms / realRooms.length) * 100) : 0;
            dispatch({
                type: 'SET_ADMIN_STATS',
                payload: {
                    activePros: Array.isArray(realTeam) ? realTeam.length : 0,
                    totalPatients: 0, // requires dedicated endpoint
                    occupancyRate,
                    monthlyRevenue: Math.round(incomeTotal),
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
                profile: 'SANTUARIO',
                flow: 'core',
                action: 'refreshData',
                status: failedDomains.length > 0 ? 'error' : 'success',
                from: state.currentState,
                durationMs: Math.round(performance.now() - startedAt),
                meta: {
                    rooms: rResult.status === 'fulfilled' ? rResult.value.length : state.data.rooms.length,
                    team: tResult.status === 'fulfilled' ? tResult.value.length : state.data.team.length,
                    vacancies: vResult.status === 'fulfilled' ? vResult.value.length : state.data.vacancies.length,
                    products: prodsResult.status === 'fulfilled' ? prodsResult.value.length : state.data.myProducts.length,
                    partial: failedDomains.length > 0,
                    failedDomains,
                },
            });
        } catch (e) {
            console.error('Failed to fetch Santuario data', e);
            const copy = buildReadFailureCopy(['marketplace', 'finance'], false);
            dispatch({ type: 'SET_ERROR', payload: copy.message });
            pushNotification({ title: copy.title, message: copy.message, type: 'error' });
            trackFlowTelemetry({
                profile: 'SANTUARIO',
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

    const go = (target: SantuarioState) => {
        trackFlowTelemetry({ profile: 'SANTUARIO', flow: 'core', action: 'go', status: 'attempt', from: state.currentState, to: target });
        dispatch({ type: 'SET_LOADING', payload: true });
        
        if (target === 'FINANCE_REPASSES') {
            dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Fluxo Calculado', message: 'Os repasses do santuário foram harmonizados.' } });
        }
        if (target === 'VAGA_CREATE') {
            dispatch({ type: 'SHOW_RITUAL', payload: { title: 'Nova Semente', message: 'Uma oportunidade de expansão foi lançada.' } });
        }

        dispatch({ type: 'TRANSITION', payload: target });
        dispatch({ type: 'SET_LOADING', payload: false });
    };

    const jump = (target: SantuarioState) => {
        trackFlowTelemetry({ profile: 'SANTUARIO', flow: 'core', action: 'jump', status: 'attempt', from: state.currentState, to: target });
        dispatch({ type: 'JUMP', payload: target });
    };

    const back = () => {
        trackFlowTelemetry({ profile: 'SANTUARIO', flow: 'core', action: 'back', status: 'attempt', from: state.currentState });
        dispatch({ type: 'BACK' });
    };
    const reset = () => {
        trackFlowTelemetry({ profile: 'SANTUARIO', flow: 'core', action: 'reset', status: 'attempt', from: state.currentState, to: 'START' });
        dispatch({ type: 'RESET' });
    };

    const selectPro = (proId: string | null) => {
        dispatch({ type: 'SELECT_PRO', payload: proId });
    };

    const selectRoom = (roomId: string | null) => {
        dispatch({ type: 'SELECT_ROOM', payload: roomId });
    };

    const selectPatient = (patientId: string | null) => {
        dispatch({ type: 'SELECT_PATIENT', payload: patientId });
    };

    const selectEvent = (eventId: string | null) => {
        dispatch({ type: 'SELECT_EVENT', payload: eventId });
    };

    const selectChatRoom = (chatRoom: { id: string; name?: string } | null) => {
        dispatch({ type: 'SELECT_CHAT_ROOM', payload: chatRoom });
    };

    const notify = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        pushNotification({ title, message, type });
    };

    return (
        <SantuarioFlowContext.Provider value={{ state, go, jump, back, reset, refreshData, selectPro, selectRoom, selectPatient, selectEvent, selectChatRoom, notify }}>
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
