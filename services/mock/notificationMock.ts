
import { Notification } from '../../types';

export const NOTIFICATION_MOCK_DATA: Notification[] = [
    {
        id: 'notif_001',
        userId: 'user_001',
        type: 'ritual',
        title: 'Hora do Ritual',
        message: 'A Lua Cheia convida para o Banho de Ervas.',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high',
        actionUrl: '/client/ritual/start'
    },
    {
        id: 'notif_002',
        userId: 'user_001',
        type: 'message',
        title: 'Mestre Lucas',
        message: 'Respondeu sua dúvida sobre cristais.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: true,
        priority: 'normal',
        actionUrl: '/client/chat/chat_001'
    }
];

type NotificationListener = (notification: Notification) => void;

export const NotificationServiceMock = {
    listeners: [] as NotificationListener[],

    subscribe(callback: NotificationListener) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    },

    // Simulate pushing a notification from server
    emitMock(notification: Partial<Notification>) {
        const fullNotification: Notification = {
            id: `notif_${Date.now()}`,
            userId: 'user_001',
            type: 'alert',
            title: 'Sistema',
            message: 'Teste de WebSocket',
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'normal',
            ...notification
        };
        
        this.listeners.forEach(cb => cb(fullNotification));
        return fullNotification;
    },

    // Simulate fetching history
    getHistory: async (): Promise<Notification[]> => {
        return new Promise(resolve => setTimeout(() => resolve(NOTIFICATION_MOCK_DATA), 500));
    }
};
