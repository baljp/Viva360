
import React, { useState, useEffect } from 'react';
import { ViewState, ChatRoom } from '../../../types';
import { ChatServiceMock } from '../../../services/mock/chatMock';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { MessageCircle, Search, Flame } from 'lucide-react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext'; // Or pass prop

// Reusing PortalView for consistent design
export default function ChatListScreen() {
    const { go, back } = useBuscadorFlow(); // Assuming integrated
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ChatServiceMock.getRooms().then(data => {
            setRooms(data);
            setLoading(false);
        });
    }, []);

    return (
        <PortalView title="Tribo Conectada" subtitle="SUAS CONVERSAS" onBack={back}>
            <div className="space-y-6">
                {/* Search / Filter */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" size={18} />
                    <input 
                        placeholder="Buscar alma ou pacto..." 
                        className="w-full bg-white border border-nature-100 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                    />
                </div>

                {/* Active Pacts Highlight */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                     <div className="flex flex-col items-center gap-2 min-w-[4rem]">
                         <div className="w-16 h-16 rounded-full border-2 border-dashed border-nature-300 flex items-center justify-center text-nature-300 bg-white shadow-sm">
                             <MessageCircle size={24}/>
                         </div>
                         <span className="text-[10px] uppercase font-bold text-nature-400">Novo</span>
                     </div>
                     {rooms.filter(r => r.isPact).map(room => (
                         <div key={room.id} className="flex flex-col items-center gap-2 min-w-[4rem]" onClick={() => go('CHAT_ROOM')}>
                             <div className="relative">
                                <div className="w-16 h-16 rounded-full border-2 border-indigo-400 p-0.5">
                                    <DynamicAvatar user={{ name: room.participants[1].name, avatar: room.participants[1].avatar } as any} size="lg" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white"><Flame size={10} /></div>
                             </div>
                             <span className="text-[10px] uppercase font-bold text-nature-600 truncate w-16 text-center">{room.participants[1].name.split(' ')[0]}</span>
                         </div>
                     ))}
                </div>

                {/* Chat List */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-nature-100 overflow-hidden min-h-[50vh]">
                     {loading ? (
                         <div className="p-8 text-center text-nature-400 italic animate-pulse">Sintonizando frequências...</div>
                     ) : (
                         rooms.map((room, i) => (
                             <div 
                                key={room.id}
                                onClick={() => go('CHAT_ROOM')} // Removed params for now to fix build
                                className={`p-4 flex items-center gap-4 hover:bg-nature-50 cursor-pointer transition-colors ${i !== rooms.length - 1 ? 'border-b border-nature-50' : ''}`}
                             >
                                 <DynamicAvatar user={{ name: room.participants[1].name, avatar: room.participants[1].avatar } as any} size="md" />
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-baseline mb-1">
                                         <h4 className="font-bold text-nature-900 text-sm">{room.participants[1].name}</h4>
                                         <span className="text-[10px] font-bold text-nature-300">{new Date(room.lastMessage?.timestamp || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                     </div>
                                     <p className={`text-xs truncate ${room.unreadCount > 0 ? 'font-bold text-nature-800' : 'text-nature-400'}`}>
                                         {room.lastMessage?.content}
                                     </p>
                                 </div>
                                 {room.unreadCount > 0 && (
                                     <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md animate-pulse">
                                         {room.unreadCount}
                                     </div>
                                 )}
                             </div>
                         ))
                     )}
                </div>
            </div>
        </PortalView>
    );
}
