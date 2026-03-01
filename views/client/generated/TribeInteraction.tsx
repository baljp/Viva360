import React, { useCallback, useEffect, useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { Heart, Send, Flame, Droplet, Sprout, Wind, Eye, Zap, Handshake } from 'lucide-react';
import { api } from '../../../services/api';
import { useChatRoomRealtime } from '../../../src/hooks/useChatRoomRealtime';

const ENERGIES = [
    { id: 'vitality', label: 'Vitalidade', icon: Flame, color: 'text-amber-500', bg: 'bg-amber-50', msg: 'Envio fogo vital para fortalecer sua vontade! 🔥' },
    { id: 'calm', label: 'Calma', icon: Droplet, color: 'text-cyan-500', bg: 'bg-cyan-50', msg: 'Que a serenidade das águas te envolva. 💧' },
    { id: 'growth', label: 'Crescimento', icon: Sprout, color: 'text-emerald-500', bg: 'bg-emerald-50', msg: 'Honro seu florescer. Continue crescendo! 🌱' },
    { id: 'lightness', label: 'Leveza', icon: Wind, color: 'text-sky-400', bg: 'bg-sky-50', msg: 'Solte o peso. Respire e flua com o vento. 🌬️' },
    { id: 'clarity', label: 'Clareza', icon: Eye, color: 'text-indigo-500', bg: 'bg-indigo-50', msg: 'Que a visão se abra e a verdade se revele. 👁️' },
    { id: 'love', label: 'Amor', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', msg: 'Um abraço de alma para alma. Estamos juntos. ❤️' },
];

type RoomType = 'support_room' | 'healing_circle';

type ApiChatRoom = {
  id: string;
  type: string;
  context_id?: string | null;
};

type ApiChatMessage = {
  id: string;
  content: string;
  created_at?: string;
  sender_id?: string;
  sender?: { id: string; name?: string | null; avatar?: string | null };
};

function parseEnergy(content: string): { energyId: string; text: string } | null {
  const m = content.match(/^::energy\(([^)]+)\)::(.*)$/s);
  if (!m) return null;
  return { energyId: m[1], text: (m[2] || '').trim() };
}

interface Message {
  id: string;
  user: string;
  avatar: string;
  text: string;
  likes?: number;
  type: 'chat' | 'energy';
  energy?: string;
  mine: boolean;
  createdAt?: string;
}

export default function TribeInteraction() {
  const { go, back, state } = useBuscadorFlow();
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [myId, setMyId] = useState<string>('');
  const [room, setRoom] = useState<ApiChatRoom | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinAttempt, setJoinAttempt] = useState(0);

  const roomType: RoomType = (state.tribeRoomContext?.type || 'support_room') as RoomType;
  const roomContextId = state.tribeRoomContext?.contextId;

  const headerTitle = roomType === 'healing_circle' ? 'Círculo de Cura' : 'Sala de Apoio Coletivo';
  const headerHint = roomType === 'healing_circle' ? '12 Guardiões Online' : 'Presença acolhedora';

  const avatarClassForUser = (userId: string) => {
    if (userId === myId) return 'bg-emerald-100';
    // Stable-ish color bucket by last char
    const c = userId.slice(-1);
    const idx = (c.charCodeAt(0) || 0) % 3;
    return idx === 0 ? 'bg-indigo-100' : idx === 1 ? 'bg-rose-100' : 'bg-amber-100';
  };

  const mapApiMessage = useCallback((m: ApiChatMessage): Message => {
    const senderId = m.sender?.id || m.sender_id || '';
    const energy = parseEnergy(m.content || '');
    return {
      id: m.id,
      user: senderId === myId ? 'Você' : (m.sender?.name || 'Alma'),
      avatar: avatarClassForUser(senderId || m.id),
      text: energy ? energy.text : (m.content || ''),
      likes: 0,
      type: energy ? 'energy' : 'chat',
      energy: energy?.energyId,
      mine: !!myId && senderId === myId,
      createdAt: m.created_at,
    };
  }, [myId]);

  const loadMessages = useCallback(async (roomId: string) => {
    const raw = (await api.chat.getMessages(roomId)) as ApiChatMessage[];
    const sorted = [...(raw || [])].reverse(); // API returns desc
    setMessages(sorted.map(mapApiMessage));
  }, [mapApiMessage]);

  useEffect(() => {
    api.auth.getCurrentSession().then((u) => u && setMyId(u.id));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const join = async () => {
      setIsConnecting(true);
      setJoinError(null);
      const result = await api.chat.joinRoom({ type: roomType, contextId: roomContextId });
      const chat = (result as Record<string, unknown>)?.chat as ApiChatRoom | undefined;
      if (!chat || cancelled) {
        if (!cancelled) {
          setJoinError('Não foi possível abrir o portal agora. Tente novamente.');
          setIsConnecting(false);
        }
        return;
      }
      setRoom(chat);
      await loadMessages(chat.id);

      setIsConnecting(false);
    };

    join().catch((e: any) => {
      console.warn('Tribo room join failed', e);
      if (!cancelled) {
        setJoinError('Não foi possível abrir o portal agora. Tente novamente.');
        setIsConnecting(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [roomType, roomContextId, joinAttempt]);

  const loadCurrentRoomMessages = useCallback(async () => {
    if (!room?.id) return;
    await loadMessages(room.id);
  }, [room?.id, loadMessages]);

  const { usingFallbackPolling } = useChatRoomRealtime({
    roomId: room?.id,
    enabled: !!room?.id && !isConnecting && !joinError,
    load: loadCurrentRoomMessages,
  });

  const handleSend = () => {
      if (!room?.id) return;

      if (selectedEnergy) {
        const energy = ENERGIES.find(e => e.id === selectedEnergy);
        if (!energy) return;
        const content = `::energy(${energy.id})::${energy.msg}`;

        const optimistic: Message = {
          id: `tmp_${Date.now()}`,
          user: 'Você',
          avatar: 'bg-emerald-100',
          text: energy.msg,
          likes: 0,
          type: 'energy',
          energy: energy.id,
          mine: true,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setSelectedEnergy(null);
        api.chat.sendMessage(room.id, content).then(() => loadMessages(room.id)).catch(() => undefined);
        return;
      }

      if (inputText.trim()) {
        const content = inputText.trim();
        const optimistic: Message = {
          id: `tmp_${Date.now()}`,
          user: 'Você',
          avatar: 'bg-emerald-100',
          text: content,
          likes: 0,
          type: 'chat',
          mine: true,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setInputText("");
        api.chat.sendMessage(room.id, content).then(() => loadMessages(room.id)).catch(() => undefined);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white p-6 shadow-sm flex items-center gap-4 z-10 sticky top-0">
           <button onClick={back} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">←</button>
           <div className="flex-1">
               <h1 className="font-bold text-slate-900">{headerTitle}</h1>
               <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> {headerHint}</p>
               {room?.id && !isConnecting && (
                 <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                   {usingFallbackPolling ? 'Modo seguro (polling)' : 'Tempo real'}
                 </p>
               )}
               {room?.id && !isConnecting && (
                 <span data-testid="tribo-room-ready" className="sr-only">ready</span>
               )}
           </div>
           <button onClick={() => go('SOUL_PACT')} className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition-colors" title="Pactos">
              <Handshake size={20} />
           </button>
       </header>

       {/* Keep enough space for the composer + mobile bottom nav */}
       <div className="flex-1 p-6 overflow-y-auto space-y-6 pb-[calc(18rem+env(safe-area-inset-bottom))]">
           {isConnecting && (
             <div className="bg-white border border-slate-100 rounded-2xl p-4 text-slate-500 text-xs font-medium italic">
               Sincronizando sala...
             </div>
           )}
           {joinError && (
             <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-700 text-xs font-bold uppercase tracking-widest flex items-center justify-between gap-3">
               <span>{joinError}</span>
               <button
                 className="px-3 py-2 bg-white rounded-xl border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest"
                 onClick={() => {
                   setJoinError(null);
                   setRoom(null);
                   setMessages([]);
                   setJoinAttempt((n) => n + 1);
                 }}
               >
                 Tentar
               </button>
             </div>
           )}
           {messages.map((msg) => (
             <div key={msg.id} className={`flex gap-4 ${msg.mine ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-10 h-10 rounded-full flex-shrink-0 ${msg.avatar}`}></div>
                 <div className={`${msg.mine ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-600 rounded-tl-none'} p-4 rounded-2xl shadow-sm max-w-[80%] break-words whitespace-pre-wrap`}>
                     {msg.type === 'energy' ? (
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center`}>
                                <Zap size={20} className={msg.mine ? 'text-amber-300' : 'text-amber-500'} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase opacity-70 block mb-1">Energia Enviada</span>
                                <p className="text-sm font-medium italic">"{msg.text}"</p>
                            </div>
                        </div>
                     ) : (
                        <>
                           {!msg.mine && <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{msg.user}</p>}
                           <p className="text-sm">{msg.text}</p>
                        </>
                     )}
                 </div>
             </div>
           ))}
       </div>

       {/* Composer: lift above the floating mobile bottom nav and respect safe-area */}
       <div className="p-4 bg-white border-t border-slate-100 fixed inset-x-0 z-[250] lg:bottom-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
           {/* Energy Selector */}
           <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
               {ENERGIES.map(e => (
                   <button 
                      key={e.id}
                      disabled={isConnecting || !!joinError}
                      onClick={() => setSelectedEnergy(selectedEnergy === e.id ? null : e.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl border flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${selectedEnergy === e.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                   >
                       <e.icon size={16} className={selectedEnergy === e.id ? 'text-white' : e.color} />
                       <span className="text-xs font-bold whitespace-nowrap">{e.label}</span>
                   </button>
               ))}
           </div>

           <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100 relative">
               <input 
                  type="text" 
                  value={selectedEnergy ? ENERGIES.find(e => e.id === selectedEnergy)?.msg : inputText}
                  onChange={e => !selectedEnergy && setInputText(e.target.value)}
                  readOnly={!!selectedEnergy}
                  disabled={isConnecting || !!joinError}
                  placeholder="Compartilhe sua luz..." 
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!isConnecting && !joinError) handleSend();
                      }
                  }}
                  className={`flex-1 bg-transparent border-none outline-none px-4 text-sm ${selectedEnergy ? 'text-indigo-600 font-medium italic' : ''}`} 
               />
               <button
                 aria-label="Enviar mensagem"
                 disabled={isConnecting || !!joinError}
                 onClick={handleSend}
                 className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Send size={18} />
               </button>
           </div>
       </div>
    </div>
  );
}
