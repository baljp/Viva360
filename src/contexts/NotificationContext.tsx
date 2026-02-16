
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isMockMode } from '../../lib/supabase';
import { api } from '../../services/api';
import { Notification } from '../../types'; // Adjust path if needed
import { ZenToast } from '../../components/Common';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    markAsRead: async () => {},
    markAllRead: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [user, setUser] = useState<any>(null);

    // Initial Load & Auth Check
    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await api.auth.getCurrentSession();
            setUser(currentUser);
        };
        loadUser();

        if (isMockMode) return;

        // Listen for auth changes to reload user
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            loadUser();
        });

        return () => subscription.unsubscribe();
    }, []);

    // Realtime Subscription
    useEffect(() => {
        if (!user || isMockMode) return;

        // Fetch initial
        const fetchNotes = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('timestamp', { ascending: false })
                .limit(20);
            
            if (data) setNotifications(data as any);
        };
        fetchNotes();

        // Subscribe
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNote = payload.new as Notification;
                    setNotifications(prev => [newNote, ...prev]);
                    
                    // Optional: Sound or Browser Notification here
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        
        if (!isMockMode) {
            await supabase.from('notifications').update({ read: true }).eq('id', id);
        }
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        if (!isMockMode && user) {
            await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead }}>
            {children}
            {/* Global Realtime Toast Container could go here */}
            {notifications.length > 0 && !notifications[0].read && (
                 // Small trick to show only the newest one if it just arrived (needs better logic for "just arrived")
                 // For now, we prefer the local UI (bells) to handle display
                 null
            )}
        </NotificationContext.Provider>
    );
};
