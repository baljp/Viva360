
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { BuscadorState, transitions } from './types';
import { BuscadorFlowEngine } from './BuscadorFlowEngine';
import { ZenToast } from '../../components/Common'; // Assuming path correct based on file structure
// Verify imports: Common is at ../../components/Common.tsx ?
// File list says components/Common.tsx exists at ROOT/components/Common.tsx?
// Or ROOT/src/components? Steps 1800 said src/components exists.
// Let's assume absolute imports or relative. 
// If file is at ROOT/src/flow/BuscadorFlowContext.tsx, then components is at ROOT/components (../../components) or ROOT/src/components (../components)?
// Step 1550: "components" is a folder at ROOT. "src" is a folder at ROOT.
// So relative path from "src/flow" to "components" is "../../components".

import { isMockMode } from '../../lib/supabase'; // Assuming lib is at ROOT/lib
// lib is at ROOT/lib. ../../lib/supabase.

// Define Context State
interface FlowContextState {
    currentState: BuscadorState;
    history: BuscadorState[];
    engine: BuscadorFlowEngine;
    isLoading: boolean;
    error: string | null;
    toast: { title: string; message: string } | null;
}

// Actions
type FlowAction =
    | { type: 'TRANSITION'; payload: BuscadorState }
    | { type: 'BACK' }
    | { type: 'RESET' }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SHOW_TOAST'; payload: { title: string; message: string } }
    | { type: 'CLEAR_TOAST' };

// Initial State
const initialState: FlowContextState = {
    currentState: 'START',
    history: [],
    engine: new BuscadorFlowEngine('START'),
    isLoading: false,
    error: null,
    toast: null,
};

// Reducer
const flowReducer = (state: FlowContextState, action: FlowAction): FlowContextState => {
    switch (action.type) {
        case 'TRANSITION':
            const success = state.engine.transition(action.payload);
            if (success) {
                return {
                    ...state,
                    currentState: state.engine.getState(),
                    history: [...state.engine['history']], // Accessing private for context state sync
                    error: null,
                };
            } else {
                return {
                    ...state,
                    error: `Invalid transition from ${state.currentState} to ${action.payload}`,
                };
            }
        case 'BACK':
            const canBack = state.engine.back();
            if (canBack) {
                return {
                    ...state,
                    currentState: state.engine.getState(),
                    history: [...state.engine['history']],
                    error: null,
                };
            }
            return state;
        case 'RESET':
            state.engine.reset();
            return {
                ...state,
                currentState: 'START',
                history: [],
                error: null,
            };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
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
} | undefined>(undefined);

// Provider Component
export const BuscadorFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(flowReducer, initialState);

    // Mock Mode Integration Wrapper
    const go = (target: BuscadorState) => {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Simulate Delay for 'Realistic' Feel in Mock Mode
        const delay = isMockMode ? 800 : 0; 
        
        setTimeout(() => {
             // Gamification Triggers
             if (target === 'METAMORPHOSIS_FEEDBACK') {
                 dispatch({ type: 'SHOW_TOAST', payload: { title: 'Karma +10', message: 'Evolução registrada.' }});
                 // Here we would call api.users.updateKarma(...) in a real app
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
        <BuscadorFlowContext.Provider value={{ state, go, back, reset }}>
            {children}
            {state.toast && (
                <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
                   {/* Temporary Toast if ZenToast not available or needed explicitly here */}
                   {/* Utilizing the logic to render toast in main layout usually, but here simulating side effect */}
                </div>
            )}
            {/* If we want to render Global Toast here we could, but better to expose it to layout */}
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
