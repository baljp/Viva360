
import React, { useEffect, useRef, useState } from 'react';
import type { User } from '../../types';
import { supabase, isMockMode } from '../../lib/supabase';
import { api } from '../../services/api';
import { ChatContextStore } from './ChatContextStore';
import { captureFrontendError } from '../../lib/frontendLogger';
import { isPublicPath } from '../app/routing';

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
    realtimeStatus: 'idle' | 'subscribed' | 'fallback';
    usingFallbackPolling: boolean;
    isRealtimeSubscribed: boolean;
}
export type { ChatContextType };
const ChatContext = ChatContextStore as React.Context<ChatContextType>;

type SupabaseChatRow = Partial<ChatMessage> & {
    id?: string;
    sender_id?: string;
    receiver_id?: string;
    content?: string;
    read?: boolean;
    created_at?: string;
};

const toChatMessage = (row: SupabaseChatRow): ChatMessage | null => {
    const id = String(row.id || '').trim();
    const senderId = String(row.sender_id || '').trim();
    const receiverId = String(row.receiver_id || '').trim();
    if (!id || !senderId || !receiverId) return null;
    return {
        id,
        sender_id: senderId,
        receiver_id: receiverId,
        content: String(row.content || ''),
        read: !!row.read,
        created_at: String(row.created_at || new Date().toISOString()),
    };
};

const mergeMessages = (prev: ChatMessage[], incomingRows: SupabaseChatRow[]) => {
    const map = new Map(prev.map((m) => [m.id, m]));
    incomingRows.forEach((row) => {
        const msg = toChatMessage(row);
        if (msg) map.set(msg.id, msg);
    });
    return Array.from(map.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [realtimeStatus, setRealtimeStatus] = useState<'idle' | 'subscribed' | 'fallback'>('idle');
    const realtimeStatusRef = useRef<'idle' | 'subscribed' | 'fallback'>('idle');
    const lastFetchAtRef = useRef(0);
    const fetchInFlightRef = useRef(false);

    // Initial Load & Auth Check
    useEffect(() => {
        const loadUser = async () => {
            if (isPublicPath(window.location.pathname)) {
                setUser(null);
                return;
            }
            const currentUser = await api.auth.getCurrentSession();
            setUser(currentUser);
        };
        loadUser();

        if (isMockMode) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            loadUser();
        });

        return () => subscription.unsubscribe();
    }, []);

    // Realtime Subscription
    useEffect(() => {
        if (!user || isMockMode) {
            setRealtimeStatus(isMockMode ? 'fallback' : 'idle');
            realtimeStatusRef.current = isMockMode ? 'fallback' : 'idle';
            return;
        }

        // Fetch initial history (last 100 messages for simplicity)
        // In a real app, you'd paginate or load per room
        const fetchHistory = async () => {
            if (fetchInFlightRef.current) return;
            fetchInFlightRef.current = true;
            try {
                const { data } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                    .order('created_at', { ascending: true }); // Oldest first for chat log

                if (Array.isArray(data)) {
                    setMessages(mergeMessages([], data as SupabaseChatRow[]));
                    lastFetchAtRef.current = Date.now();
                }
            } finally {
                fetchInFlightRef.current = false;
            }
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
                    setMessages(prev => mergeMessages(prev, [payload.new as SupabaseChatRow]));
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
                    setMessages(prev => mergeMessages(prev, [payload.new as SupabaseChatRow]));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                (payload) => {
                    setMessages(prev => mergeMessages(prev, [payload.new as SupabaseChatRow]));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `sender_id=eq.${user.id}`,
                },
                (payload) => {
                    setMessages(prev => mergeMessages(prev, [payload.new as SupabaseChatRow]));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                (payload) => {
                    const deletedId = String((payload.old as { id?: string } | null)?.id || '');
                    if (!deletedId) return;
                    setMessages(prev => prev.filter((m) => m.id !== deletedId));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `sender_id=eq.${user.id}`,
                },
                (payload) => {
                    const deletedId = String((payload.old as { id?: string } | null)?.id || '');
                    if (!deletedId) return;
                    setMessages(prev => prev.filter((m) => m.id !== deletedId));
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setRealtimeStatus('subscribed');
                    realtimeStatusRef.current = 'subscribed';
                    return;
                }
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    setRealtimeStatus('fallback');
                    realtimeStatusRef.current = 'fallback';
                }
            });

        // Controlled fallback polling: fast when realtime is degraded, slow when healthy.
        const pollTimer = window.setInterval(() => {
            const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
            const subscribed = realtimeStatusRef.current === 'subscribed';
            const minGap = subscribed ? (hidden ? 30000 : 15000) : (hidden ? 12000 : 4000);
            if (Date.now() - lastFetchAtRef.current < minGap) return;
            fetchHistory().catch(() => undefined);
        }, 2000);

        return () => {
            window.clearInterval(pollTimer);
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
            captureFrontendError(error, { domain: 'chat', op: 'sendMessage' });
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
        <ChatContext.Provider value={{
            messages,
            sendMessage,
            markAsRead,
            getMessagesWith,
            unreadCount,
            realtimeStatus,
            usingFallbackPolling: realtimeStatus === 'fallback',
            isRealtimeSubscribed: realtimeStatus === 'subscribed',
        }}>
            {children}
        </ChatContext.Provider>
    );
};
