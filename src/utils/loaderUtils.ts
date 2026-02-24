
/**
 * Preloads the major view containers for a specific role.
 * This should be called as soon as the user role is determined (e.g., after login or session init).
 */
export const preloadRoleViews = (role: string) => {
    const roleUpper = role.toUpperCase();
    const schedule = (fn: () => void, delayMs = 0) => {
        if (typeof window !== 'undefined') {
            const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
            if (typeof idle === 'function') {
                idle(fn, { timeout: Math.max(1500, delayMs || 1) });
                return;
            }
        }
        setTimeout(fn, delayMs);
    };
    
    // Major views mapping
    const views: Record<string, () => Promise<any>> = {
        'CLIENT': () => import('../../views/ClientViews'),
        'PROFESSIONAL': () => import('../../views/ProViews'),
        'SPACE': () => import('../../views/SpaceViews'),
        'ADMIN': () => import('../../views/AdminViews'),
    };

    const loader = views[roleUpper];
    if (loader) {
        schedule(() => {
            loader().catch(err => console.error(`[FlowLoader] Preload failed for ${roleUpper}`, err));
        }, 600);
    }

    // Always preload settings as they are common
    schedule(() => {
        import('../../views/SettingsViews').catch(() => {});
    }, 1200);
};
