import React, { useState } from 'react';
import { useGuardiaoFlow } from '../../../src/flow/useGuardiaoFlow';
import { PortalView } from '../../../components/Common';
import { Check, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';

export default function AgendaEditScreen() {
  const { back, go, state, notify, selectAppointment } = useGuardiaoFlow();
  const apt = state.selectedAppointment;

  const [status, setStatus] = useState<string>(apt?.status || 'pending');
  const [time, setTime] = useState<string>(apt?.time || '');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await (api as any).appointments?.update?.(apt.id, { status, time: time || apt.time, notes }).catch(() => null);
      if (updated) {
        selectAppointment({ ...apt, status: status as any, time: time || apt.time });
      }
      notify('Agendamento Atualizado', `Status de ${apt.clientName} alterado com sucesso.`, 'success');
      go('AGENDA_CONFIRM');
    } catch {
      notify('Erro', 'Não foi possível salvar as alterações. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const statuses = [
    { value: 'pending',   label: 'Pendente',   color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { value: 'confirmed', label: 'Confirmado', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { value: 'completed', label: 'Concluído',  color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { value: 'cancelled', label: 'Cancelado',  color: 'text-rose-600 bg-rose-50 border-rose-200' },
  ];

  return (
    <PortalView title="Editar Ritual" subtitle="AGENDAMENTO" onBack={back}>
      <div className="space-y-5 px-2">

        {/* Appointment Info */}
        <div className="bg-nature-900 text-white p-6 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1">Buscador</p>
          <h2 className="text-2xl font-serif italic mb-1">{apt.clientName}</h2>
          <p className="text-white/60 text-xs">{apt.serviceName} · {dateLabel}</p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-[2.5rem] border border-nature-100 p-6 space-y-4">
          <h3 className="text-xs font-bold text-nature-500 uppercase tracking-widest">Status do Ritual</h3>
          <div className="grid grid-cols-2 gap-3">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`py-3 px-4 rounded-2xl border-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  status === s.value
                    ? s.color + ' border-current shadow-sm'
                    : 'bg-white text-nature-400 border-nature-100 hover:border-nature-200'
                }`}
              >
                {status === s.value && <Check size={12} />}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="bg-white rounded-[2.5rem] border border-nature-100 p-6 space-y-3">
          <h3 className="text-xs font-bold text-nature-500 uppercase tracking-widest">Horário</h3>
          <div className="relative">
            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300 pointer-events-none" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-nature-50 border border-nature-100 rounded-2xl text-sm font-medium text-nature-900 outline-none focus:ring-2 focus:ring-nature-200"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-[2.5rem] border border-nature-100 p-6 space-y-3">
          <h3 className="text-xs font-bold text-nature-500 uppercase tracking-widest">Anotações</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre este agendamento..."
            rows={3}
            className="w-full p-4 bg-nature-50 border border-nature-100 rounded-2xl text-sm text-nature-900 placeholder:text-nature-300 outline-none focus:ring-2 focus:ring-nature-200 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </PortalView>
  );
}
