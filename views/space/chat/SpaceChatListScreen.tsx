
import React, { useState, useEffect } from 'react';
import { ViewState, ChatRoom } from '../../../types';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { Search, Shield, Stethoscope, Users, MessageCircle } from 'lucide-react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext'; 
import { useChat } from '../../../src/contexts/ChatContext';

export default function SpaceChatListScreen() {
    const { go, back } = useSantuarioFlow(); 
    const { messages, getMessagesWith } = useChat();
    const [activeFilter, setActiveFilter] = useState<'all' | 'team' | 'guardians' | 'patients'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    // Placeholder logic similar to Pro/Client
    const rooms = React.useMemo(() => [
          { id: '4', roomType: 'guardians', participants: [{name: 'Dra. Ana', avatar: ''}], lastMessage: getMessagesWith('4').pop(), unreadCount: 0 },
          { id: '5', roomType: 'team', participants: [{name: 'Equipe Operacional', avatar: ''}], lastMessage: getMessagesWith('5').pop(), unreadCount: 1 },
          { id: '6', roomType: 'patients', participants: [{name: 'Paciente João', avatar: ''}], lastMessage: getMessagesWith('6').pop(), unreadCount: 0 }
    ] as any[], [messages]);
    const loading = false;
    const filteredRooms = rooms.filter((room) => {
        const matchesType = activeFilter === 'all' || room.roomType === activeFilter;
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const target = `${room.participants[0].name} ${room.lastMessage?.content || ''}`.toLowerCase();
        const matchesSearch = !normalizedSearch || target.includes(normalizedSearch);
        return matchesType && matchesSearch;
    });

    return (
        <PortalView title="Egrégora Digital" subtitle="COMUNICAÇÃO INTERNA" onBack={() => go('EXEC_DASHBOARD')}>
            <div className="space-y-6">
                {/* Space Header: Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${activeFilter === 'all' ? 'bg-nature-900 text-white' : 'bg-nature-50 text-nature-900'}`}>Tudo</button>
                    <button onClick={() => setActiveFilter('team')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 ${activeFilter === 'team' ? 'bg-nature-900 text-white' : 'bg-nature-50 text-nature-900'}`}><Users size={12}/> Equipe</button>
                    <button onClick={() => setActiveFilter('guardians')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 ${activeFilter === 'guardians' ? 'bg-nature-900 text-white' : 'bg-nature-50 text-nature-900'}`}><Stethoscope size={12}/> Guardiões</button>
                    <button onClick={() => setActiveFilter('patients')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 ${activeFilter === 'patients' ? 'bg-nature-900 text-white' : 'bg-nature-50 text-nature-900'}`}><Shield size={12}/> Pacientes</button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" size={18} />
                    <input 
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Buscar conversa..." 
                        className="w-full bg-white border border-nature-100 py-4 pl-12 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-nature-200 transition-all shadow-sm"
                    />
                </div>

                {/* Chat List */}
                <div className="bg-white rounded-3xl shadow-sm border border-nature-50 overflow-hidden min-h-[50vh]">
                     {loading ? (
                         <div className="p-8 text-center text-nature-300 italic animate-pulse">Sincronizando frequências...</div>
                     ) : (
                         filteredRooms.map((room, i) => (
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
