
import React, { useState, useEffect, useCallback } from 'react';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { MessageCircle, Search, Flame, Loader } from 'lucide-react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { useChat } from '../../../src/contexts/useChat';
import { api } from '../../../services/api';

interface ChatRoom {
  id: string;
  type: string;
  isPact: boolean;
  unreadCount: number;
  lastMessage?: { content: string; created_at: string } | null;
  participants: Array<{ id: string; name: string; avatar: string }>;
}

function mapApiRoom(room: any): ChatRoom {
  const participants: ChatRoom['participants'] = (room.participants || []).map((p: any) => ({
    id: p.profile?.id || p.profile_id || '',
    name: p.profile?.name || 'Usuário',
    avatar: p.profile?.avatar || '',
  }));

  const lastMsg = Array.isArray(room.messages) && room.messages.length > 0
    ? room.messages[0]
    : null;

  return {
    id: room.id,
    type: room.type || 'private',
    isPact: room.type === 'escambo' || room.type === 'healing_circle',
    unreadCount: room.unreadCount || 0,
    lastMessage: lastMsg
      ? { content: lastMsg.content || '', created_at: lastMsg.created_at || '' }
      : null,
    participants,
  };
}

export default function ChatListScreen() {
  const { go, back } = useBuscadorFlow();
  const { getMessagesWith } = useChat();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.chat.listRooms();
      const normalized = Array.isArray(data) ? data.map(mapApiRoom) : [];
      setRooms(normalized);
    } catch (err: any) {
      console.error('[ChatListScreen] listRooms failed:', err);
      setError('Não foi possível carregar as conversas.');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const filtered = rooms.filter(room => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return room.participants.some(p => p.name.toLowerCase().includes(term));
  });

  const pactRooms = filtered.filter(r => r.isPact);
  const regularRooms = filtered;

  const getOther = (room: ChatRoom) =>
    room.participants.find(p => p.id !== 'me') || room.participants[0] || { id: '', name: 'Chat', avatar: '' };

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
            <div className="flex flex-col items-center gap-2 min-w-[4rem]">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-nature-300 flex items-center justify-center text-nature-300 bg-white shadow-sm">
                <MessageCircle size={24} />
              </div>
              <span className="text-[10px] uppercase font-bold text-nature-400">Novo</span>
            </div>
            {pactRooms.map(room => {
              const other = getOther(room);
              return (
                <div
                  key={room.id}
                  className="flex flex-col items-center gap-2 min-w-[4rem] cursor-pointer"
                  onClick={() => go('CHAT_ROOM')}
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
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <button
                onClick={loadRooms}
                className="text-xs font-bold text-indigo-500 underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : regularRooms.length === 0 ? (
            <div className="p-12 text-center text-nature-400">
              <MessageCircle size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm italic">
                {search ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ainda. Conecte-se com uma alma!'}
              </p>
            </div>
          ) : (
            regularRooms.map((room, i) => {
              const other = getOther(room);
              const lastMsg = room.lastMessage;
              return (
                <div
                  key={room.id}
                  onClick={() => go('CHAT_ROOM')}
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
