
export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ [SW] Registered:', registration.scope);
            return registration;
        } catch (error) {
            console.error('❌ [SW] Registration failed:', error);
            return null;
        }
    }
    return null;
};

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('⚠️ Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        console.log('✅ [SW] Permission granted!');
        // Here we would get the subscription pushManager.subscribe()
        // and send it to backend
        return true;
    }

    console.warn('⚠️ [SW] Permission denied');
    return false;
};
