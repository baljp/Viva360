import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalView, DynamicAvatar, DegradedRetryNotice } from '../../../components/Common';
import { Search, Shield, Stethoscope, Users, Loader2 } from 'lucide-react';
import { useSantuarioFlow } from '../../../src/flow/useSantuarioFlow';
import { communityApi } from '../../../services/api/communityClient';
import { useChatRoomRealtime } from '../../../src/hooks/useChatRoomRealtime';
import { buildReadFailureCopy, isDegradedReadError } from '../../../src/utils/readDegradedUX';

type SpaceRoomParticipant = { id: string; name: string; avatar: string };
type SpaceChatRoomItem = {
  id: string;
  type: string;
  roomType: 'team' | 'guardians' | 'patients';
  name: string;
  participants: SpaceRoomParticipant[];
  lastMessage?: { content: string; created_at: string } | null;
  unreadCount: number;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};

const classifyRoom = (type: string): SpaceChatRoomItem['roomType'] => {
  if (type === 'support_room' || type === 'healing_circle') return 'team';
  if (type === 'agendamento') return 'patients';
  return 'guardians';
};

const mapApiRoom = (room: unknown): SpaceChatRoomItem | null => {
  const raw = asRecord(room);
  const id = String(raw.id || '').trim();
  if (!id) return null;
  const type = String(raw.type || 'private');
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
    .filter((p): p is SpaceRoomParticipant => !!p.id);
  const messages = Array.isArray(raw.messages) ? raw.messages : [];
  const last = messages[0] ? asRecord(messages[0]) : null;
  return {
    id,
    type,
    roomType: classifyRoom(type),
    name: participants[0]?.name || String(raw.name || 'Conversa'),
    participants,
    unreadCount: Number(raw.unreadCount || 0),
    lastMessage: last ? { content: String(last.content || ''), created_at: String(last.created_at || '') } : null,
  };
};

export default function SpaceChatListScreen() {
  const { go, back, selectChatRoom } = useSantuarioFlow();
  const [activeFilter, setActiveFilter] = useState<'all' | 'team' | 'guardians' | 'patients'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rooms, setRooms] = useState<SpaceChatRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIssue, setReadIssue] = useState<{ title: string; message: string } | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setReadIssue(null);
    try {
      const data = await communityApi.chat.listRooms(undefined, { strict: true });
      setRooms((Array.isArray(data) ? data : []).map(mapApiRoom).filter((r): r is SpaceChatRoomItem => !!r));
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

  const filteredRooms = useMemo(() => rooms.filter((room) => {
    const matchesType = activeFilter === 'all' || room.roomType === activeFilter;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const target = `${room.name} ${room.lastMessage?.content || ''}`.toLowerCase();
    return matchesType && (!normalizedSearch || target.includes(normalizedSearch));
  }), [activeFilter, rooms, searchTerm]);

  return (
    <PortalView title="Egrégora Digital" subtitle="COMUNICAÇÃO INTERNA" onBack={() => go('EXEC_DASHBOARD')}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${activeFilter === 'all' ? 'bg-nature-900 text-white' : 'bg-nature-50 text-nature-900'}`}>Tudo</button>
            <button onClick={() => setActiveFilter('team')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 ${activeFilter === 'team' ? 'bg-nature-900 text-white' : 'bg-nature-50 text-nature-900'}`}><Users size={12}/> Equipe</button>
            <button onClick={() => setActiveFilter('guardians')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 ${activeFilter === 'guardians' ? 'bg-nature-900 text-white' : 'bg-nature-50 text-nature-900'}`}><Stethoscope size={12}/> Guardiões</button>
            <button onClick={() => setActiveFilter('patients')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 ${activeFilter === 'patients' ? 'bg-nature-900 text-white' : 'bg-nature-50 text-nature-900'}`}><Shield size={12}/> Pacientes</button>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-nature-300">
            {usingFallbackPolling ? 'Polling seguro' : 'Tempo real'}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" size={18} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar conversa..."
            className="w-full bg-white border border-nature-100 py-4 pl-12 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-nature-200 transition-all shadow-sm"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-nature-50 overflow-hidden min-h-[50vh]">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-nature-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="italic text-sm">Sincronizando frequências...</span>
            </div>
          ) : readIssue ? (
            <div className="p-6">
              <DegradedRetryNotice title={readIssue.title} message={readIssue.message} onRetry={loadRooms} compact />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-nature-300 italic">Nenhuma conversa encontrada.</div>
          ) : (
            filteredRooms.map((room, i) => (
              <div
                key={room.id}
                onClick={() => { selectChatRoom({ id: room.id, name: room.name }); go('CHAT_ROOM'); }}
                className={`p-4 flex items-center gap-4 hover:bg-nature-50 cursor-pointer transition-colors ${i !== filteredRooms.length - 1 ? 'border-b border-nature-50' : ''}`}
              >
                <DynamicAvatar user={{ name: room.name, avatar: room.participants[0]?.avatar || '' }} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-nature-900 text-sm">{room.name}</h4>
                    <span className="text-[10px] font-bold text-nature-300">
                      {room.lastMessage?.created_at ? new Date(room.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${room.unreadCount > 0 ? 'font-bold text-nature-800' : 'text-nature-400'}`}>
                    {room.lastMessage?.content || 'Sem mensagens recentes'}
                  </p>
                </div>
                {room.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-nature-900 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {room.unreadCount > 9 ? '9+' : room.unreadCount}
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

