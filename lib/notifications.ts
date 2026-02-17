
export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            // Service worker registration is handled by vite-plugin-pwa.
            // Here we only wait for it to become ready (best-effort).
            const registration = await navigator.serviceWorker.ready;
            return registration;
        } catch (error) {
            return null;
        }
    }
    return null;
};

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        // Here we would get the subscription pushManager.subscribe()
        // and send it to backend
        return true;
    }

    return false;
};
