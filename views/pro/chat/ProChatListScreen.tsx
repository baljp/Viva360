import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalView, DynamicAvatar, DegradedRetryNotice } from '../../../components/Common';
import { Search, Loader2, Stethoscope, Users } from 'lucide-react';
import { useGuardiaoFlow } from '../../../src/flow/useGuardiaoFlow';
import { communityApi } from '../../../services/api/communityClient';
import { useChatRoomRealtime } from '../../../src/hooks/useChatRoomRealtime';
import { buildReadFailureCopy, isDegradedReadError } from '../../../src/utils/readDegradedUX';

type RoomParticipant = { id: string; name: string; avatar: string };
type ProChatRoomItem = {
  id: string;
  type: string;
  roomType: 'patients' | 'tribe';
  name: string;
  participants: RoomParticipant[];
  lastMessage?: { content: string; created_at: string } | null;
  unreadCount: number;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};

const mapApiRoom = (room: unknown): ProChatRoomItem | null => {
  const raw = asRecord(room);
  const id = String(raw.id || '').trim();
  if (!id) return null;

  const participants = (Array.isArray(raw.participants) ? raw.participants : [])
    .map((entry) => {
      const p = asRecord(entry);
      const profile = asRecord(p.profile);
      return {
        id: String(profile.id || p.profile_id || ''),
        name: String(profile.name || 'Contato'),
        avatar: String(profile.avatar || ''),
      };
    })
    .filter((p): p is RoomParticipant => !!p.id);

  const messages = Array.isArray(raw.messages) ? raw.messages : [];
  const last = messages.length > 0 ? asRecord(messages[0]) : null;
  const name = participants[0]?.name || String(raw.name || 'Conversa');
  const type = String(raw.type || 'private');

  return {
    id,
    type,
    roomType: ['support_room', 'healing_circle', 'escambo'].includes(type) ? 'tribe' : 'patients',
    name,
    participants,
    unreadCount: Number(raw.unreadCount || 0),
    lastMessage: last ? {
      content: String(last.content || ''),
      created_at: String(last.created_at || ''),
    } : null,
  };
};

export default function ProChatListScreen() {
  const { go, state, selectChatRoom } = useGuardiaoFlow();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'patients' | 'tribe'>('all');
  const [rooms, setRooms] = useState<ProChatRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIssue, setReadIssue] = useState<{ title: string; message: string } | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setReadIssue(null);
    try {
      const data = await communityApi.chat.listRooms(undefined, { strict: true });
      const mapped = (Array.isArray(data) ? data : [])
        .map(mapApiRoom)
        .filter((room): room is ProChatRoomItem => !!room);
      setRooms(mapped);
    } catch (err) {
      setRooms([]);
      setReadIssue(buildReadFailureCopy(['chat'], isDegradedReadError(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms().catch(() => undefined);
  }, [loadRooms]);

  const { usingFallbackPolling } = useChatRoomRealtime({
    watchAllRooms: true,
    enabled: true,
    load: loadRooms,
    healthyPollMs: 12000,
    fallbackPollMs: 3500,
  });

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesFilter = activeFilter === 'all' || room.roomType === activeFilter;
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const target = `${room.name} ${room.lastMessage?.content || ''}`.toLowerCase();
      const matchesSearch = !normalizedSearch || target.includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, rooms, searchTerm]);

  const openRoom = (room: ProChatRoomItem) => {
    selectChatRoom({ id: room.id, name: room.name });
    go('CHAT_ROOM');
  };

  return (
    <PortalView title="Comunicação Sagrada" subtitle="PACIENTES & TRIBO" onBack={() => go('DASHBOARD')}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${activeFilter === 'all' ? 'bg-indigo-900 text-white' : 'bg-indigo-50 text-indigo-900'}`}>Tudo</button>
            <button onClick={() => setActiveFilter('patients')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 ${activeFilter === 'patients' ? 'bg-indigo-900 text-white' : 'bg-indigo-50 text-indigo-900'}`}><Stethoscope size={12} /> Pacientes</button>
            <button onClick={() => setActiveFilter('tribe')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 ${activeFilter === 'tribe' ? 'bg-indigo-900 text-white' : 'bg-indigo-50 text-indigo-900'}`}><Users size={12} /> Tribo</button>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
            {usingFallbackPolling ? 'Polling seguro' : 'Tempo real'}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar paciente..."
            className="w-full bg-white border border-indigo-100 py-4 pl-12 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-indigo-50 overflow-hidden min-h-[50vh]">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-indigo-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm italic">Sincronizando conversas...</span>
            </div>
          ) : readIssue ? (
            <div className="p-6">
              <DegradedRetryNotice title={readIssue.title} message={readIssue.message} onRetry={loadRooms} compact />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-indigo-300 italic">Nenhuma conversa iniciada.</div>
          ) : (
            filteredRooms.map((room, i) => (
              <div
                key={room.id}
                onClick={() => openRoom(room)}
                className={`p-4 flex items-center gap-4 hover:bg-indigo-50 cursor-pointer transition-colors ${i !== filteredRooms.length - 1 ? 'border-b border-indigo-50' : ''}`}
              >
                <DynamicAvatar user={{ name: room.name, avatar: room.participants[0]?.avatar || '' }} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-indigo-900 text-sm">
                      {room.name}
                      <span className="text-[10px] font-normal text-indigo-400"> • {room.roomType === 'tribe' ? 'Tribo' : 'Paciente'}</span>
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-300">
                      {room.lastMessage?.created_at ? new Date(room.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${room.unreadCount > 0 ? 'font-bold text-indigo-800' : 'text-indigo-400'}`}>
                    {room.lastMessage?.content || 'Inicie a conversa'}
                  </p>
                </div>
                {room.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {room.unreadCount > 9 ? '9+' : room.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        {state.selectedChatRoom?.name && (
          <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">
            Última sala selecionada: {state.selectedChatRoom.name}
          </p>
        )}
      </div>
    </PortalView>
  );
}

