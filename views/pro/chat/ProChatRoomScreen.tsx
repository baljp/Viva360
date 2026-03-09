import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DynamicAvatar } from '../../../components/Common';
import { Send, Video, MoreVertical, Paperclip, Check, CheckCheck, FileText, ClipboardList, Shield } from 'lucide-react';
import { useGuardiaoFlow } from '../../../src/flow/useGuardiaoFlow';
import { communityApi } from '../../../services/api/communityClient';
import { useChatRoomRealtime } from '../../../src/hooks/useChatRoomRealtime';

type ApiRoomMessage = {
  id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_id: string;
  sender?: { id: string; name?: string; avatar?: string };
};

type UiMessage = {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  read: boolean;
  senderName?: string;
  senderAvatar?: string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};

const mapApiMessage = (value: unknown): UiMessage | null => {
  const raw = asRecord(value);
  const sender = asRecord(raw.sender);
  const id = String(raw.id || '').trim();
  if (!id) return null;
  return {
    id,
    content: String(raw.content || ''),
    senderId: String(raw.sender_id || ''),
    timestamp: String(raw.created_at || new Date().toISOString()),
    read: !!raw.read,
    senderName: sender.name ? String(sender.name) : undefined,
    senderAvatar: sender.avatar ? String(sender.avatar) : undefined,
  };
};

export default function ProChatRoomScreen({ roomId }: { roomId?: string }) {
  const { go, state } = useGuardiaoFlow();
  const activeRoomId = roomId || state.selectedChatRoom?.id || '';
  const roomName = state.selectedChatRoom?.name || 'Conversa';

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    communityApi.chat.listRooms().then(() => undefined).catch(() => undefined);
  }, []);

  useEffect(() => {
    import('../../../services/api/authProxy').then(({ authApi }) => authApi.getCurrentSession())
      .then((u) => u && setMyId(String(u.id)))
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
      .map(mapApiMessage)
      .filter((msg): msg is UiMessage => !!msg)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
    if (!activeRoomId || !input.trim()) return;
    const content = input.trim();
    setInput('');
    setMessages((prev) => [...prev, {
      id: `tmp_${Date.now()}`,
      content,
      senderId: myId || 'me',
      timestamp: new Date().toISOString(),
      read: false,
      senderName: 'Você',
    }]);
    try {
      await communityApi.chat.sendMessage(activeRoomId, content);
      await loadMessages();
    } catch {
      setInput(content);
    }
  };

  const handleAttach = () => attachmentInputRef.current?.click();
  const handleAttachmentSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setInput((prev) => `${prev}${prev ? '\n' : ''}[Arquivo clínico: ${file.name}]`);
    event.target.value = '';
  };

  const statusLabel = useMemo(
    () => (usingFallbackPolling ? 'Sincronização segura (polling)' : 'Tempo real'),
    [usingFallbackPolling],
  );

  return (
    <div className="flex flex-col h-screen bg-[#f5f7fa]">
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm border-b border-indigo-50 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => go('CHAT_LIST')} className="mr-1 text-indigo-900 hover:bg-slate-100 p-2 rounded-full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>
          <DynamicAvatar user={{ name: roomName, avatar: '' }} size="sm" />
          <div>
            <h4 className="font-bold text-indigo-900 text-sm leading-none">{roomName}</h4>
            <span className="text-[10px] text-indigo-400 font-medium">{statusLabel}</span>
          </div>
        </div>
        <div className="flex gap-3 text-indigo-400">
          <div className="p-2 hover:bg-indigo-50 rounded-full cursor-pointer" title="Prontuário"><ClipboardList size={20} /></div>
          <Video size={20} className="hover:text-indigo-900 cursor-pointer" />
          <MoreVertical size={20} className="hover:text-indigo-900 cursor-pointer" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {!activeRoomId && (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white border border-slate-100 rounded-3xl px-6 py-8 text-center shadow-sm max-w-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300 mb-3">Sala não selecionada</p>
              <h3 className="text-lg font-serif italic text-indigo-950 mb-2">Escolha uma conversa para continuar</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Volte para a lista de chats e abra uma sala válida antes de enviar mensagens.</p>
              <button onClick={() => go('CHAT_LIST')} className="mt-5 px-5 py-3 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em]">
                Ir para conversas
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-center mb-4">
          <div className="bg-amber-50 text-amber-600 text-[10px] px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1">
            <Shield size={10} /> Ambiente Seguro & Criptografado (LGPD Compliant)
          </div>
        </div>
        {!activeRoomId ? null : loading ? <div className="text-center text-xs text-gray-400 mt-4">Carregando histórico clínico...</div> : null}
        {activeRoomId && messages.map((msg) => {
          const isMe = !!myId && msg.senderId === myId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm relative text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                {!isMe && msg.senderName && <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{msg.senderName}</p>}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 opacity-70 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                  <span className="text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && (msg.read ? <CheckCheck size={12} /> : <Check size={12} />)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
        <button aria-label="Anexar arquivo" onClick={handleAttach} className="p-2 text-indigo-300 hover:bg-indigo-50 rounded-full transition-colors"><Paperclip size={20} /></button>
        <button aria-label="Inserir template clínico" onClick={() => setInput((prev) => `${prev}${prev ? '\n' : ''}Resumo clínico: evolução observada, sinais principais e próximos passos.`)} className="p-2 text-indigo-300 hover:bg-indigo-50 rounded-full transition-colors"><FileText size={20} /></button>
        <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleAttachmentSelected} />
        <div className="flex-1 relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Escreva uma mensagem..."
            className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-transparent focus:border-indigo-100 focus:bg-white outline-none text-sm placeholder:text-slate-400 transition-all"
          />
        </div>
        <button aria-label="Enviar mensagem" onClick={handleSend} disabled={!activeRoomId || !input.trim()} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600">
          <Send size={18} className="translate-x-0.5 translate-y-0.5" />
        </button>
      </div>
    </div>
  );
}
