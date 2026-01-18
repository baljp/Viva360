import { useState, useCallback } from 'react';
import { apiFetch } from '../utils/api';

interface ApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

export function useApi<T>() {
    const [state, setState] = useState<ApiState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const request = useCallback(async (endpoint: string, options?: RequestInit) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const data = await apiFetch<T>(endpoint, options);
            setState({ data, loading: false, error: null });
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setState({ data: null, loading: false, error: errorMessage });
            throw err;
        }
    }, []);

    return { ...state, request };
}
