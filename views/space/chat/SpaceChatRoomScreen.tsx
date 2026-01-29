
import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../../../types';
import { ChatServiceMock } from '../../../services/mock/chatMock';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { Send, MoreVertical, Phone, Video } from 'lucide-react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext';

export default function SpaceChatRoomScreen() {
    const { back } = useSantuarioFlow();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);

    // Mock active room data
    const activeRoom = {
        name: "Guardião Miguel",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel",
        status: "Online"
    };

    useEffect(() => {
        ChatServiceMock.getMessages('room_1').then(data => {
            setMessages(data);
            setLoading(false);
        });
    }, []);

    const handleSend = () => {
        if (!inputText.trim()) return;
        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: 'me',
            content: inputText,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };
        setMessages(prev => [...prev, newMsg]);
        setInputText("");
        
        // Simulate reply
        setTimeout(() => {
            const reply: ChatMessage = {
                id: (Date.now() + 1).toString(),
                senderId: 'other',
                content: 'Recebido. Vamos ajustar os detalhes.',
                timestamp: new Date().toISOString(),
                status: 'received'
            };
            setMessages(prev => [...prev, reply]);
        }, 1500);
    };

    const HeaderRight = () => (
        <div className="flex items-center gap-2">
            <button className="p-2 text-nature-400 hover:text-nature-600"><Phone size={20}/></button>
            <button className="p-2 text-nature-400 hover:text-nature-600"><Video size={20}/></button>
            <button className="p-2 text-nature-400 hover:text-nature-600"><MoreVertical size={20}/></button>
        </div>
    );

    return (
        <PortalView 
            title={activeRoom.name} 
            subtitle={activeRoom.status} 
            onBack={back}
            headerRight={<HeaderRight/>}
        >
            <div className="flex flex-col h-[calc(100vh-180px)]">
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-nature-900"></span></div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.senderId === 'me';
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${isMe ? 'bg-nature-900 text-white rounded-tr-none' : 'bg-white border border-nature-200 text-nature-800 rounded-tl-none shadow-sm'}`}>
                                        <p>{msg.content}</p>
                                        <span className={`text-[9px] block mt-1 opacity-70 ${isMe ? 'text-nature-200' : 'text-nature-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
