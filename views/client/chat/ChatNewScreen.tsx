import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DynamicAvatar } from '../../../components/Common';
import { Search, ArrowLeft, Loader, MessageSquarePlus, UserX } from 'lucide-react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { communityApi } from '../../../services/api/communityClient';

interface SearchProfile {
  id: string;
  name: string;
  avatar: string | null;
  role: string | null;
}

type ApiChatRoom = { id?: string; chat?: { id?: string } };

export default function ChatNewScreen() {
  const { back, go, selectChatRoom, selectTribeRoomContext, notify } = useBuscadorFlow();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null); // userId being started
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await communityApi.chat.searchProfiles(q);
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const handleStartChat = async (profile: SearchProfile) => {
    if (starting) return;
    setStarting(profile.id);
    try {
      const result = await communityApi.chat.startPrivate(profile.id) as ApiChatRoom;
      const roomId = String(result?.id || result?.chat?.id || '').trim();
      if (!roomId) throw new Error('No room ID returned');

      selectChatRoom({ id: roomId, name: profile.name });
      selectTribeRoomContext(null);
      go('CHAT_ROOM');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('No active link')) {
        notify?.(
          'Conexão necessária',
          `Você precisa ter um vínculo ativo com ${profile.name} para iniciar uma conversa.`,
          'warning'
        );
      } else {
        notify?.('Erro', 'Não foi possível iniciar a conversa. Tente novamente.', 'error');
      }
    } finally {
      setStarting(null);
    }
  };

  const roleLabel = (role: string | null) => {
    if (role === 'PROFESSIONAL') return 'Guardião';
    if (role === 'SPACE') return 'Santuário';
    return 'Buscador';
  };

  const showEmpty = !searching && query.trim().length >= 2 && results.length === 0;
  const showHint  = query.trim().length < 2 && !searching;

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm border-b border-nature-100 sticky top-0 z-10">
        <button onClick={back} className="p-2 text-nature-600 hover:bg-nature-100 rounded-full transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="font-bold text-nature-900 text-base leading-tight">Nova Conversa</h1>
          <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Buscar alma para conectar</p>
        </div>
      </div>

      {/* Search input */}
      <div className="px-5 pt-5 pb-2 bg-white border-b border-nature-50 sticky top-[73px] z-10 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300 pointer-events-none"
            size={18}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full bg-nature-50 border border-nature-100 py-3.5 pl-12 pr-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all"
          />
          {searching && (
            <Loader size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-nature-300" />
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {showHint && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8 text-nature-400">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquarePlus size={32} className="text-indigo-300" />
            </div>
            <p className="font-serif italic text-lg text-nature-700 mb-2">Conecte-se com uma alma</p>
            <p className="text-sm">Digite pelo menos 2 letras para buscar por nome.</p>
          </div>
        )}

        {showEmpty && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8 text-nature-400">
            <UserX size={40} className="mb-4 opacity-30" />
            <p className="font-serif italic text-nature-700">Nenhuma alma encontrada</p>
            <p className="text-sm mt-1">Tente outro nome ou convide alguém para a tribo.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white mx-4 mt-4 rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden divide-y divide-nature-50">
            {results.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleStartChat(profile)}
                disabled={!!starting}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-nature-50 active:bg-nature-100 transition-colors text-left group disabled:opacity-60"
              >
                <DynamicAvatar
                  user={{ name: profile.name, avatar: profile.avatar ?? '' } as any}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-nature-900 text-sm truncate">{profile.name}</p>
                  <p className="text-[10px] text-nature-400 uppercase font-bold tracking-wider mt-0.5">
                    {roleLabel(profile.role)}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  starting === profile.id
                    ? 'bg-indigo-100 text-indigo-400'
                    : 'bg-indigo-50 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'
                }`}>
                  {starting === profile.id ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <MessageSquarePlus size={14} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <p className="text-center text-[10px] text-nature-300 py-6 italic">
            Apenas usuários com vínculo ativo na sua rede aparecem aqui.
          </p>
        )}
      </div>
    </div>
  );
}
