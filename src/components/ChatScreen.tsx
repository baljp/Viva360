import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChevronLeft, Send, MoreVertical, Phone, Video, Search, Circle, X } from 'lucide-react';
import { User } from '../types';
import { DynamicAvatar, Card } from './Common';

// Fix: Use a fallback string if ImportMeta is not available or just hardcode for this prototype phase
const API_URL = 'http://localhost:3000'; 

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'notification';
}

interface ChatPartner {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  isOnline?: boolean;
}

interface ChatScreenProps {
  currentUser: User;
  partner?: ChatPartner;
  onClose: () => void;
  onSelectPartner?: (partner: ChatPartner) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ currentUser, partner, onClose, onSelectPartner }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [conversations, setConversations] = useState<ChatPartner[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to chat server');
      setIsConnected(true);
      newSocket.emit('users:online');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('message:receive', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('message:sent', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('message:history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    newSocket.on('typing:start', ({ userId }: { userId: string }) => {
      if (partner && userId === partner.id) {
        setPartnerTyping(true);
      }
    });

    newSocket.on('typing:stop', ({ userId }: { userId: string }) => {
      if (partner && userId === partner.id) {
        setPartnerTyping(false);
      }
    });

    newSocket.on('users:online', (users: any[]) => {
      setOnlineUsers(users.map(u => u.odId || u.id));
    });

    newSocket.on('user:online', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
    });

    newSocket.on('user:offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Load chat history when partner changes
  useEffect(() => {
    if (socket && partner) {
      socket.emit('message:history', { partnerId: partner.id, limit: 100 });
    }
  }, [socket, partner]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socket || !partner) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing:start', { receiverId: partner.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing:stop', { receiverId: partner.id });
    }, 2000);
  }, [socket, partner, isTyping]);

  // Send message
  const sendMessage = () => {
    if (!socket || !partner || !newMessage.trim()) return;

    socket.emit('message:send', {
      receiverId: partner.id,
      content: newMessage.trim(),
    });

    setNewMessage('');
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing:stop', { receiverId: partner.id });
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // If no partner selected, show conversation list
  if (!partner) {
    return (
      <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
        <header className="flex items-center gap-4 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 shadow-sm">
          <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-serif italic text-nature-900">Mensagens</h2>
            <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">
              {isConnected ? '🟢 CONECTADO' : '🔴 OFFLINE'}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {conversations.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-nature-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-nature-400" />
              </div>
              <h3 className="text-lg font-serif italic text-nature-900">Nenhuma conversa</h3>
              <p className="text-sm text-nature-400 mt-2">Inicie uma conversa com um guardião ou buscador!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => onSelectPartner?.(conv)}
                  className="w-full bg-white p-4 rounded-[2rem] border border-nature-100 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="relative">
                    <DynamicAvatar user={{ name: conv.name, avatar: conv.avatar }} size="lg" />
                    {onlineUsers.includes(conv.id) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-nature-900">{conv.name}</h4>
                    <p className="text-xs text-nature-400 truncate">{conv.lastMessage || 'Iniciar conversa'}</p>
                  </div>
                  {conv.unreadCount && conv.unreadCount > 0 && (
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{conv.unreadCount}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat view with selected partner
  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 bg-white border-b border-nature-100 shadow-sm">
        <button onClick={onClose} className="p-2 bg-nature-50 rounded-xl text-nature-600 active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="relative">
          <DynamicAvatar user={{ name: partner.name, avatar: partner.avatar }} size="md" />
          {onlineUsers.includes(partner.id) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-nature-900">{partner.name}</h3>
          <p className="text-[10px] text-nature-400 uppercase tracking-widest">
            {partnerTyping ? '✍️ Digitando...' : onlineUsers.includes(partner.id) ? 'Online' : 'Offline'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-nature-50 rounded-xl text-nature-400">
            <Phone size={18} />
          </button>
          <button className="p-2 bg-nature-50 rounded-xl text-nature-400">
            <Video size={18} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                <div className={`px-4 py-3 rounded-[1.5rem] ${
                  isMe 
                    ? 'bg-nature-900 text-white rounded-br-lg' 
                    : 'bg-white text-nature-900 rounded-bl-lg border border-nature-100'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                <p className={`text-[9px] text-nature-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-nature-100 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-nature-50 px-5 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-nature-900 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
