
import React, { useState, useEffect } from 'react';
import { ViewState, Appointment, User } from '../types';
import { Video, Mic, MicOff, VideoOff, X, FileText, Heart, ShieldCheck, Ticket, History, Calendar as CalendarIcon, Tag, Timer, ArrowUpRight, PlayCircle, Lock } from 'lucide-react';
import { DynamicAvatar, OrganicSkeleton, PortalView } from '../components/Common';
import { useGuardiaoFlow } from '../src/flow/useGuardiaoFlow';
import { useOrdersList } from '../src/hooks/useOrdersList';
import type { OrdersTab } from '../src/hooks/useOrdersList';
import { useAppToast } from '../src/contexts/AppToastContext';
import { request } from '../services/api/core';

// ✅ VideoSessionView — JWT-authenticated Jitsi session (P0 Security Fix)
interface VideoFlowLike {
  state?: { selectedAppointment?: Appointment | null };
  go?: (s: string) => void;
  back?: () => void;
}

export const VideoSessionView: React.FC<{ appointment?: Appointment, onEnd?: () => void, flow?: VideoFlowLike }> = ({ appointment, onEnd, flow }) => {
  // ✅ Hook chamado incondicionalmente no top-level (Rules of Hooks)
  const guardiaoFlow = useGuardiaoFlow();
  const contextApt = guardiaoFlow?.state?.selectedAppointment ?? null;

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [jitsiUrl, setJitsiUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>('loading...');
  const [tokenLoading, setTokenLoading] = useState(true);

  // ✅ Usa appointment real: props > flow context > flow prop. Sem mock fallback.
  const activeAppointment: Appointment | null =
    appointment ?? contextApt ?? flow?.state?.selectedAppointment ?? null;

  // ✅ Sem window.location.href — navega via flow
  const handleEnd = onEnd ?? (() => {
    if (guardiaoFlow?.go) { guardiaoFlow.go('DASHBOARD'); return; }
    if (guardiaoFlow?.back) { guardiaoFlow.back(); return; }
    window.history.back();
  });

  // 🔐 P0 Fix: fetch JWT token from backend — room name is hashed (unpredictable)
  useEffect(() => {
    let cancelled = false;
    setTokenLoading(true);
    const appointmentId = activeAppointment?.id;

    request('/video/token', {
      method: 'POST',
      purpose: 'video-token',
      body: JSON.stringify({ appointmentId }),
    })
      .then((raw) => {
        if (cancelled) return;
        const data = raw as { token: string | null; roomName: string; url: string; domain: string };
        setRoomName(data.roomName);
        setJitsiUrl(data.url);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback: hashed room from appointmentId without JWT (still better than predictable name)
        const jitsiDomain = (import.meta.env as Record<string, string>).VITE_JITSI_DOMAIN || 'meet.jit.si';
        const fallbackRoom = appointmentId
          ? `viva360-session-${appointmentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`
          : `viva360-${Date.now()}`;
        setRoomName(fallbackRoom);
        setJitsiUrl(`https://${jitsiDomain}/${encodeURIComponent(fallbackRoom)}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`);
      })
      .finally(() => { if (!cancelled) setTokenLoading(false); });

    return () => { cancelled = true; };
  }, [activeAppointment?.id]);

  return (
    <div className="fixed inset-0 z-[500] bg-nature-900 flex flex-col animate-in fade-in duration-500 h-full w-full">
      {/* Top Header */}
      <div className="flex-none p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex items-center justify-between text-white bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center font-serif text-xl italic shadow-lg">V</div>
          <div>
            <h3 className="font-bold text-sm">{activeAppointment?.serviceName ?? 'Ritual de Cura'}</h3>
            <p className="text-[10px] text-primary-300 font-bold uppercase tracking-widest flex items-center gap-1.5"><Timer size={10} className="animate-pulse" /> Sessão em curso</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!tokenLoading && <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full border border-emerald-400/30" title="Sala autenticada com JWT"><Lock size={10} className="text-emerald-400" /><span className="text-[9px] text-emerald-300 font-bold">Autenticado</span></div>}
          <button onClick={() => setShowNotes(!showNotes)} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10"><FileText size={20} /></button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative flex flex-col lg:flex-row gap-4 p-4 lg:p-8 overflow-hidden bg-nature-950">
        <div className="flex-1 bg-nature-900 rounded-[3rem] overflow-hidden relative shadow-2xl">
          {tokenLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary-500/30 border-t-primary-400 animate-spin" />
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Preparando sala segura...</p>
            </div>
          ) : jitsiUrl ? (
            <iframe
              title="Viva360 Sessão Segura"
              src={jitsiUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="absolute inset-0 w-full h-full"
            />
          ) : null}
          {!tokenLoading && (
            <div className="absolute bottom-6 left-6 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
              <span className="text-xs font-bold text-white">{activeAppointment?.clientName ?? 'Sessão Viva360'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Interaction Controls */}
      <div className="flex-none p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] flex justify-center items-center gap-6 relative z-20 bg-nature-900/50 backdrop-blur-md">
        <button onClick={() => setIsMicOn(!isMicOn)} className={`p-5 rounded-full shadow-xl transition-all active:scale-90 ${isMicOn ? 'bg-white/10 text-white border border-white/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        <button onClick={handleEnd} className="w-20 h-20 bg-rose-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-600/30 active:scale-90 transition-all hover:bg-rose-700">
          <X size={32} strokeWidth={3} />
        </button>
        <button onClick={() => setIsVideoOn(!isVideoOn)} className={`p-5 rounded-full shadow-xl transition-all active:scale-90 ${isVideoOn ? 'bg-white/10 text-white border border-white/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
          {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
      </div>
    </div>
  );
};

export const OrdersListView: React.FC<{ user: User, onBack: () => void, setView: (v: ViewState) => void }> = ({ user, onBack, setView }) => {
  const { state, actions } = useOrdersList(user);
  const { activeTab, items, isLoading } = state;
  const { setActiveTab } = actions;
  const { showToast: setToast } = useAppToast();
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  const handleCopyVoucher = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedVoucher(code);
      setToast({ title: 'Chave Copiada', message: 'O código do voucher está na sua área de transferência.', type: 'success' });
      setTimeout(() => setCopiedVoucher(null), 2500);
    } catch (error) {
      console.error('Falha ao copiar voucher', error);
      setToast({ title: 'Erro ao Copiar', message: 'Não foi possível copiar o código automaticamente.', type: 'error' });
    }
  };

  return (
    <PortalView
      title="Cofre Sagrado"
      subtitle="GESTÃO DE ATIVOS"
      onBack={onBack}
      heroImage="https://images.unsplash.com/photo-1518609878319-a16322081109?q=80&w=800"
    >

      <div className="flex gap-2 px-4 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'rituais', label: 'Rituais', icon: Heart },
          { id: 'vouchers', label: 'Vouchers', icon: Ticket },
          { id: 'historico', label: 'Histórico', icon: History }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as OrdersTab)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-nature-900 text-white shadow-xl' : 'bg-white text-nature-400 border border-nature-100'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 px-4 flex-1">
        {isLoading ? (
          <div className="space-y-4"><OrganicSkeleton className="h-40 w-full" /><OrganicSkeleton className="h-40 w-full" /></div>
        ) : (
          <>
            {activeTab === 'rituais' && (
              items.filter(a => a.status === 'confirmed').length > 0 ? (
                items.filter(a => a.status === 'confirmed').map(apt => (
                  <div key={apt.id} className="bg-white p-8 rounded-[3.5rem] border border-primary-100 shadow-sm space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-[60px] flex items-center justify-center text-primary-300 opacity-40"><CalendarIcon size={40} /></div>
                    <div className="relative z-10 flex justify-between items-start">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-3xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform"><Heart size={32} /></div>
                        <div>
                          <h4 className="font-bold text-nature-900 text-base">{apt.serviceName}</h4>
                          <p className="text-[10px] text-nature-400 font-bold uppercase mt-1">Guardião: {apt.professionalName}</p>
                        </div>
                      </div>
                      <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse border border-emerald-100">Ativo</div>
                    </div>
                    <div className="pt-6 border-t border-nature-50 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-1.5"><Timer size={14} /> Inicia em 45min</p>
                        <p className="text-[11px] text-nature-900 font-bold uppercase">{new Date(apt.date).toLocaleDateString()} • {apt.time}</p>
                      </div>
                      <button onClick={() => setView(ViewState.CLIENT_VIDEO_SESSION)} className="p-5 bg-nature-900 text-white rounded-full shadow-2xl active:scale-90 transition-all hover:bg-black"><PlayCircle size={24} /></button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4 opacity-30"><Heart size={60} className="mx-auto" /><p className="italic text-sm">O silêncio do cofre... <br />Nenhum ritual agendado.</p></div>
              )
            )}

            {activeTab === 'vouchers' && (
              <div className="py-20 text-center space-y-4 opacity-30">
                <Ticket size={60} className="mx-auto" />
                <p className="italic text-sm">O cofre está vazio... <br />Nenhum voucher ativo no momento.</p>
              </div>
            )}

            {activeTab === 'historico' && (
              <div className="space-y-3">
                {items.filter(a => a.status === 'completed').map(apt => (
                  <div key={apt.id} className="p-6 bg-white border border-nature-100 rounded-[2.5rem] flex justify-between items-center group active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-nature-50 text-nature-300 rounded-2xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-all"><ShieldCheck size={20} /></div>
                      <div><h4 className="font-bold text-nature-800 text-sm">{apt.serviceName}</h4><p className="text-[10px] text-nature-400 font-bold uppercase mt-1">{new Date(apt.date).toLocaleDateString()}</p></div>
                    </div>
                    <div className="text-right"><span className="text-sm font-bold text-nature-900 leading-none">R$ {apt.price}</span><p className="text-[9px] text-emerald-500 font-bold uppercase mt-1">Concluído</p></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PortalView>
  );
};
