import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp — Animates a number from 0 to `target` over `duration` ms.
 * Returns the current animated value. Re-runs whenever `target` changes.
 */
export function useCountUp(target: number, duration = 900, decimals = 0): string {
    const [value, setValue] = useState(0);
    const rafRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const startValueRef = useRef(0);

    useEffect(() => {
        if (!Number.isFinite(target)) return;
        startValueRef.current = 0; // always count from 0 on mount/change
        startTimeRef.current = null;

        const step = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out quart
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = startValueRef.current + (target - startValueRef.current) * eased;
            setValue(current);
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                setValue(target);
            }
        };

        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, duration]);

    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}
