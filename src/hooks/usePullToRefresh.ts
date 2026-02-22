import { useCallback, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
    onRefresh: () => void | Promise<void>;
    threshold?: number; // px to trigger refresh
    resistance?: number; // drag resistance factor (higher = harder to pull)
}

interface PullToRefreshResult {
    /** Spread these on the scrollable container */
    handlers: {
        onTouchStart: (e: React.TouchEvent) => void;
        onTouchMove: (e: React.TouchEvent) => void;
        onTouchEnd: () => void;
    };
    /** Current pull distance in px (clamped to threshold * 1.5) */
    pullDistance: number;
    /** Whether a refresh is actively in progress */
    isRefreshing: boolean;
}

/**
 * usePullToRefresh — Detects a downward swipe at the top of a scrollable container
 * and calls `onRefresh`. Returns handlers to spread on the container and visual state.
 */
export function usePullToRefresh({
    onRefresh,
    threshold = 72,
    resistance = 2.5,
}: UsePullToRefreshOptions): PullToRefreshResult {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef<number | null>(null);
    const isRefreshingRef = useRef(false);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (isRefreshingRef.current) return;
        // Only activate if the container is scrolled to the very top
        const el = e.currentTarget as HTMLElement;
        if (el.scrollTop <= 0) {
            startYRef.current = e.touches[0].clientY;
        }
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (startYRef.current === null || isRefreshingRef.current) return;
        const delta = e.touches[0].clientY - startYRef.current;
        if (delta > 0) {
            setPullDistance(Math.min(delta / resistance, threshold * 1.5));
        }
    }, [resistance, threshold]);

    const onTouchEnd = useCallback(async () => {
        if (startYRef.current === null) return;
        startYRef.current = null;

        if (pullDistance >= threshold && !isRefreshingRef.current) {
            isRefreshingRef.current = true;
            setIsRefreshing(true);
            setPullDistance(threshold * 0.6); // snap to indicator position
            try {
                await onRefresh();
            } finally {
                isRefreshingRef.current = false;
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, threshold, onRefresh]);

    return { handlers: { onTouchStart, onTouchMove, onTouchEnd }, pullDistance, isRefreshing };
}
