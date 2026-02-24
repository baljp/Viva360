import { useState, useEffect, useCallback, useRef } from 'react';
import { User, PresenceStatus } from '../../types';
import { api } from '../../services/api';

export const useGuardianPresence = (user: User | null) => {
    const [status, setStatus] = useState<PresenceStatus>('OFFLINE');
    const [lastPing, setLastPing] = useState<Date | null>(null);
    const activityTimeout = useRef<NodeJS.Timeout | null>(null);
    
    // Initial Load
    useEffect(() => {
        if (!user || user.role !== 'PROFESSIONAL') return;
        const pro = user as User & { presence?: { status?: PresenceStatus } }; // keep local typing narrow
        if (pro.presence) {
            setStatus(pro.presence.status);
        } else {
             // Check local storage for persistent state across reloads
             const list = JSON.parse(localStorage.getItem('viva360.presence') || '{}');
             if (list[user.id]) setStatus(list[user.id].status);
        }
    }, [user]);

    // Heartbeat Logic
    useEffect(() => {
        if (!user || user.role !== 'PROFESSIONAL' || status !== 'ONLINE') return;

        const handleActivity = () => {
            const now = new Date();
            // Throttle Pings: Only ping if > 60s since last ping
            if (!lastPing || (now.getTime() - lastPing.getTime() > 60000)) {
                api.presence.ping();
                setLastPing(now);
            }
            
            // In a real app, successful PING updates expires_at.
            // Here we assume it works.
        };

        window.addEventListener('click', handleActivity);
        window.addEventListener('keypress', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('mousemove', handleActivity);

        return () => {
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('keypress', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('mousemove', handleActivity);
        };
    }, [user, status, lastPing]);

    // Auto-Offline Check (Client-side fail-safe)
    useEffect(() => {
         if (status !== 'ONLINE') return;
         
         const checkExpiry = () => {
             const list = JSON.parse(localStorage.getItem('viva360.presence') || '{}');
             if (user && list[user.id]) {
                 const expires = new Date(list[user.id].expiresAt).getTime();
                 if (Date.now() > expires) {
                     setStatus('OFFLINE'); // Auto-switch local state
                 }
             }
         };
         
         const interval = setInterval(checkExpiry, 60000); // Check every min
         return () => clearInterval(interval);
    }, [status, user]);

    const toggleStatus = async () => {
        if (status === 'ONLINE') {
            await api.presence.goOffline();
            setStatus('OFFLINE');
        } else {
            await api.presence.goOnline();
            setStatus('ONLINE');
        }
    };

    return {
        status,
        toggleStatus,
        isOnline: status === 'ONLINE'
    };
};
