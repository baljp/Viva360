
import React, { useState, useEffect } from 'react';
import { Message } from '../../../types';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { Send, MoreVertical, Phone, Video } from 'lucide-react';
import { useSantuarioFlow } from '../../../src/flow/useSantuarioFlow';
import { useChat } from '../../../src/contexts/useChat';
import { api } from '../../../services/api';

export default function SpaceChatRoomScreen() {
    const { back } = useSantuarioFlow();
    const { messages: allMessages, sendMessage, markAsRead, getMessagesWith } = useChat();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [myId, setMyId] = useState<string>('');

    // Mock active room data
    const activeRoomId = 'space_room_1';
    const activeRoom = {
        name: "Guardião Miguel",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel",
        status: "Online"
    };

    useEffect(() => {
        api.auth.getCurrentSession().then(u => u && setMyId(u.id));
    }, []);

    useEffect(() => {
        const roomMsgs = getMessagesWith(activeRoomId);
        const sorted = [...roomMsgs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setMessages(sorted.map(m => ({
            id: m.id,
            content: m.content,
            senderId: m.sender_id,
            timestamp: m.created_at,
            read: m.read,
            type: 'text' // Add type to match Message interface
        })));
        setLoading(false);
    }, [allMessages]);

    const handleSend = async () => {
        if (!inputText.trim()) return;
        await sendMessage(activeRoomId, inputText);
        setInputText("");
    };

    const appendQuickAction = (actionLabel: string) => {
        setInputText((previous) => `${previous}${previous ? '\n' : ''}[${actionLabel}]`);
    };

    const HeaderRight = () => (
        <div className="flex items-center gap-2">
            <button aria-label="Solicitar ligação de voz" onClick={() => appendQuickAction('Solicitação de ligação de voz')} className="p-2 text-nature-400 hover:text-nature-600"><Phone size={20} /></button>
            <button aria-label="Solicitar chamada de vídeo" onClick={() => appendQuickAction('Solicitação de chamada de vídeo')} className="p-2 text-nature-400 hover:text-nature-600"><Video size={20} /></button>
            <button aria-label="Mais opções" onClick={back} className="p-2 text-nature-400 hover:text-nature-600"><MoreVertical size={20} /></button>
        </div>
    );

    return (
        <PortalView
            title={activeRoom.name}
            subtitle={activeRoom.status}
            onBack={back}
            headerRight={<HeaderRight />}
        >
            <div className="flex flex-col h-[calc(100vh-180px)]">

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-nature-900"></span></div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.senderId === myId || msg.senderId === 'me' || (myId && msg.senderId === myId);
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${isMe ? 'bg-nature-900 text-white rounded-tr-none' : 'bg-white border border-nature-200 text-nature-800 rounded-tl-none shadow-sm'}`}>
                                        <p>{msg.content}</p>
                                        <span className={`text-[9px] block mt-1 opacity-70 ${isMe ? 'text-nature-200' : 'text-nature-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-nature-100 mt-auto">
                    <div className="flex items-center gap-2">
                        <input
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSend()}
                            placeholder="Escreva sua mensagem..."
                            className="flex-1 bg-nature-50 border border-nature-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-nature-200"
                        />
                        <button
                            aria-label="Enviar mensagem"
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                            className="p-3 bg-nature-900 text-white rounded-xl disabled:opacity-50 hover:scale-105 transition-transform"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </PortalView>
    );
}
