
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Message, ChatRoom } from '../../../types';
import { ChatServiceMock } from '../../../services/mock/chatMock';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { Send, Phone, Video, MoreVertical, Paperclip, Check, CheckCheck, FileText, ClipboardList, Shield } from 'lucide-react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { useChat } from '../../../src/contexts/ChatContext';
import { api } from '../../../services/api';

export default function ProChatRoomScreen({ roomId }: { roomId?: string }) {
    const { go } = useGuardiaoFlow();
    const activeRoomId = roomId || 'chat_001'; // Default for Demo
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Mock "Self" ID for PRO (In real app, get from AuthContext)
    // Mock "Self" ID for PRO (In real app, get from AuthContext)
    // const MY_ID = 'pro_001'; 
    
    const { messages: allMessages, sendMessage, markAsRead, getMessagesWith } = useChat();
    const [myId, setMyId] = useState<string>('');
    
    useEffect(() => {
        api.auth.getCurrentSession().then(u => u && setMyId(u.id));
    }, []);

    useEffect(() => {
        if(activeRoomId) {
            const roomMsgs = getMessagesWith(activeRoomId);
            const sorted = [...roomMsgs].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
    }, [activeRoomId, allMessages]);

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        await sendMessage(activeRoomId, input);
        setInput('');
        scrollToBottom();
    };

    return (
        <div className="flex flex-col h-screen bg-[#f5f7fa]"> 
             {/* Pro Header */}
             <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm border-b border-indigo-50 z-10">
                 <div className="flex items-center gap-3">
                     <button onClick={() => go('CHAT_LIST')} className="mr-1 text-indigo-900 hover:bg-slate-100 p-2 rounded-full">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                     </button>
                    <DynamicAvatar user={{ name: 'João Silva', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200' } as any} size="sm" />
                    <div>
                        <h4 className="font-bold text-indigo-900 text-sm leading-none">João Silva</h4>
                        <span className="text-[10px] text-indigo-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Online
                        </span>
                    </div>
                 </div>
                 <div className="flex gap-3 text-indigo-400">
                     <div className="p-2 hover:bg-indigo-50 rounded-full cursor-pointer tooltip" title="Prontuário">
                        <ClipboardList size={20}/>
                     </div>
                     <Video size={20} className="hover:text-indigo-900 cursor-pointer"/>
                     <MoreVertical size={20} className="hover:text-indigo-900 cursor-pointer"/>
                 </div>
             </div>

             {/* Messages Area */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                 {/* Pro Warning */}
                 <div className="flex justify-center mb-4">
                     <div className="bg-amber-50 text-amber-600 text-[10px] px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1">
                         <Shield size={10}/> Ambiente Seguro & Criptografado (LGPD Compliant)
                     </div>
                 </div>

                 {loading && <div className="text-center text-xs text-gray-400 mt-4">Carregando histórico clínico...</div>}
                 
                 {messages.map(msg => {
                     const isMe = msg.senderId === myId || msg.senderId === 'me' || (myId && msg.senderId === myId);
                     return (
                         <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm relative text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                                  <p className="leading-relaxed">{msg.content}</p>
                                  <div className={`flex items-center justify-end gap-1 mt-1 opacity-70 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                                      <span className="text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      {isMe && (msg.read ? <CheckCheck size={12}/> : <Check size={12}/>)}
                                  </div>
                              </div>
                         </div>
                     );
                 })}
                 <div ref={scrollRef} />
             </div>

             {/* Pro Input Area */}
             <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
                 <button className="p-2 text-indigo-300 hover:bg-indigo-50 rounded-full transition-colors"><Paperclip size={20}/></button>
                 <button className="p-2 text-indigo-300 hover:bg-indigo-50 rounded-full transition-colors"><FileText size={20}/></button>
                 <div className="flex-1 relative">
                     <input 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Escreva uma mensagem..."
                        className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-transparent focus:border-indigo-100 focus:bg-white outline-none text-sm placeholder:text-slate-400 transition-all"
                     />
                 </div>
                 <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95">
                     <Send size={18} className="translate-x-0.5 translate-y-0.5" />
                 </button>
             </div>
        </div>
    );
}
