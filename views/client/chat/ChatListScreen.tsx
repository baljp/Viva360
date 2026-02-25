
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PortalView, DynamicAvatar, DegradedRetryNotice } from '../../../components/Common';
import { MessageCircle, Search, Flame, Loader } from 'lucide-react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { useChat } from '../../../src/contexts/useChat';
import { communityApi } from '../../../services/api/communityClient';
import { buildReadFailureCopy, isDegradedReadError } from '../../../src/utils/readDegradedUX';

interface ChatRoom {
  id: string;
  type: string;
  isPact: boolean;
  unreadCount: number;
  contextId?: string;
  lastMessage?: { content: string; created_at: string } | null;
  participants: Array<{ id: string; name: string; avatar: string }>;
}

type ApiRoomParticipant = {
  profile?: { id?: string; name?: string; avatar?: string } | null;
  profile_id?: string;
};

type ApiChatRoomRow = {
  id?: string;
  type?: string;
  unreadCount?: number;
  context_id?: string | null;
  messages?: Array<{ content?: string; created_at?: string }> | null;
  participants?: ApiRoomParticipant[] | null;
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

function mapApiRoom(room: ApiChatRoomRow): ChatRoom {
  const participants: ChatRoom['participants'] = (room.participants || []).map((p) => ({
    id: p.profile?.id || p.profile_id || '',
    name: p.profile?.name || 'Usuário',
    avatar: p.profile?.avatar || '',
  }));

  const lastMsg = Array.isArray(room.messages) && room.messages.length > 0
    ? room.messages[0]
    : null;

  return {
    id: String(room.id || ''),
    type: room.type || 'private',
    isPact: room.type === 'escambo' || room.type === 'healing_circle',
    unreadCount: room.unreadCount || 0,
    contextId: room.context_id || undefined,
    lastMessage: lastMsg
      ? { content: lastMsg.content || '', created_at: lastMsg.created_at || '' }
      : null,
    participants,
  };
}

export default function ChatListScreen() {
  const { go, back, selectChatRoom, selectTribeRoomContext } = useBuscadorFlow();
  const { messages } = useChat();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIssue, setReadIssue] = useState<{ title: string; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const realtimeRefreshTimer = useRef<number | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setReadIssue(null);
    try {
      const data = await communityApi.chat.listRooms(undefined, { strict: true });
      const normalized = Array.isArray(data) ? (data as ApiChatRoomRow[]).map(mapApiRoom) : [];
      setRooms(normalized);
    } catch (err: unknown) {
      console.error('[ChatListScreen] listRooms failed:', errorMessage(err));
      setReadIssue(buildReadFailureCopy(['chat'], isDegradedReadError(err)));
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    // ChatContext already receives Supabase realtime updates; revalidate room list with debounce.
    if (realtimeRefreshTimer.current) {
      window.clearTimeout(realtimeRefreshTimer.current);
    }
    realtimeRefreshTimer.current = window.setTimeout(() => {
      loadRooms().catch(() => undefined);
    }, 300);
    return () => {
      if (realtimeRefreshTimer.current) {
        window.clearTimeout(realtimeRefreshTimer.current);
        realtimeRefreshTimer.current = null;
      }
    };
  }, [messages.length, loadRooms]);

  const filtered = rooms.filter(room => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return room.participants.some(p => p.name.toLowerCase().includes(term));
  });

  const pactRooms = filtered.filter(r => r.isPact);
  const regularRooms = filtered;

  const getOther = (room: ChatRoom) =>
    room.participants.find(p => p.id !== 'me') || room.participants[0] || { id: '', name: 'Chat', avatar: '' };

  const openRoom = (room: ChatRoom) => {
    const other = getOther(room);
    selectChatRoom({ id: room.id, name: other.name || 'Chat' });
    if (room.type === 'healing_circle' || room.type === 'support_room') {
      selectTribeRoomContext({
        type: room.type,
        contextId: room.contextId,
      });
    } else {
      selectTribeRoomContext(null);
    }
    go('CHAT_ROOM');
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PortalView title="Tribo Conectada" subtitle="SUAS CONVERSAS" onBack={back}>
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" size={18} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar alma ou pacto..."
            className="w-full bg-white border border-nature-100 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
          />
        </div>

        {/* Active Pacts (horizontal scroll) */}
        {pactRooms.length > 0 && (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            <div
              className="flex flex-col items-center gap-2 min-w-[4rem] cursor-pointer group"
              onClick={() => go('CHAT_NEW')}
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-300 flex items-center justify-center text-indigo-300 bg-white shadow-sm group-hover:border-indigo-500 group-hover:text-indigo-500 transition-colors">
                <MessageCircle size={24} />
              </div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 group-hover:text-indigo-600">Novo</span>
            </div>
            {pactRooms.map(room => {
              const other = getOther(room);
              return (
                <div
                  key={room.id}
                  className="flex flex-col items-center gap-2 min-w-[4rem] cursor-pointer"
                  onClick={() => openRoom(room)}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-indigo-400 p-0.5">
                      <DynamicAvatar user={{ name: other.name, avatar: other.avatar } as any} size="lg" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white">
                      <Flame size={10} />
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-nature-600 truncate w-16 text-center">
                    {other.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Chat List */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-nature-100 overflow-hidden min-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-nature-400 gap-3">
              <Loader size={18} className="animate-spin" />
              <span className="text-sm italic">Sintonizando frequências...</span>
            </div>
          ) : readIssue ? (
            <div className="p-8 text-center">
              <DegradedRetryNotice
                title={readIssue.title}
                message={readIssue.message}
                onRetry={loadRooms}
                compact
              />
            </div>
          ) : regularRooms.length === 0 ? (
            <div className="p-12 text-center text-nature-400">
              <MessageCircle size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm italic">
                {search ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ainda. Conecte-se com uma alma!'}
              </p>
              {!search && (
                <button
                  onClick={() => go('CHAT_NEW')}
                  className="mt-4 px-6 py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  + Nova Conversa
                </button>
              )}
            </div>
          ) : (
            regularRooms.map((room, i) => {
              const other = getOther(room);
              const lastMsg = room.lastMessage;
              return (
                <div
                  key={room.id}
                  onClick={() => openRoom(room)}
                  className={`p-4 flex items-center gap-4 hover:bg-nature-50 cursor-pointer transition-colors ${i !== regularRooms.length - 1 ? 'border-b border-nature-50' : ''
                    }`}
                >
                  <DynamicAvatar user={{ name: other.name, avatar: other.avatar } as any} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-nature-900 text-sm">{other.name}</h4>
                      {lastMsg?.created_at && (
                        <span className="text-[10px] font-bold text-nature-300">
                          {formatTime(lastMsg.created_at)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${room.unreadCount > 0 ? 'font-bold text-nature-800' : 'text-nature-400'
                      }`}>
                      {lastMsg?.content || 'Inicie a conversa'}
                    </p>
                  </div>
                  {room.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md animate-pulse">
                      {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </PortalView>
  );
}
