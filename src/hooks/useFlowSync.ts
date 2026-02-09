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
    const hydrationAlignedRef = useRef(false);
    const previousPathRef = useRef<string | null>(null);
    const previousStateRef = useRef<string | null>(null);

    const getFallbackPath = (state: string) => `${baseRoute}/${String(state).toLowerCase().replace(/_/g, '-')}`;

    // Sync Flow -> Router (only using canonical map to avoid invalid state URLs)
    useEffect(() => {
        if (!flow || !flow.state) return;
        const currentState = flow.state.currentState;

        const hasCanonicalMap = !!stateToRouteMap;
        const fallbackPath = getFallbackPath(currentState);
        const targetPath = hasCanonicalMap ? stateToRouteMap?.[currentState] : fallbackPath;
        if (!targetPath) return;
        const previousPath = previousPathRef.current;
        const previousState = previousStateRef.current;
        const pathChanged = previousPath !== null && previousPath !== location.pathname;
        const stateChanged = previousState !== null && previousState !== currentState;

        // When only URL changes (e.g. sidebar/deep link), let Router -> Flow align first.
        if (pathChanged && !stateChanged) {
            previousPathRef.current = location.pathname;
            previousStateRef.current = currentState;
            hydrationAlignedRef.current = true;
            return;
        }

        const routeTargetState = targetMap[viewState];
        const initialMismatch =
            !hydrationAlignedRef.current &&
            !!routeTargetState &&
            routeTargetState !== currentState;

        // During hydration, prefer current route and let Router -> Flow align first.
        if (initialMismatch) {
            previousPathRef.current = location.pathname;
            previousStateRef.current = currentState;
            hydrationAlignedRef.current = true;
            return;
        }

        if (location.pathname !== targetPath) {
            pendingNavigationRef.current = { fromPath: location.pathname, toPath: targetPath, at: Date.now() };
            navigate(targetPath, { replace: true });
        }
        previousPathRef.current = location.pathname;
        previousStateRef.current = currentState;
        hydrationAlignedRef.current = true;
    }, [flow.state.currentState, baseRoute, navigate, stateToRouteMap, location.pathname, targetMap, viewState]);

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

};
