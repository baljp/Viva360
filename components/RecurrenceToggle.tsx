/**
 * RecurrenceToggle.tsx
 * ─────────────────────
 * Self-contained widget rendered inside BookingConfirm (Buscador) and
 * AgendaView (Guardião).  Shows/hides based on VITE_RECURRENCE_ENABLED.
 *
 * When enabled:
 *  1. Toggle "Repetir esta sessão"
 *  2. Freq selector: Semanal | Quinzenal | Mensal
 *  3. Count picker (4 / 8 / 12 sessions) OR custom
 *  4. Preview button → loads next 6 occurrences with conflict markers
 *  5. Emits { enabled, config, preview } via onChange
 */

import React, { useState, useCallback } from 'react';
import { RefreshCw, ChevronDown, AlertCircle, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { api } from '../services/api';

// ── Feature flag (frontend) ────────────────────────────────────────────────
const RECURRENCE_ENABLED =
  (import.meta.env.VITE_RECURRENCE_ENABLED ?? 'false').toString().toLowerCase() === 'true';

// ── Types ──────────────────────────────────────────────────────────────────

export type RecurrenceFreq = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface RecurrenceConfig {
  freq: RecurrenceFreq;
  byDay: string[];
  count: number;
}

export interface PreviewOccurrence {
  occurrenceIndex: number;
  date: string;       // ISO UTC
  hasConflict: boolean;
  conflictingAppointmentId?: string;
}

type PreviewResponse = {
  occurrences?: PreviewOccurrence[];
  totalCount?: number;
};

export interface RecurrenceState {
  enabled: boolean;
  config: RecurrenceConfig;
  preview: PreviewOccurrence[] | null;
  totalCount: number;
}

interface Props {
  /** ISO UTC string of the first session */
  startAt: string;
  /** Guardian (professional) profile id */
  guardianId: string;
  /** Client profile id */
  clientId: string;
  /** Session duration in minutes */
  durationMin?: number;
  /** User's timezone */
  timezone?: string;
  /** Called whenever state changes */
  onChange: (state: RecurrenceState) => void;
}

// ── DOW helpers ────────────────────────────────────────────────────────────

const DOW_ABBR = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const DOW_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function deriveDow(isoDate: string): string {
  const dow = new Date(isoDate).getDay();
  return DOW_ABBR[dow] ?? 'MO';
}

// ── Component ──────────────────────────────────────────────────────────────

export const RecurrenceToggle: React.FC<Props> = ({
  startAt,
  guardianId,
  clientId,
  durationMin = 60,
  timezone = 'America/Fortaleza',
  onChange,
}) => {
  const [enabled,  setEnabled]  = useState(false);
  const [freq,     setFreq]     = useState<RecurrenceFreq>('WEEKLY');
  const [count,    setCount]    = useState(4);
  const [preview,  setPreview]  = useState<PreviewOccurrence[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [previewed, setPreviewed] = useState(false);
  const byDay = [deriveDow(startAt)];

  const notify = useCallback((nextEnabled: boolean, nextFreq: RecurrenceFreq, nextCount: number, nextPreview: PreviewOccurrence[] | null, nextTotal: number) => {
    onChange({
      enabled: nextEnabled,
      config: { freq: nextFreq, byDay, count: nextCount },
      preview: nextPreview,
      totalCount: nextTotal,
    });
  }, [byDay, onChange]);

  // Don't render at all when flag is off
  if (!RECURRENCE_ENABLED) return null;

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    setPreview(null);
    setPreviewed(false);
    setError(null);
    notify(next, freq, count, null, 0);
  };

  const handleFreqChange = (f: RecurrenceFreq) => {
    setFreq(f);
    setPreview(null);
    setPreviewed(false);
    notify(enabled, f, count, null, 0);
  };

  const handleCountChange = (c: number) => {
    setCount(c);
    setPreview(null);
    setPreviewed(false);
    notify(enabled, freq, c, null, 0);
  };

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.series.preview({
        guardianId,
        clientId,
        startAt,
        durationMin,
        timezone,
        freq,
        byDay,
        count,
      }) as PreviewResponse;
      setPreview(result.occurrences ?? []);
      setTotalCount(result.totalCount ?? count);
      setPreviewed(true);
      notify(enabled, freq, count, result.occurrences ?? [], result.totalCount ?? count);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o preview.');
    } finally {
      setLoading(false);
    }
  };

  const freqLabel: Record<RecurrenceFreq, string> = {
    WEEKLY:   'Toda semana',
    BIWEEKLY: 'A cada 2 semanas',
    MONTHLY:  'Todo mês',
  };

  const dowLabel = DOW_LABEL[DOW_ABBR.indexOf(byDay[0])] ?? byDay[0];
  const conflictCount = preview?.filter(o => o.hasConflict).length ?? 0;

  return (
    <div className="w-full rounded-[2rem] border border-nature-100 overflow-hidden bg-white/80 backdrop-blur-md">
      {/* Toggle row */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-nature-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors ${enabled ? 'bg-nature-900 text-white' : 'bg-nature-100 text-nature-500'}`}>
            <RefreshCw size={17} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-nature-900">Repetir esta sessão</p>
            {enabled && (
              <p className="text-[10px] text-nature-500 uppercase tracking-wider font-bold mt-0.5">
                {freqLabel[freq]} · {count}× · {dowLabel}s
              </p>
            )}
          </div>
        </div>
        <div className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? 'bg-nature-900' : 'bg-nature-200'}`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </button>

      {/* Expanded config */}
      {enabled && (
        <div className="px-5 pb-5 space-y-4 border-t border-nature-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Freq */}
          <div>
            <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-2">Frequência</p>
            <div className="grid grid-cols-3 gap-2">
              {(['WEEKLY', 'BIWEEKLY', 'MONTHLY'] as RecurrenceFreq[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFreqChange(f)}
                  className={`py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all ${
                    freq === f
                      ? 'bg-nature-900 text-white border-nature-900'
                      : 'bg-white text-nature-600 border-nature-200 hover:border-nature-400'
                  }`}
                >
                  {f === 'WEEKLY' ? 'Semanal' : f === 'BIWEEKLY' ? 'Quinzenal' : 'Mensal'}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div>
            <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-2">Repetições</p>
            <div className="grid grid-cols-4 gap-2">
              {[4, 8, 12, 24].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCountChange(c)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    count === c
                      ? 'bg-nature-900 text-white border-nature-900'
                      : 'bg-white text-nature-600 border-nature-200 hover:border-nature-400'
                  }`}
                >
                  {c}×
                </button>
              ))}
            </div>
          </div>

          {/* Day indicator */}
          <div className="flex items-center gap-2 p-3 bg-nature-50 rounded-xl">
            <Calendar size={14} className="text-nature-500" />
            <p className="text-xs text-nature-600">
              <span className="font-bold">{count} sessões</span> toda {dowLabel.toLowerCase()}, começando em{' '}
              <span className="font-bold">
                {new Date(startAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </p>
          </div>

          {/* Preview button */}
          {!previewed && (
            <button
              type="button"
              onClick={handlePreview}
              disabled={loading}
              className="w-full py-3 border border-nature-200 rounded-xl text-xs font-bold uppercase tracking-widest text-nature-600 flex items-center justify-center gap-2 hover:bg-nature-50 transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
              {loading ? 'Carregando...' : 'Ver próximas datas'}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Preview list */}
          {previewed && preview && preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">
                  Próximas datas (mostrando {preview.length} de {totalCount})
                </p>
                {conflictCount > 0 && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {conflictCount} conflito{conflictCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {preview.map((occ) => {
                const d = new Date(occ.date);
                const label = d.toLocaleDateString('pt-BR', {
                  weekday: 'short', day: '2-digit', month: 'short',
                });
                return (
                  <div
                    key={occ.occurrenceIndex}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs ${
                      occ.hasConflict
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {occ.hasConflict
                        ? <AlertCircle size={13} className="text-amber-500" />
                        : <CheckCircle2 size={13} className="text-emerald-500" />}
                      <span className="font-semibold capitalize">{label}</span>
                    </div>
                    {occ.hasConflict && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                        Conflito
                      </span>
                    )}
                  </div>
                );
              })}
              {conflictCount > 0 && (
                <p className="text-[10px] text-nature-500 italic px-1">
                  * Datas com conflito serão ignoradas se você escolher "pular conflitos".
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurrenceToggle;
