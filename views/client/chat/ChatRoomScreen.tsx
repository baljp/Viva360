import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Message } from '../../../types';
import { DynamicAvatar } from '../../../components/Common';
import { Send, Phone, Video, MoreVertical, Paperclip, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { api } from '../../../services/api';
import { communityApi } from '../../../services/api/communityClient';
import { useChatRoomRealtime } from '../../../src/hooks/useChatRoomRealtime';

type ChatMessageApiRow = {
  id?: string;
  sender_id?: string;
  content?: string;
  read?: boolean;
  created_at?: string;
};

const toMessage = (row: ChatMessageApiRow): Message => ({
  id: String(row.id || `msg_${Date.now()}`),
  senderId: String(row.sender_id || ''),
  content: String(row.content || ''),
  timestamp: String(row.created_at || new Date().toISOString()),
  read: !!row.read,
  type: 'text',
});

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export default function ChatRoomScreen({ roomId }: { roomId?: string }) {
  const { back, state, go } = useBuscadorFlow();
  const activeRoomId = String(roomId || state.selectedChatRoom?.id || '').trim();
  const roomLabel = state.selectedChatRoom?.name || 'Conversa';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [myId, setMyId] = useState<string>('');

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }, []);

  useEffect(() => {
    api.auth.getCurrentSession().then((u) => u && setMyId(u.id));
  }, []);

  const loadRoomMessages = useCallback(async () => {
    if (!activeRoomId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoadError(null);
    setLoading(true);
    try {
      const data = await communityApi.chat.getMessages(activeRoomId);
      const normalized = (Array.isArray(data) ? (data as ChatMessageApiRow[]) : [])
        .map(toMessage)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(normalized);
    } catch (error: unknown) {
      setLoadError(errorMessage(error) || 'Não foi possível carregar as mensagens.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [activeRoomId]);

  const { realtimeStatus, usingFallbackPolling } = useChatRoomRealtime({
    roomId: activeRoomId || null,
    enabled: !!activeRoomId,
    load: loadRoomMessages,
  });

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleSend = async () => {
    if (!activeRoomId || !input.trim() || sending) return;
    setSending(true);
    try {
      const response = await communityApi.chat.sendMessage(activeRoomId, input.trim());
      const created = response && typeof response === 'object' ? (response as ChatMessageApiRow) : null;
      if (created?.id) {
        setMessages((prev) => [...prev, toMessage(created)]);
      } else {
        await loadRoomMessages();
      }
      setInput('');
      scrollToBottom();
    } catch (error: unknown) {
      setLoadError(errorMessage(error) || 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenAttachmentPicker = () => {
    attachmentInputRef.current?.click();
  };

  const handleAttachmentSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setInput((prev) => `${prev}${prev ? '\n' : ''}[Arquivo anexado: ${file.name}]`);
    event.target.value = '';
  };

  if (!activeRoomId) {
    return (
      <div className="min-h-screen bg-[#ece5dd] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-nature-100">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle size={26} />
          </div>
          <h3 className="text-lg font-bold text-nature-900 mb-2">Sala não selecionada</h3>
          <p className="text-sm text-nature-500 mb-6">
            Volte para a lista de conversas e selecione uma sala real para abrir o chat.
          </p>
          <button
            onClick={back}
            className="w-full py-3 bg-nature-900 text-white rounded-xl text-sm font-bold uppercase tracking-wider"
          >
            Voltar para conversas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#ece5dd]">
      <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-200 z-10">
        <div className="flex items-center gap-3">
          <button onClick={back} className="mr-1 text-nature-600 hover:bg-black/5 p-2 rounded-full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <DynamicAvatar user={{ name: roomLabel, avatar: '' } as any} size="sm" />
          <div>
            <h4 className="font-bold text-gray-800 text-sm leading-none">{roomLabel}</h4>
            <span className="text-[10px] text-nature-500 font-medium">
              {realtimeStatus === 'subscribed' ? 'Realtime ativo' : usingFallbackPolling ? 'Polling de fallback' : 'Conectando...'}
            </span>
          </div>
        </div>
        <div className="flex gap-4 text-nature-600">
          <Video size={20} className="hover:text-nature-900 cursor-pointer" />
          <Phone size={20} className="hover:text-nature-900 cursor-pointer" />
          <button
              onClick={() => go('CHAT_SETTINGS')}
              className="hover:text-nature-900 cursor-pointer p-1 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Configurações da sala"
            >
              <MoreVertical size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efe7dd] bg-opacity-50">
        {loading && <div className="text-center text-xs text-gray-400 mt-4">Carregando mensagens...</div>}
        {!loading && loadError && (
          <div className="mx-auto max-w-md bg-rose-50 border border-rose-100 rounded-2xl p-3 text-rose-700 text-xs text-center">
            {loadError}
          </div>
        )}

        {messages.map((msg) => {
          const isMe = !!myId && msg.senderId === myId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 shadow-sm relative text-sm ${isMe ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                <p className="leading-relaxed">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                  <span className="text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && (msg.read ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} />)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="p-3 bg-white flex items-center gap-2 shadow-inner">
        <button aria-label="Anexar arquivo" onClick={handleOpenAttachmentPicker} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Paperclip size={20} /></button>
        <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleAttachmentSelected} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Digite uma mensagem..."
          className="flex-1 bg-white px-4 py-2.5 rounded-2xl border-none outline-none text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-emerald-200"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors shadow-sm active:scale-95 disabled:opacity-60"
        >
          <Send size={18} className="translate-x-0.5 translate-y-0.5" />
        </button>
      </div>
    </div>
  );
}
