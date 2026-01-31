
/**
 * Preloads the major view containers for a specific role.
 * This should be called as soon as the user role is determined (e.g., after login or session init).
 */
export const preloadRoleViews = (role: string) => {
    const roleUpper = role.toUpperCase();
    
    // Major views mapping
    const views: Record<string, () => Promise<any>> = {
        'CLIENT': () => import('../../views/ClientViews'),
        'PROFESSIONAL': () => import('../../views/ProViews'),
        'SPACE': () => import('../../views/SpaceViews'),
        'ADMIN': () => import('../../views/AdminViews'),
    };

    const loader = views[roleUpper];
    if (loader) {
        console.log(`[FlowLoader] Preloading views for role: ${roleUpper}`);
        loader().catch(err => console.error(`[FlowLoader] Preload failed for ${roleUpper}`, err));
    }

    // Always preload settings as they are common
    import('../../views/SettingsViews').catch(() => {});
};
