import React, { useState } from 'react';
import { useGuardiaoFlow } from '../../../src/flow/useGuardiaoFlow';
import { PortalView } from '../../../components/Common';
import { CheckCircle, Video, XCircle, AlertCircle, Loader2, Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { api } from '../../../services/api';

export default function AgendaConfirmScreen() {
  const { back, go, state, notify, selectAppointment } = useGuardiaoFlow();
  const apt = state.selectedAppointment;

  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!apt) {
    return (
      <div className="min-h-screen bg-nature-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-nature-100">
          <AlertCircle size={32} className="mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-bold text-nature-900 mb-2">Nenhum agendamento selecionado</h3>
          <button onClick={back} className="mt-4 w-full py-3 bg-nature-900 text-white rounded-xl text-sm font-bold uppercase tracking-wider">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const dateLabel = apt.date
    ? new Date(apt.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '—';

  const statusColors: Record<string, string> = {
    confirmed: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    pending:   'text-amber-600 bg-amber-50 border-amber-200',
    completed: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    cancelled: 'text-rose-600 bg-rose-50 border-rose-200',
  };
  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmado', pending: 'Pendente', completed: 'Concluído', cancelled: 'Cancelado',
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await (api.appointments as unknown as { update?: (id: string, d: unknown) => Promise<unknown> })?.update?.(apt.id, { status: 'confirmed' }).catch(() => null);
      selectAppointment({ ...apt, status: 'confirmed' });
      notify('Ritual Confirmado', `Sessão com ${apt.clientName} confirmada!`, 'success');
      go('AGENDA_VIEW');
    } catch {
      notify('Erro', 'Não foi possível confirmar. Tente novamente.', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await (api.appointments as unknown as { update?: (id: string, d: unknown) => Promise<unknown> })?.update?.(apt.id, { status: 'cancelled' }).catch(() => null);
      selectAppointment({ ...apt, status: 'cancelled' });
      notify('Ritual Cancelado', `Sessão com ${apt.clientName} cancelada.`, 'info');
      go('AGENDA_VIEW');
    } catch {
      notify('Erro', 'Não foi possível cancelar. Tente novamente.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const isAlreadyConfirmed = apt.status === 'confirmed';
  const isAlreadyCancelled = apt.status === 'cancelled';

  return (
    <PortalView title="Confirmar Ritual" subtitle="AGENDAMENTO" onBack={back}>
      <div className="space-y-5 px-2">

        {/* Status badge */}
        <div className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border text-xs font-bold uppercase tracking-widest ${statusColors[apt.status] || statusColors.pending}`}>
          {apt.status === 'confirmed' && <CheckCircle size={14} />}
          {statusLabels[apt.status] || 'Pendente'}
        </div>

        {/* Appointment Card */}
        <div className="bg-white rounded-[2.5rem] border border-nature-100 overflow-hidden shadow-sm">
          <div className="bg-nature-900 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
            <h2 className="text-2xl font-serif italic relative z-10">{apt.clientName}</h2>
            <p className="text-white/60 text-xs mt-1 relative z-10">Buscador em Jornada</p>
          </div>

          <div className="divide-y divide-nature-50">
            <InfoRow icon={<Calendar size={16} />} label="Data" value={dateLabel} />
            <InfoRow icon={<Clock size={16} />} label="Horário" value={apt.time || '—'} />
            <InfoRow icon={<Stethoscope size={16} />} label="Serviço" value={apt.serviceName || '—'} />
            <InfoRow icon={<User size={16} />} label="ID" value={`#${String(apt.id).slice(0, 8).toUpperCase()}`} />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!isAlreadyConfirmed && !isAlreadyCancelled && (
            <button
              onClick={handleConfirm}
              disabled={confirming || cancelling}
              className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-emerald-700"
            >
              {confirming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {confirming ? 'Confirmando...' : 'Confirmar Ritual'}
            </button>
          )}

          {isAlreadyConfirmed && (
            <button
              onClick={() => { selectAppointment(apt); go('VIDEO_PREP'); }}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-indigo-700"
            >
              <Video size={16} /> Iniciar Sessão por Vídeo
            </button>
          )}

          <button
            onClick={() => { selectAppointment(apt); go('AGENDA_EDIT'); }}
            className="w-full py-4 bg-white text-nature-900 rounded-[2rem] font-bold text-xs uppercase tracking-widest border border-nature-200 active:scale-95 transition-all"
          >
            Editar Agendamento
          </button>

          {!isAlreadyCancelled && !isAlreadyConfirmed && (
            <button
              onClick={handleCancel}
              disabled={confirming || cancelling}
              className="w-full py-4 bg-white text-rose-500 rounded-[2rem] font-bold text-xs uppercase tracking-widest border border-rose-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-rose-50"
            >
              {cancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              {cancelling ? 'Cancelando...' : 'Cancelar Ritual'}
            </button>
          )}
        </div>
      </div>
    </PortalView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <div className="w-8 h-8 bg-nature-50 rounded-xl flex items-center justify-center text-nature-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-nature-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
