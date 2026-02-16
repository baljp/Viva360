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
            return;
        }

        const routeTargetState = targetMap[viewState];
        const routeAllowedStates = clusters?.[viewState];
        const isCurrentStateInRouteCluster = !!routeAllowedStates?.includes(currentState);
        const routeWantsDifferentState = !!routeTargetState && routeTargetState !== currentState && !isCurrentStateInRouteCluster;
        const canonicalForRouteTarget = routeTargetState
            ? (hasCanonicalMap ? stateToRouteMap?.[routeTargetState] : getFallbackPath(routeTargetState))
            : undefined;

        // If the URL already represents the view's canonical route, don't let Flow->Router overwrite it
        // while the Flow state is still catching up (this avoids /client/explore being forced to /client/home on mount).
        // Only block when the URL is authoritative (route changed without a flow transition),
        // e.g. initial hydration or sidebar/deep-link. When the flow state changes (go/jump),
        // we must allow Flow -> Router navigation to keep URL in sync.
        if (!stateChanged && routeWantsDifferentState && canonicalForRouteTarget === location.pathname) {
            previousPathRef.current = location.pathname;
            previousStateRef.current = currentState;
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

            // If we reached the target of a Flow -> Router navigation, clear the pending marker but
            // keep going: the marker can become stale across rapid sequences, and Router -> Flow
            // must still be authoritative when the URL changed explicitly (sidebar/deep link).
            if (reachedPendingTarget) {
                pendingNavigationRef.current = null;
            } else if (stillOnFlowSourcePath && !pendingExpired) {
                // Navigation in-flight: avoid a Router -> Flow jump that could fight the ongoing navigate().
                return;
            } else {
                // Pending marker expired or irrelevant.
                pendingNavigationRef.current = null;
            }
        }

        const canonicalForCurrentState = stateToRouteMap?.[currentState] || getFallbackPath(currentState);
        // If the URL already matches the current flow state and the view wants the same state, do nothing.
        // Otherwise (e.g. sidebar view change while still on a canonical path), allow Router -> Flow alignment.
        if (canonicalForCurrentState === location.pathname && currentState === target) {
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
        hydrationAlignedRef.current = true;
    }, [viewState, flow, targetMap, clusters, location.pathname, stateToRouteMap]);

};
