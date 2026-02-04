
import React, { useState, useEffect } from 'react';
import { ViewState, ChatRoom } from '../../../types';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { Search, Shield, Stethoscope, Users } from 'lucide-react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext'; 
import { useChat } from '../../../src/contexts/ChatContext';

// Adapted from ChatListScreen but for Pro
export default function ProChatListScreen() {
    const { go, back } = useGuardiaoFlow(); 
    const { messages, getMessagesWith } = useChat();
    const [searchTerm, setSearchTerm] = useState('');

    // Group messages by user to create "Rooms"
    // In a real app with many messages, this logic belongs in the backend (e.g. `distinct on`)
    const rooms = React.useMemo(() => {
        const uniqueUsers = new Set<string>();
        const chats: any[] = [];

        // Reverse to get latest first
        [...messages].reverse().forEach(msg => {
            const otherId = msg.sender_id === 'me' ? msg.receiver_id : msg.sender_id; // 'me' is placeholder logic, real will check auth.uid
            // Simpler: We don't have current user ID here easily without auth context, 
            // but ChatContext handles logic. For list view, we need to know "who is the other person".
            // Let's assume the context already filters for "my" messages.
            // We need a way to identify the counterparty.
            // A robust way: Group by (participants) -> Last Message
        });

        // Simplified Mock-Compatible Logic for now: use Mock + Context hybrid or just mock-wrapper around context?
        // Let's rely on a derived state helper if specific users are known. 
        // OPTION B: Since we don't have a "UseUsers" hook ready to map IDs to Names, 
        // we'll stick to a mixed approach: 
        // Real Apps: fetch `conversations` view from DB.
        // For this step: We simply display a static list of "Active Patients" and check if they have messages in Context.
        return [
            { id: '1', name: 'Maria Silva', role: 'Paciente', lastMsg: getMessagesWith('1').pop()?.content || 'Sem mensagens recent', time: '10:00' },
            { id: '2', name: 'João Souza', role: 'Paciente', lastMsg: getMessagesWith('2').pop()?.content || 'Olá doutor', time: 'Ontem' }
        ];
    }, [messages]);

    // Better Approach: Fetch Real Profiles via API and map messages
    // Since we are in "Execution", let's make it actually work with the "MockDB" data if possible.
    // But since we transitioned to Supabase, we might not have users yet.
    // Let's keep the UI functional but acknowledging data might be sparse.

    return (
        <PortalView title="Comunicação Sagrada" subtitle="PACIENTES & TRIBO" onBack={() => go('DASHBOARD')}>
            <div className="space-y-6">
                {/* Pro Header: Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button className="px-4 py-2 bg-indigo-900 text-white rounded-full text-xs font-bold whitespace-nowrap">Tudo</button>
                    <button className="px-4 py-2 bg-indigo-50 text-indigo-900 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1"><Stethoscope size={12}/> Pacientes</button>
                    <button className="px-4 py-2 bg-indigo-50 text-indigo-900 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1"><Users size={12}/> Tribo</button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                    <input 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar paciente..." 
                        className="w-full bg-white border border-indigo-100 py-4 pl-12 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                    />
                </div>

                {/* Chat List */}
                <div className="bg-white rounded-3xl shadow-sm border border-indigo-50 overflow-hidden min-h-[50vh]">
                     {rooms.length === 0 ? (
                         <div className="p-8 text-center text-indigo-300 italic">Nenhuma conversa iniciada.</div>
                     ) : (
                         rooms.map((room, i) => (
                             <div 
                                key={room.id}
                                onClick={() => go('CHAT_ROOM')} // In real flow, pass ID
                                className={`p-4 flex items-center gap-4 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-indigo-50`}
                             >
                                 <div className="relative">
                                    <DynamicAvatar user={{ name: room.name } as any} size="md" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-baseline mb-1">
                                         <h4 className="font-bold text-indigo-900 text-sm">{room.name} <span className="text-[10px] font-normal text-indigo-400">• {room.role}</span></h4>
                                         <span className="text-[10px] font-bold text-indigo-300">{room.time}</span>
                                     </div>
                                     <p className={`text-xs truncate text-indigo-400`}>
                                         {room.lastMsg}
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
