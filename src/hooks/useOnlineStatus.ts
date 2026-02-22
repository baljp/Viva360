import { useEffect, useState } from 'react';

/**
 * useOnlineStatus — Returns `isOnline` boolean that updates reactively.
 * Listens to native browser online/offline events.
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(() =>
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);

        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    return isOnline;
}
