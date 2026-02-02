
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isMockMode } from '../../lib/supabase';
import { api } from '../../services/api';

// Define minimal types locally or import from types.ts
export interface ChatMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    read: boolean;
    created_at: string;
}

interface ChatContextType {
    messages: ChatMessage[];
    sendMessage: (receiverId: string, content: string) => Promise<void>;
    markAsRead: (senderId: string) => Promise<void>;
    getMessagesWith: (userId: string) => ChatMessage[];
    unreadCount: number;
}

const ChatContext = createContext<ChatContextType>({
    messages: [],
    sendMessage: async () => {},
    markAsRead: async () => {},
    getMessagesWith: () => [],
    unreadCount: 0,
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [user, setUser] = useState<any>(null);

    // Initial Load & Auth Check
    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await api.auth.getCurrentSession();
            setUser(currentUser);
        };
        loadUser();
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            loadUser();
        });

        return () => subscription.unsubscribe();
    }, []);

    // Realtime Subscription
    useEffect(() => {
        if (!user || isMockMode) return;

        // Fetch initial history (last 100 messages for simplicity)
        // In a real app, you'd paginate or load per room
        const fetchHistory = async () => {
             const { data } = await supabase
                .from('chat_messages')
                .select('*')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: true }); // Oldest first for chat log
            
            if (data) setMessages(data as any);
        };
        fetchHistory();

        // Subscribe to incoming and outgoing messages
        const channel = supabase
            .channel('public:chat_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `receiver_id=eq.${user.id}`, // Incoming
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new as ChatMessage]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `sender_id=eq.${user.id}`, // Outgoing (from other devices/tabs)
                },
                (payload) => {
                    // Dedup if we added it optimistically (optional, for now just append)
                    setMessages(prev => {
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new as ChatMessage];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const sendMessage = async (receiverId: string, content: string) => {
        if (!user) return;

        if (isMockMode) {
             // Mock behavior
             const mockMsg = {
                 id: Date.now().toString(),
                 sender_id: user.id,
                 receiver_id: receiverId,
                 content,
                 read: false,
                 created_at: new Date().toISOString()
             };
             setMessages(prev => [...prev, mockMsg]);
             return;
        }

        const { error } = await supabase.from('chat_messages').insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content
        });
        
        if (error) {
            console.error("Failed to send message", error);
            throw error;
        }
    };

    const markAsRead = async (senderId: string) => {
        if (!user) return;
        
        // Optimistic
        setMessages(prev => prev.map(m => (m.sender_id === senderId && m.receiver_id === user.id) ? { ...m, read: true } : m));

        if (!isMockMode) {
            await supabase
                .from('chat_messages')
                .update({ read: true })
                .match({ sender_id: senderId, receiver_id: user.id, read: false });
        }
    };

    const getMessagesWith = (otherId: string) => {
        return messages.filter(m => 
            (m.sender_id === user?.id && m.receiver_id === otherId) || 
            (m.sender_id === otherId && m.receiver_id === user?.id)
        );
    };

    const unreadCount = messages.filter(m => m.receiver_id === user?.id && !m.read).length;

    return (
        <ChatContext.Provider value={{ messages, sendMessage, markAsRead, getMessagesWith, unreadCount }}>
            {children}
        </ChatContext.Provider>
    );
};
