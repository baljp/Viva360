import React, { useCallback, useEffect, useState } from 'react';
import { DynamicAvatar } from '../../../components/Common';
import { Bell, BellOff, LogOut, ChevronLeft, Users, Loader, AlertCircle, Check } from 'lucide-react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { communityApi } from '../../../services/api/communityClient';

interface Participant {
  id: string;
  name: string;
  avatar: string | null;
  role: string | null;
}

interface RoomSettings {
  id: string;
  type: string;
  participants: Participant[];
  mySettings: {
    muted: boolean;
    mutedUntil: string | null;
  };
}

export default function ChatSettingsScreen({ roomId }: { roomId?: string }) {
  const { back, state, go, notify } = useBuscadorFlow();
  const activeRoomId = String(roomId || state.selectedChatRoom?.id || '').trim();
  const roomLabel = state.selectedChatRoom?.name || 'Conversa';

  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [muteLoading, setMuteLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const load = useCallback(async () => {
    if (!activeRoomId) { setLoading(false); return; }
    try {
      const data = await communityApi.chat.getRoomSettings(activeRoomId);
      setSettings(data as RoomSettings);
    } catch {
      notify?.('Erro', 'Não foi possível carregar as configurações.', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeRoomId, notify]);

  useEffect(() => { load(); }, [load]);

  const handleToggleMute = async () => {
    if (!activeRoomId || muteLoading) return;
    setMuteLoading(true);
    try {
      const result = await communityApi.chat.toggleMute(activeRoomId) as { muted: boolean };
      setSettings((prev) =>
        prev
          ? { ...prev, mySettings: { muted: result.muted, mutedUntil: null } }
          : prev
      );
      notify?.(
        result.muted ? 'Notificações silenciadas' : 'Notificações ativadas',
        result.muted ? 'Você não receberá alertas desta sala.' : 'Você voltará a receber alertas.',
        'info'
      );
    } catch {
      notify?.('Erro', 'Não foi possível alterar as notificações.', 'error');
    } finally {
      setMuteLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!activeRoomId || leaveLoading) return;
    if (!confirmLeave) { setConfirmLeave(true); return; }
    setLeaveLoading(true);
    try {
      await communityApi.chat.leaveRoom(activeRoomId);
      notify?.('Sala abandonada', 'Você saiu da conversa com sucesso.', 'info');
      go('CHAT_LIST');
    } catch {
      notify?.('Erro', 'Não foi possível sair da sala.', 'error');
      setLeaveLoading(false);
      setConfirmLeave(false);
    }
  };

  if (!activeRoomId) {
    return (
      <div className="min-h-screen bg-nature-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-nature-100">
          <AlertCircle size={32} className="mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-bold text-nature-900 mb-2">Sala não selecionada</h3>
          <button onClick={back} className="mt-4 w-full py-3 bg-nature-900 text-white rounded-xl text-sm font-bold uppercase tracking-wider">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm border-b border-nature-100 sticky top-0 z-10">
        <button onClick={back} className="p-2 text-nature-600 hover:bg-nature-100 rounded-full transition-colors">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="font-bold text-nature-900 text-base leading-tight">Configurações</h1>
          <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">{roomLabel}</p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5 max-w-lg mx-auto w-full">

        {loading ? (
          <div className="flex items-center justify-center py-20 text-nature-400 gap-3">
            <Loader size={20} className="animate-spin" />
            <span className="text-sm italic">Carregando configurações...</span>
          </div>
        ) : (
          <>
            {/* Participants */}
            <section className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-nature-50 flex items-center gap-2">
                <Users size={14} className="text-nature-400" />
                <h2 className="text-xs font-bold text-nature-500 uppercase tracking-widest">
                  Participantes ({settings?.participants.length ?? 0})
                </h2>
              </div>
              <div className="divide-y divide-nature-50">
                {(settings?.participants ?? []).map((p) => (
                  <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                    <DynamicAvatar user={{ name: p.name, avatar: p.avatar ?? '' }} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-nature-900 text-sm truncate">{p.name}</p>
                      <p className="text-[10px] text-nature-400 uppercase font-bold tracking-wider mt-0.5">
                        {p.role === 'PROFESSIONAL' ? 'Guardião' : p.role === 'SPACE' ? 'Santuário' : 'Buscador'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Notifications */}
            <section className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-nature-50">
                <h2 className="text-xs font-bold text-nature-500 uppercase tracking-widest">Notificações</h2>
              </div>
              <button
                onClick={handleToggleMute}
                disabled={muteLoading}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-nature-50 transition-colors active:bg-nature-100 group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                    settings?.mySettings.muted ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                  }`}>
                    {settings?.mySettings.muted ? <BellOff size={18} /> : <Bell size={18} />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-nature-900 text-sm">
                      {settings?.mySettings.muted ? 'Notificações silenciadas' : 'Notificações ativas'}
                    </p>
                    <p className="text-[10px] text-nature-400 mt-0.5">
                      {settings?.mySettings.muted
                        ? 'Toque para reativar alertas desta sala'
                        : 'Toque para silenciar esta sala'}
                    </p>
                  </div>
                </div>
                {muteLoading ? (
                  <Loader size={16} className="animate-spin text-nature-400" />
                ) : (
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings?.mySettings.muted ? 'bg-amber-200' : 'bg-emerald-400'
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                      settings?.mySettings.muted ? 'left-1' : 'left-7'
                    }`} />
                  </div>
                )}
              </button>
            </section>

            {/* Danger zone */}
            <section className="bg-white rounded-[2.5rem] border border-rose-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-rose-50">
                <h2 className="text-xs font-bold text-rose-400 uppercase tracking-widest">Zona de Saída</h2>
              </div>
              <button
                onClick={handleLeave}
                disabled={leaveLoading}
                className="w-full px-6 py-5 flex items-center gap-4 hover:bg-rose-50 transition-colors active:bg-rose-100 group"
              >
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  {leaveLoading ? <Loader size={18} className="animate-spin" /> : <LogOut size={18} />}
                </div>
                <div className="text-left flex-1">
                  {confirmLeave ? (
                    <>
                      <p className="font-bold text-rose-700 text-sm">Tem certeza? Toque novamente para confirmar</p>
                      <p className="text-[10px] text-rose-400 mt-0.5">Esta ação não pode ser desfeita</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-nature-900 text-sm">Sair da conversa</p>
                      <p className="text-[10px] text-nature-400 mt-0.5">Você não receberá mais mensagens desta sala</p>
                    </>
                  )}
                </div>
                {confirmLeave && !leaveLoading && (
                  <Check size={18} className="text-rose-500 shrink-0" />
                )}
              </button>
              {confirmLeave && (
                <button
                  onClick={() => setConfirmLeave(false)}
                  className="w-full py-3 text-[11px] font-bold text-nature-400 hover:text-nature-600 uppercase tracking-widest border-t border-rose-50"
                >
                  Cancelar
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
