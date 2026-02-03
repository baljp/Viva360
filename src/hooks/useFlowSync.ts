import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useFlowSync = (
    flow: any, 
    viewState: string,
    baseRoute: string,
    targetMap: Record<string, string>,
    clusters?: Record<string, string[]>
) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isNavigating = useRef(false);

    // Sync Router View -> Flow State (Deep Linking)
    useEffect(() => {
        if (!flow || !flow.state) return;
        
        const currentState = flow.state.currentState;
        
        // 1. Check Clusters (if we are already in a valid sub-state, don't force reset)
        if (clusters) {
            const allowedStates = clusters[viewState];
            const isAlreadyInCluster = allowedStates?.includes(currentState);
            if (isAlreadyInCluster) return;
        }

        // 2. Target State Check
        const target = targetMap[viewState];
        if (target && currentState !== target) {
            // Prevent loop if we just came from there? No, this is triggered by viewState change (user clicked tab)
            // If flow has jump (Buscador), use it. Otherwise go.
            if (flow.jump) {
                flow.jump(target);
            } else {
                // For Pro/Space, some states like 'START' trigger this
                if (currentState === 'START' || currentState === 'DASHBOARD' || currentState === 'EXEC_DASHBOARD') {
                     flow.go(target);
                } else {
                     // Check if valid transition exists? Flow engine handles it usually.
                     flow.go(target);
                }
            }
        }
    }, [viewState, flow, targetMap, clusters]);

    // Sync Flow -> Router (Navigation URL update)
    useEffect(() => {
         if (!flow || !flow.state) return;
         const currentState = flow.state.currentState;
         
         const pathSegment = currentState.toLowerCase().replace(/_/g, '-');
         const targetPath = `${baseRoute}/${pathSegment}`;
         
         if (location.pathname !== targetPath) {
             isNavigating.current = true;
             // navigate(targetPath, { replace: true });
             // Actually, we shouldn't force navigate generic URL for all states 
             // because some states might map to the same URL or specific sub-urls.
             // But for now, Viva360 uses flat mapping logic mostly.
             // In ClientViews original code: 
             // const targetPath = `/client/${flow.state.currentState.toLowerCase().replace(/_/g, '-')}`;
             // if (location.pathname !== targetPath) navigate(targetPath, { replace: true });
             
             // So yes, we do this.
             navigate(targetPath, { replace: true });
             
             setTimeout(() => isNavigating.current = false, 100);
         }
    }, [flow.state.currentState, baseRoute, navigate, location.pathname]);
};
