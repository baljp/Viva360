
import React, { useState, useEffect } from 'react';
import { ViewState, ChatRoom } from '../../../types';
import { ChatServiceMock } from '../../../services/mock/chatMock';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { Search, Shield, Stethoscope, Users } from 'lucide-react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext'; 

// Adapted from ChatListScreen but for Pro
export default function ProChatListScreen() {
    const { go, back } = useGuardiaoFlow(); 
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In real app, we would fetch PRO rooms (patients, supervision)
        ChatServiceMock.getRooms().then(data => {
            setRooms(data); // Reusing mock data for now
            setLoading(false);
        });
    }, []);

    return (
        <PortalView title="Comunicação Sagrada" subtitle="PACIENTES & TRIBO" onBack={() => go('DASHBOARD')}>
            <div className="space-y-6">
                {/* Pro Header: Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button className="px-4 py-2 bg-indigo-900 text-white rounded-full text-xs font-bold whitespace-nowrap">Tudo</button>
                    <button className="px-4 py-2 bg-indigo-50 text-indigo-900 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1"><Stethoscope size={12}/> Pacientes</button>
                    <button className="px-4 py-2 bg-indigo-50 text-indigo-900 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1"><Users size={12}/> Tribo</button>
                    <button className="px-4 py-2 bg-indigo-50 text-indigo-900 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1"><Shield size={12}/> Supervisão</button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                    <input 
                        placeholder="Buscar paciente..." 
                        className="w-full bg-white border border-indigo-100 py-4 pl-12 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                    />
                </div>

                {/* Chat List */}
                <div className="bg-white rounded-3xl shadow-sm border border-indigo-50 overflow-hidden min-h-[50vh]">
                     {loading ? (
                         <div className="p-8 text-center text-indigo-300 italic animate-pulse">Carregando lista de almas...</div>
                     ) : (
                         rooms.map((room, i) => (
                             <div 
                                key={room.id}
                                onClick={() => go('CHAT_ROOM')} // Fixed: No params for now
                                className={`p-4 flex items-center gap-4 hover:bg-indigo-50 cursor-pointer transition-colors ${i !== rooms.length - 1 ? 'border-b border-indigo-50' : ''}`}
                             >
                                 <div className="relative">
                                    <DynamicAvatar user={{ name: room.participants[0].name, avatar: room.participants[0].avatar } as any} size="md" />
                                    {room.isPact && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white"></div>}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-baseline mb-1">
                                         <h4 className="font-bold text-indigo-900 text-sm">{room.participants[0].name} <span className="text-[10px] font-normal text-indigo-400">• Paciente</span></h4>
                                         <span className="text-[10px] font-bold text-indigo-300">{new Date(room.lastMessage?.timestamp || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                     </div>
                                     <p className={`text-xs truncate ${room.unreadCount > 0 ? 'font-bold text-indigo-700' : 'text-indigo-400'}`}>
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
