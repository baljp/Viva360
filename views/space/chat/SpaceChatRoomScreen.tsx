import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PortalView } from '../../../components/Common';
import { Send, MoreVertical, Phone, Video } from 'lucide-react';
import { useSantuarioFlow } from '../../../src/flow/useSantuarioFlow';
import { communityApi } from '../../../services/api/communityClient';
import { useChatRoomRealtime } from '../../../src/hooks/useChatRoomRealtime';

type RoomMessage = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  read: boolean;
  sender?: { id: string; name?: string };
};

const asRecord = (value: unknown): Record<string, unknown> =>
  (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};

export default function SpaceChatRoomScreen() {
  const { back, state } = useSantuarioFlow();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeRoomId = state.selectedChatRoom?.id || '';
  const activeRoomName = state.selectedChatRoom?.name || 'Sala do Santuário';

  useEffect(() => {
    import('../../../services/api/authProxy').then(({ authApi }) => authApi.getCurrentSession())
      .then((u) => u && setMyId(u.id))
      .catch(() => undefined);
  }, []);

  const loadMessages = useCallback(async () => {
    if (!activeRoomId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const rows = await communityApi.chat.getMessages(activeRoomId);
    const normalized = (Array.isArray(rows) ? rows : [])
      .map((row): RoomMessage | null => {
        const raw = asRecord(row);
        const sender = asRecord(raw.sender);
        const id = String(raw.id || '').trim();
        if (!id) return null;
        return {
          id,
          content: String(raw.content || ''),
          created_at: String(raw.created_at || new Date().toISOString()),
          sender_id: String(raw.sender_id || ''),
          read: !!raw.read,
          sender: sender.id ? { id: String(sender.id), name: sender.name ? String(sender.name) : undefined } : undefined,
        };
      })
      .filter((msg): msg is RoomMessage => !!msg)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setMessages(normalized);
    setLoading(false);
  }, [activeRoomId]);

  useEffect(() => {
    loadMessages().catch(() => setLoading(false));
  }, [loadMessages]);

  const { usingFallbackPolling } = useChatRoomRealtime({
    roomId: activeRoomId,
    enabled: !!activeRoomId,
    load: loadMessages,
  });

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, [messages.length]);

  const handleSend = async () => {
    if (!activeRoomId || !inputText.trim()) return;
    const content = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, {
      id: `tmp_${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      sender_id: myId || 'me',
      read: false,
      sender: { id: myId || 'me', name: 'Você' },
    }]);
    try {
      await communityApi.chat.sendMessage(activeRoomId, content);
      await loadMessages();
    } catch {
      setInputText(content);
    }
  };

  const HeaderRight = () => (
    <div className="flex items-center gap-2">
      <button aria-label="Solicitar ligação de voz" onClick={() => setInputText((p) => `${p}${p ? '\n' : ''}[Solicitação de ligação de voz]`)} className="p-2 text-nature-400 hover:text-nature-600"><Phone size={20} /></button>
      <button aria-label="Solicitar chamada de vídeo" onClick={() => setInputText((p) => `${p}${p ? '\n' : ''}[Solicitação de chamada de vídeo]`)} className="p-2 text-nature-400 hover:text-nature-600"><Video size={20} /></button>
      <button aria-label="Mais opções" onClick={back} className="p-2 text-nature-400 hover:text-nature-600"><MoreVertical size={20} /></button>
    </div>
  );

  return (
    <PortalView
      title={activeRoomName}
      subtitle={usingFallbackPolling ? 'Sincronização segura (polling)' : 'Tempo real'}
      onBack={back}
      headerRight={<HeaderRight />}
    >
      <div className="flex flex-col h-[calc(100vh-180px)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeRoomId && (
            <div className="h-full flex items-center justify-center">
              <div className="bg-white border border-nature-100 rounded-[2rem] p-8 max-w-sm text-center shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-nature-300 mb-3">Sala não selecionada</p>
                <h3 className="font-serif italic text-xl text-nature-900 mb-2">Escolha uma sala do santuário</h3>
                <p className="text-sm text-nature-500 leading-relaxed">Volte para a lista anterior e abra uma conversa válida para iniciar o atendimento.</p>
              </div>
            </div>
          )}
          {activeRoomId && loading ? (
            <div className="flex justify-center p-8"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-nature-900"></span></div>
          ) : (
            activeRoomId && messages.map((msg) => {
              const isMe = !!myId && msg.sender_id === myId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${isMe ? 'bg-nature-900 text-white rounded-tr-none' : 'bg-white border border-nature-200 text-nature-800 rounded-tl-none shadow-sm'}`}>
                    {!isMe && msg.sender?.name && <p className="text-[10px] opacity-60 uppercase tracking-widest mb-1">{msg.sender.name}</p>}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className={`text-[9px] block mt-1 opacity-70 ${isMe ? 'text-nature-200' : 'text-nature-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 bg-white border-t border-nature-100 mt-auto">
          <div className="flex items-center gap-2">
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Escreva sua mensagem..."
              className="flex-1 bg-nature-50 border border-nature-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-nature-200"
            />
            <button
              aria-label="Enviar mensagem"
              onClick={handleSend}
              disabled={!activeRoomId || !inputText.trim()}
              className="p-3 bg-nature-900 text-white rounded-xl disabled:opacity-50 hover:scale-105 transition-transform"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </PortalView>
  );
}
