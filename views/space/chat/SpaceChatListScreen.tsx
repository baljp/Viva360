
import React, { useState, useEffect } from 'react';
import { ViewState, ChatRoom } from '../../../types';
import { ChatServiceMock } from '../../../services/mock/chatMock';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { Search, Shield, Stethoscope, Users, MessageCircle } from 'lucide-react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext'; 

export default function SpaceChatListScreen() {
    const { go, back } = useSantuarioFlow(); 
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch Space rooms (Team, Patients, etc)
        ChatServiceMock.getRooms().then(data => {
            setRooms(data); 
            setLoading(false);
        });
    }, []);

    return (
        <PortalView title="Egrégora Digital" subtitle="COMUNICAÇÃO INTERNA" onBack={() => go('DASHBOARD')}>
            <div className="space-y-6">
                {/* Space Header: Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button className="px-4 py-2 bg-nature-900 text-white rounded-full text-xs font-bold whitespace-nowrap">Tudo</button>
                    <button className="px-4 py-2 bg-nature-50 text-nature-900 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1"><Users size={12}/> Equipe</button>
                    <button className="px-4 py-2 bg-nature-50 text-nature-900 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1"><Stethoscope size={12}/> Guardiões</button>
                    <button className="px-4 py-2 bg-nature-50 text-nature-900 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1"><Shield size={12}/> Pacientes</button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" size={18} />
                    <input 
                        placeholder="Buscar conversa..." 
                        className="w-full bg-white border border-nature-100 py-4 pl-12 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-nature-200 transition-all shadow-sm"
                    />
                </div>

                {/* Chat List */}
                <div className="bg-white rounded-3xl shadow-sm border border-nature-50 overflow-hidden min-h-[50vh]">
                     {loading ? (
                         <div className="p-8 text-center text-nature-300 italic animate-pulse">Sincronizando frequências...</div>
                     ) : (
                         rooms.map((room, i) => (
                             <div 
                                key={room.id}
                                onClick={() => go('CHAT_ROOM')}
                                className={`p-4 flex items-center gap-4 hover:bg-nature-50 cursor-pointer transition-colors ${i !== rooms.length - 1 ? 'border-b border-nature-50' : ''}`}
                             >
                                 <div className="relative">
                                    <DynamicAvatar user={{ name: room.participants[0].name, avatar: room.participants[0].avatar } as any} size="md" />
                                    {room.isPact && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white"></div>}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-baseline mb-1">
                                         <h4 className="font-bold text-nature-900 text-sm">{room.participants[0].name}</h4>
                                         <span className="text-[10px] font-bold text-nature-300">{new Date(room.lastMessage?.timestamp || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                     </div>
                                     <p className={`text-xs truncate ${room.unreadCount > 0 ? 'font-bold text-nature-800' : 'text-nature-400'}`}>
                                         {room.lastMessage?.content}
                                     </p>
                                 </div>
                             </div>
                         ))
                     )}
                </div>
            </div>
        </PortalView>
    );
}
