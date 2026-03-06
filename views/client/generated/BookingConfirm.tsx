import React, { useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/useBuscadorFlow';
import { Check, Calendar, Clock, MapPin, Sparkles, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import { PortalView, DynamicAvatar } from '../../../components/Common';
import { api } from '../../../services/api';
import type { User } from '../../../types';
import { roundTripTelemetry } from '../../../lib/telemetry';
import { RecurrenceToggle, type RecurrenceState } from '../../../components/RecurrenceToggle';
import { errorMessage } from '../../../lib/frontendLogger';

// user é injetado pelo ScreenConnector via props spread
export default function BookingConfirm({ user, onClose }: { user?: User; onClose?: () => void }) {
  const { state, go, back, reset, notify, refreshData } = useBuscadorFlow();
  const [isBooking, setIsBooking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceState>({
    enabled: false,
    config: { freq: 'WEEKLY', byDay: [], count: 4 },
    preview: null,
    totalCount: 0,
  });

  const pro = state.data.pros.find(p => p.id === state.selectedProfessionalId);
  const dateStr = (state.selectedDate || new Date()).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });
  const timeStr = '14:30 - 15:30';

  // ── Round-trip garantido ─────────────────────────────────────────────────
  // 1. POST /appointments → cria registro no backend
  // 2. refreshData()       → recarrega lista de agendamentos no flow state
  // 3. só então navega    → garante que o dado persiste mesmo após F5
  const selectedDate = state.selectedDate || new Date();
  const startAtIso   = selectedDate.toISOString();

  const handleConfirm = async () => {
    if (!pro || !user || isBooking) return;
    setIsBooking(true);
    const rt = roundTripTelemetry.start('booking', 'confirm');
    try {
      if (recurrence.enabled) {
        // ── Recorrente: criar série ────────────────────────────────────────
        const hasConflicts = (recurrence.preview ?? []).some(o => o.hasConflict);
        const result = await (api.series as unknown as { create: (d: unknown) => Promise<{ createdCount?: number }> }).create({
          guardianId:       pro.id,
          clientId:         user.id,
          startAt:          startAtIso,
          durationMin:      60,
          timezone:         Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Fortaleza',
          freq:             recurrence.config.freq,
          byDay:            recurrence.config.byDay,
          count:            recurrence.config.count,
          serviceName:      (pro.specialty || [])[0] || 'Atendimento',
          price:            0,
          conflictStrategy: hasConflicts ? 'skip' : 'fail',
        });
        await refreshData();
        roundTripTelemetry.success('booking', 'confirm', rt.correlationId, rt.startMs);
        notify(
          'Sessões recorrentes criadas!',
          `${result.createdCount} sessões com ${pro.name} agendadas com sucesso.`,
          'success'
        );
      } else {
        // ── Avulso: fluxo original ─────────────────────────────────────────
        await api.appointments.create({
          id: '',
          clientId: user.id,
          clientName: user.name,
          professionalId: pro.id,
          professionalName: pro.name,
          date: startAtIso,
          time: '14:30',
          status: 'pending',
          serviceName: (pro.specialty || [])[0] || 'Atendimento',
          price: 0,
        });
        await refreshData();
        roundTripTelemetry.success('booking', 'confirm', rt.correlationId, rt.startMs);
        notify('Agendamento confirmado!', `Sessão com ${pro.name} registrada com sucesso.`, 'success');
      }
      go('CHECKOUT');
    } catch (err) {
      const normalizedError = err && typeof err === 'object' ? err as { code?: string; conflicts?: Array<{ date?: string; time?: string }> } : {};
      roundTripTelemetry.error('booking', 'confirm', rt.correlationId, rt.startMs, errorMessage(err));
      if (normalizedError.code === 'RECURRENCE_CONFLICTS' && normalizedError.conflicts?.length) {
        const dates = normalizedError.conflicts.slice(0, 3).map(c =>
          new Date(c.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        ).join(', ');
        notify('Conflito de horários', `Datas com conflito: ${dates}. Ative "pular conflitos" ou mude os horários.`, 'error');
      } else {
        notify('Falha no agendamento', errorMessage(err) || 'Não foi possível confirmar. Tente novamente.', 'error');
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      const sync = await api.spaces.syncCalendar();
      const icsContent = String(sync?.data || '').trim();
      if (!icsContent) throw new Error('Agenda vazia para sincronização.');
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = String(sync?.filename || 'viva360-calendar.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify('Sincronizado', 'Arquivo da agenda gerado para importar no celular ou desktop.', 'info');
    } catch (error) {
      notify('Falha na sincronização', errorMessage(error) || 'Não foi possível sincronizar sua agenda agora.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClose = () => { if (onClose) onClose(); else reset(); };

  return (
    <PortalView
      title="Confirmar Agendamento"
      subtitle="REVISAR DETALHES"
      onBack={back}
      onClose={handleClose}
      footer={(
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            disabled={isBooking || !pro || !user}
            className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isBooking
              ? <><Loader2 size={18} className="animate-spin" /> Confirmando...</>
              : recurrence.enabled
                ? <><Check size={18} /> Criar {recurrence.totalCount || recurrence.config.count} Sessões</>
                : <><Check size={18} /> Confirmar e Seguir</>}
          </button>
          <button onClick={back} className="w-full py-3 text-nature-400 font-bold uppercase text-[9px] tracking-widest transition-all hover:text-nature-600">
            Revisar Horário
          </button>
        </div>
      )}
    >
      <div className="flex flex-col items-center animate-in fade-in duration-500 pb-8">
        <div className="w-full flex flex-col items-center mb-8">
          <DynamicAvatar user={pro} size="lg" className="border-4 border-white shadow-lg mb-4" />
          <h3 className="text-xl font-serif italic text-nature-900">{pro?.name || 'Guardião'}</h3>
          <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">
            {(pro?.specialty || []).join(' • ')}
          </p>
        </div>

        <div className="w-full space-y-4 px-2">
          {/* Recorrência — só aparece quando VITE_RECURRENCE_ENABLED=true */}
          <RecurrenceToggle
            startAt={startAtIso}
            guardianId={pro?.id ?? ''}
            clientId={user?.id ?? ''}
            durationMin={60}
            timezone={Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Fortaleza'}
            onChange={setRecurrence}
          />

          <div className="flex items-center gap-4 p-5 bg-white/80 backdrop-blur-md rounded-3xl border border-nature-100 shadow-sm relative group overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-nature-50 flex items-center justify-center text-nature-600 transition-transform group-hover:scale-110">
              <Calendar size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest">Data Sugerida</p>
              <p className="font-bold text-nature-900 capitalize">{dateStr}</p>
            </div>
            <button
              onClick={handleSyncCalendar}
              disabled={isSyncing}
              className={`p-3 rounded-2xl border transition-all ${isSyncing ? 'bg-nature-900 text-white animate-pulse' : 'bg-nature-50 text-nature-400 hover:bg-nature-900 hover:text-white'}`}
            >
              {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white/80 backdrop-blur-md rounded-3xl border border-nature-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest">Janela de Tempo</p>
              <p className="font-bold text-nature-900">{timeStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white/80 backdrop-blur-md rounded-3xl border border-nature-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MapPin size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest">Localização</p>
              <p className="font-bold text-nature-900">Santuário Gaia / Online</p>
            </div>
          </div>

          {/* Alerta se user não disponível (improvável mas defensivo) */}
          {!user && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertCircle size={16} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">Sessão não identificada. Tente recarregar a página.</p>
            </div>
          )}

          <div className="p-6 bg-nature-900/5 rounded-[2rem] border border-nature-900/10 mt-6 mb-4">
            <div className="flex items-center gap-2 mb-2 text-nature-800">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sincronização Viva</span>
            </div>
            <p className="text-xs text-nature-500 leading-relaxed italic">
              "Ao confirmar, este portal de cura será aberto em sua realidade e sincronizado com seu calendário pessoal."
            </p>
          </div>
        </div>
      </div>
    </PortalView>
  );
}
