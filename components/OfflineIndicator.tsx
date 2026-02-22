import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../src/hooks/useOnlineStatus';

/**
 * OfflineIndicator — Shows a slim banner at the bottom of the screen when the device
 * loses network connectivity. Briefly shows a "reconnected" confirmation, then disappears.
 *
 * Usage: Mount once at the app root (e.g. inside App.tsx or index.tsx).
 */
export const OfflineIndicator: React.FC = () => {
    const isOnline = useOnlineStatus();
    const [wasOffline, setWasOffline] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            setWasOffline(true);
            setShowReconnected(false);
        } else if (wasOffline) {
            setShowReconnected(true);
            const t = setTimeout(() => {
                setShowReconnected(false);
                setWasOffline(false);
            }, 2500);
            return () => clearTimeout(t);
        }
    }, [isOnline, wasOffline]);

    if (isOnline && !showReconnected) return null;

    return (
        <div
            role="status"
            aria-live="assertive"
            className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[998]
                flex items-center gap-2 px-5 py-2.5 rounded-full shadow-2xl
                text-[11px] font-bold uppercase tracking-widest
                transition-all duration-500 animate-in slide-in-from-bottom-4
                ${showReconnected
                    ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                    : 'bg-[#1a1a1a] text-white shadow-black/40'
                }`}
        >
            {showReconnected ? (
                <>
                    <Wifi size={14} className="animate-pulse" />
                    Reconectado
                </>
            ) : (
                <>
                    <WifiOff size={14} />
                    Sem conexão
                </>
            )}
        </div>
    );
};
