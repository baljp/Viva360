
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Message, ChatRoom } from '../../../types';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { Send, Phone, Video, MoreVertical, Paperclip, Check, CheckCheck } from 'lucide-react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { useChat } from '../../../src/contexts/useChat';
import { api } from '../../../services/api';

export default function ChatRoomScreen({ roomId }: { roomId?: string }) { // Logic to get roomId via props from Connector
    const { back, state } = useBuscadorFlow();
    // Fallback if roomId not passed directly (depends on Connector implementation)
    // For now we assume the connector passes 'data' or we fetch from flow state if stored there.
    // Let's assume passed via props or we use a fixed one for testing if undefined.
    const activeRoomId = roomId || 'chat_001'; 
    
    const { messages: allMessages, sendMessage, markAsRead, getMessagesWith } = useChat();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    
    // In a real app we'd get the current user ID properly
    const [myId, setMyId] = useState<string>('');

    useEffect(() => {
        api.auth.getCurrentSession().then(u => u && setMyId(u.id));
    }, []);

    useEffect(() => {
        if(activeRoomId) {
             // Realtime filter
             const roomMsgs = getMessagesWith(activeRoomId);
             // Sort by time
            const sorted = [...roomMsgs].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            
            // Map to local Message type if needed, or update type
            setMessages(sorted.map(m => ({
                id: m.id,
                content: m.content,
                senderId: m.sender_id,
                timestamp: m.created_at,
                read: m.read,
                type: 'text'
            })));
            
            setLoading(false);
            scrollToBottom();
        }
    }, [activeRoomId, allMessages]); // Update when global messages change

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        await sendMessage(activeRoomId, input);
        setInput('');
        scrollToBottom();
    };

    const handleOpenAttachmentPicker = () => {
        attachmentInputRef.current?.click();
    };

    const handleAttachmentSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setInput((prev) => `${prev}${prev ? '\n' : ''}[Arquivo anexado: ${file.name}]`);
        event.target.value = '';
    };

    return (
        <div className="flex flex-col h-screen bg-[#ece5dd]"> 
             {/* Custom Header replacing PortalView header for Chat feel */}
             <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-200 z-10">
                 <div className="flex items-center gap-3">
                     <button onClick={back} className="mr-1 text-nature-600 hover:bg-black/5 p-2 rounded-full">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                     </button>
                    <DynamicAvatar user={{ name: 'Mestre', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' } as any} size="sm" />
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm leading-none">Mestre Lucas</h4>
                        <span className="text-[10px] text-emerald-600 font-medium">Online agorinha</span>
                    </div>
                 </div>
                 <div className="flex gap-4 text-nature-600">
                     <Video size={20} className="hover:text-nature-900 cursor-pointer"/>
                     <Phone size={20} className="hover:text-nature-900 cursor-pointer"/>
                     <MoreVertical size={20} className="hover:text-nature-900 cursor-pointer"/>
                 </div>
             </div>

             {/* Messages Area */}
             {/* WhatsApp-like background pattern could be added here */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efe7dd] bg-opacity-50">
                 {loading && <div className="text-center text-xs text-gray-400 mt-4">Carregando mensagens antigas...</div>}
                 
                 
                 {messages.map(msg => {
                     const isMe = msg.senderId === myId || msg.senderId === 'me' || (myId && msg.senderId === myId);
                     return (
                         <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-lg p-3 shadow-sm relative text-sm ${isMe ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                                  <p className="leading-relaxed">{msg.content}</p>
                                  <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                                      <span className="text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      {isMe && (msg.read ? <CheckCheck size={12} className="text-blue-500"/> : <Check size={12}/>)}
                                  </div>
                              </div>
                         </div>
                     );
                 })}
                 <div ref={scrollRef} />
             </div>

             {/* Input Area */}
             <div className="p-3 bg-white flex items-center gap-2 shadow-inner">
                 <button aria-label="Anexar arquivo" onClick={handleOpenAttachmentPicker} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Paperclip size={20}/></button>
                 <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleAttachmentSelected} />
                 <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 bg-white px-4 py-2.5 rounded-2xl border-none outline-none text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-emerald-200"
                 />
                 <button onClick={handleSend} className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors shadow-sm active:scale-95">
                     <Send size={18} className="translate-x-0.5 translate-y-0.5" />
                 </button>
             </div>
        </div>
    );
}
