import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useFlowSync = (
    flow: any,
    viewState: string,
    baseRoute: string,
    targetMap: Record<string, string>,
    clusters?: Record<string, string[]>,
    stateToRouteMap?: Record<string, string>
) => {
    const location = useLocation();
    const navigate = useNavigate();
    const pendingNavigationRef = useRef<{ fromPath: string; toPath: string; at: number } | null>(null);
    const previousPathRef = useRef(location.pathname);

    const getFallbackPath = (state: string) => `${baseRoute}/${String(state).toLowerCase().replace(/_/g, '-')}`;
    const pathChanged = previousPathRef.current !== location.pathname;

    // Sync Flow -> Router (only using canonical map to avoid invalid state URLs)
    useEffect(() => {
        if (!flow || !flow.state) return;
        const currentState = flow.state.currentState;

        const hasCanonicalMap = !!stateToRouteMap;
        const fallbackPath = getFallbackPath(currentState);
        const targetPath = hasCanonicalMap ? stateToRouteMap?.[currentState] : fallbackPath;
        if (!targetPath) return;
        const routeTargetState = targetMap[viewState];
        if (pathChanged && routeTargetState && routeTargetState !== currentState) {
            return;
        }
        if (location.pathname !== targetPath) {
            pendingNavigationRef.current = { fromPath: location.pathname, toPath: targetPath, at: Date.now() };
            navigate(targetPath, { replace: true });
        }
    }, [flow.state.currentState, baseRoute, navigate, stateToRouteMap, location.pathname, targetMap, viewState, pathChanged]);

    // Sync Router View -> Flow State (Deep Linking)
    useEffect(() => {
        if (!flow || !flow.state) return;

        const target = targetMap[viewState];
        if (!target) return;

        const currentState = flow.state.currentState;
        const pending = pendingNavigationRef.current;
        if (pending) {
            const reachedPendingTarget = location.pathname === pending.toPath;
            const stillOnFlowSourcePath = location.pathname === pending.fromPath;
            const pendingExpired = Date.now() - pending.at > 1500;

            if (reachedPendingTarget) {
                pendingNavigationRef.current = null;
                return;
            }
            if (stillOnFlowSourcePath && !pendingExpired) {
                return;
            }
            pendingNavigationRef.current = null;
        }

        const canonicalForCurrentState = stateToRouteMap?.[currentState] || getFallbackPath(currentState);
        if (canonicalForCurrentState === location.pathname) {
            return;
        }

        // If current state is already part of the same cluster, preserve the local sub-flow.
        if (clusters) {
            const allowedStates = clusters[viewState];
            const isAlreadyInCluster = allowedStates?.includes(currentState);
            if (isAlreadyInCluster) return;
        }

        if (currentState !== target) {
            if (flow.jump) {
                flow.jump(target);
            } else {
                flow.go(target);
            }
        }
    }, [viewState, flow, targetMap, clusters, location.pathname, stateToRouteMap]);

    useEffect(() => {
        previousPathRef.current = location.pathname;
    }, [location.pathname]);
};
