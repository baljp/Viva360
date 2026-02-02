
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Notification } from '../../types';
import { NotificationServiceMock } from '../../services/mock/notificationMock';
import { Bell } from 'lucide-react';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    pushNotification: (n: Partial<Notification>) => void; // For demo purposes
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toast, setToast] = useState<Notification | null>(null);

    useEffect(() => {
        // Load history
        NotificationServiceMock.getHistory().then(setNotifications);

        // Subscribe to realtime
        const unsubscribe = NotificationServiceMock.subscribe((newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);
            // Trigger Toast
            setToast(newNotif);
            // Hide toast after 5s
            setTimeout(() => setToast(null), 5000);
            
            // Audio Feedback (Optional)
            // const audio = new Audio('/sounds/notification.mp3');
            // audio.play().catch(() => {}); 
        });

        return () => unsubscribe();
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const pushNotification = (n: Partial<Notification>) => {
        NotificationServiceMock.emitMock(n);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, pushNotification }}>
            {children}
            {/* Global Notification Toast Overlay */}
            {toast && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-bottom-4 duration-300 w-[90%] max-w-sm pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-md border border-indigo-100 p-4 rounded-[2rem] shadow-2xl flex gap-3 cursor-pointer hover:scale-105 transition-transform pointer-events-auto" 
                         onClick={() => {
                             markAsRead(toast.id);
                             setToast(null);
                         }}
                    >
                        <div className={`p-3 rounded-full ${toast.priority === 'high' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center`}>
                            <Bell size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm">{toast.title}</h4>
                            <p className="text-xs text-gray-500 leading-snug">{toast.message}</p>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
