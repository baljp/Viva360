
export interface BaseFlowState<T> {
    currentState: T;
    history: T[];
    isLoading: boolean;
    error: string | null;
    ritualCompletion: { title: string; message: string } | null;
}

export type BaseFlowAction<T> =
    | { type: 'TRANSITION'; payload: T | { nextState: T; history: T[] } }
    | { type: 'BACK'; payload?: { prevState: T; history: T[] } }
    | { type: 'RESET'; payload?: BaseFlowState<T> }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SHOW_RITUAL'; payload: { title: string; message: string } }
    | { type: 'CLEAR_RITUAL' }
    | { type: 'JUMP'; payload: T };

export const createFlowReducer = <T>() => {
    const isTransitionPayload = (payload: unknown): payload is { nextState: T; history: T[] } => {
        if (payload == null) return false;
        if (typeof payload !== 'object') return false;
        return ('nextState' in payload) && ('history' in payload);
    };
    return (state: BaseFlowState<T>, action: BaseFlowAction<T>): BaseFlowState<T> => {
        switch (action.type) {
            case 'TRANSITION':
                if (isTransitionPayload(action.payload)) {
                    return {
                        ...state,
                        currentState: action.payload.nextState,
                        history: action.payload.history,
                        error: null,
                    };
                }
                return state; // Should be handled by specific reducer if simple T
            case 'BACK':
                if (action.payload) {
                    return {
                        ...state,
                        currentState: action.payload.prevState,
                        history: action.payload.history,
                        error: null,
                    };
                }
                return state;
            case 'RESET':
                return action.payload || state;
            case 'SET_ERROR':
                return { ...state, error: action.payload };
            case 'SET_LOADING':
                return { ...state, isLoading: action.payload };
            case 'SHOW_RITUAL':
                return { ...state, ritualCompletion: action.payload };
            case 'CLEAR_RITUAL':
                return { ...state, ritualCompletion: null };
            case 'JUMP':
                return {
                    ...state,
                    currentState: action.payload as T,
                    history: [...state.history, state.currentState],
                    error: null
                };
            default:
                return state;
        }
    };
};
