/**
 * recurrence.service.ts
 * ─────────────────────
 * Pure business logic for appointment series:
 *  - generateOccurrences: converts (startAt + rule) → sorted Date[]
 *  - detectConflicts:     checks existing appointments for overlap
 *  - createSeries:        transactional insert (series + children) with idempotency
 *  - cancelSeries:        soft-cancel all future occurrences
 *
 * Zero external deps — uses only native Date (UTC-aware).
 * Timezone handling: shift startAt to local midnight via offset, then generate,
 * then return UTC ISO strings.  Good enough for America/Fortaleza (UTC-3) and
 * most Brazilian timezones; full IANA support can be added later with luxon.
 */

import prisma from '../lib/prisma';
import { supabaseAdmin } from './supabase.service';
import { logger } from '../lib/logger';

// ── Constants ─────────────────────────────────────────────────────────────────

export const FREQ = {
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
} as const;

export type Freq = keyof typeof FREQ;

// Day-of-week abbreviations (matches iCalendar BYDAY)
const DOW_ABBR = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

// ── Timezone offset helpers ────────────────────────────────────────────────────

const TZ_OFFSETS: Record<string, number> = {
  'America/Fortaleza':   -3,
  'America/Sao_Paulo':   -3,  // BRT (ignoring BRST for simplicity)
  'America/Manaus':      -4,
  'America/Cuiaba':      -4,
  'America/Recife':      -3,
  'America/Belem':       -3,
  'America/Porto_Velho': -4,
  'America/Rio_Branco':  -5,
  'America/Boa_Vista':   -4,
  'UTC':                  0,
};

function tzOffset(timezone: string): number {
  return TZ_OFFSETS[timezone] ?? -3; // default BRT
}

/** Shift a UTC date to local midnight, keeping wall-clock time */
function toLocalDate(utcDate: Date, timezone: string): Date {
  const offset = tzOffset(timezone);
  return new Date(utcDate.getTime() + offset * 60 * 60 * 1000);
}

/** Shift a local date back to UTC */
function toUtcDate(localDate: Date, timezone: string): Date {
  const offset = tzOffset(timezone);
  return new Date(localDate.getTime() - offset * 60 * 60 * 1000);
}

// ── Occurrence Generator ──────────────────────────────────────────────────────

export interface RecurrenceRule {
  startAt: Date;       // UTC
  durationMin: number;
  timezone: string;
  freq: Freq;
  byDay: string[];     // e.g. ['TH'] or ['MO','WE'] for multi-day
  count?: number;      // max occurrences (takes precedence over until if both set)
  until?: Date;        // UTC inclusive upper bound
}

const MAX_OCCURRENCES = 52; // safety cap — 1 year weekly

/**
 * Generate occurrence dates (UTC) from a recurrence rule.
 * Returns dates sorted ascending, starting from and including startAt.
 */
export function generateOccurrences(rule: RecurrenceRule): Date[] {
  const {
    startAt,
    timezone,
    freq,
    byDay,
    count,
    until,
  } = rule;

  const cap = Math.min(count ?? MAX_OCCURRENCES, MAX_OCCURRENCES);

  // Work in local time so day-of-week is correct for the user's zone
  const localStart = toLocalDate(startAt, timezone);
  const startDow   = localStart.getUTCDay(); // 0=Sun … 6=Sat

  // Resolve target days-of-week from byDay[] or derive from startAt
  const targetDows: number[] = byDay.length > 0
    ? byDay.map(d => DOW_ABBR.indexOf(d.toUpperCase())).filter(d => d >= 0)
    : [startDow];

  const results: Date[] = [];
  let cursor = new Date(localStart);
  const untilLocal = until ? toLocalDate(until, timezone) : null;

  // Step (in days) for MONTHLY we handle separately
  const stepDays = freq === 'BIWEEKLY' ? 14 : freq === 'MONTHLY' ? 0 : 7;

  // For WEEKLY / BIWEEKLY: iterate week-by-week, collect target DOWs within each week
  if (freq === 'WEEKLY' || freq === 'BIWEEKLY') {
    // Start from the Monday of the startAt week so we don't miss earlier DOWs
    // Actually: keep cursor at startAt; emit occurrences >= startAt
    let weekCursor = new Date(localStart);
    // Go back to Sunday of that week
    weekCursor.setUTCDate(weekCursor.getUTCDate() - weekCursor.getUTCDay());

    while (results.length < cap) {
      for (const dow of targetDows.sort((a, b) => a - b)) {
        const candidate = new Date(weekCursor);
        candidate.setUTCDate(weekCursor.getUTCDate() + dow);
        // Keep wall-clock time from startAt
        candidate.setUTCHours(
          localStart.getUTCHours(),
          localStart.getUTCMinutes(),
          0, 0
        );

        if (candidate < localStart) continue;
        if (untilLocal && candidate > untilLocal) {
          // Convert back to UTC and return
          return results.map(d => toUtcDate(d, timezone));
        }
        results.push(new Date(candidate));
        if (results.length >= cap) break;
      }
      weekCursor.setUTCDate(weekCursor.getUTCDate() + stepDays);
    }
  }

  // For MONTHLY: same day-of-month each month
  if (freq === 'MONTHLY') {
    cursor = new Date(localStart);
    while (results.length < cap) {
      const candidate = new Date(cursor);
      if (untilLocal && candidate > untilLocal) break;
      if (candidate >= localStart) {
        results.push(new Date(candidate));
      }
      // Advance 1 month
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }

  return results.map(d => toUtcDate(d, timezone));
}

// ── Conflict Detection ────────────────────────────────────────────────────────

export interface ConflictInfo {
  occurrenceIndex: number;
  date: Date; // UTC
  conflictingAppointmentId: string;
}

/**
 * Check if any of the proposed occurrence dates overlaps with existing
 * non-cancelled appointments for the guardian (professional).
 */
export async function detectConflicts(
  guardianId: string,
  occurrenceDates: Date[],
  durationMin: number
): Promise<ConflictInfo[]> {
  if (occurrenceDates.length === 0) return [];

  const earliest = occurrenceDates[0];
  const latest   = occurrenceDates[occurrenceDates.length - 1];

  // Fetch guardian's non-cancelled appointments in that date range
  const { data: existing, error } = await supabaseAdmin
    .from('appointments')
    .select('id, date, time')
    .eq('professional_id', guardianId)
    .neq('status', 'cancelled')
    .gte('date', earliest.toISOString().slice(0, 10))
    .lte('date', latest.toISOString().slice(0, 10));

  if (error) {
    logger.warn('recurrence.detectConflicts.query_error', { error: error.message });
    return [];
  }

  const existingRanges = (existing ?? []).map((row: any) => {
    const start = new Date(`${String(row.date).slice(0, 10)}T${String(row.time || '00:00')}:00Z`);
    const end   = new Date(start.getTime() + durationMin * 60 * 1000);
    return { id: String(row.id), start, end };
  });

  const conflicts: ConflictInfo[] = [];

  occurrenceDates.forEach((occDate, idx) => {
    const occEnd = new Date(occDate.getTime() + durationMin * 60 * 1000);
    for (const existing of existingRanges) {
      // Overlap: occ starts before existing ends AND occ ends after existing starts
      if (occDate < existing.end && occEnd > existing.start) {
        conflicts.push({
          occurrenceIndex: idx,
          date: occDate,
          conflictingAppointmentId: existing.id,
        });
        break; // one conflict per occurrence is enough
      }
    }
  });

  return conflicts;
}

// ── Series Creation ───────────────────────────────────────────────────────────

export interface CreateSeriesInput {
  guardianId:  string;
  clientId:    string;
  spaceId?:    string;
  startAt:     Date;
  durationMin: number;
  timezone:    string;
  freq:        Freq;
  byDay:       string[];
  count?:      number;
  until?:      Date;
  serviceName: string;
  price?:      number;
  /** 'skip' = omit conflicting dates; 'fail' = abort on any conflict (default) */
  conflictStrategy?: 'skip' | 'fail';
}

export interface CreateSeriesResult {
  seriesId:            string;
  createdCount:        number;
  skippedConflicts:    ConflictInfo[];
  createdAppointments: Array<{ id: string; startAt: string; occurrenceIndex: number }>;
}

export async function createSeries(input: CreateSeriesInput): Promise<CreateSeriesResult> {
  const {
    guardianId, clientId, spaceId,
    startAt, durationMin, timezone,
    freq, byDay, count, until,
    serviceName, price = 0,
    conflictStrategy = 'fail',
  } = input;

  // 1. Generate occurrence dates
  const occurrenceDates = generateOccurrences({
    startAt, durationMin, timezone, freq, byDay, count, until,
  });

  if (occurrenceDates.length === 0) {
    throw new Error('Regra de recorrência não gerou nenhuma ocorrência.');
  }

  // 2. Detect conflicts
  const allConflicts = await detectConflicts(guardianId, occurrenceDates, durationMin);

  if (allConflicts.length > 0 && conflictStrategy === 'fail') {
    const err: any = new Error('Conflitos de horário detectados.');
    err.code = 'RECURRENCE_CONFLICTS';
    err.conflicts = allConflicts.map(c => ({
      occurrenceIndex: c.occurrenceIndex,
      date: c.date.toISOString(),
      conflictingAppointmentId: c.conflictingAppointmentId,
    }));
    throw err;
  }

  const conflictIndexes = new Set(allConflicts.map(c => c.occurrenceIndex));
  const validDates = occurrenceDates.filter((_, idx) => !conflictIndexes.has(idx));

  if (validDates.length === 0) {
    throw new Error('Todos os horários propostos têm conflitos. Escolha datas diferentes.');
  }

  // 3. Fetch guardian profile for name
  const guardian = await prisma.profile.findUnique({
    where: { id: guardianId },
    select: { name: true },
  });
  const client = await prisma.profile.findUnique({
    where: { id: clientId },
    select: { name: true },
  });

  // 4. Create series + appointments in a transaction (idempotent by unique constraint)
  const result = await prisma.$transaction(async (tx) => {
    // 4a. Create the series record
    const series = await tx.appointmentSeries.create({
      data: {
        guardian_id:  guardianId,
        client_id:    clientId,
        space_id:     spaceId ?? null,
        start_at:     startAt,
        duration_min: durationMin,
        timezone,
        freq,
        by_day:       byDay,
        count:        count ?? null,
        until:        until ?? null,
        status:       'active',
      },
    });

    // 4b. Build appointment rows — include occurrence_index for idempotency
    //     The unique index (series_id, occurrence_index) prevents duplicates on retry.
    const appointments: Array<{ id: string; startAt: string; occurrenceIndex: number }> = [];

    for (let i = 0; i < occurrenceDates.length; i++) {
      if (conflictIndexes.has(i)) continue; // skip conflicting

      const occ = occurrenceDates[i];
      const dateStr = occ.toISOString().slice(0, 10);
      const timeStr = occ.toISOString().slice(11, 16); // HH:MM

      try {
        const apt = await tx.appointment.create({
          data: {
            client_id:        clientId,
            professional_id:  guardianId,
            service_name:     serviceName,
            professional_name: guardian?.name ?? '',
            client_name:       client?.name ?? '',
            date:              occ,
            time:              timeStr,
            price:             price,
            status:            'pending',
            series_id:         series.id,
            occurrence_index:  i,
            is_exception:      false,
          },
          select: { id: true, date: true },
        });

        appointments.push({
          id: apt.id,
          startAt: apt.date.toISOString(),
          occurrenceIndex: i,
        });
      } catch (err: any) {
        // P2002 = unique constraint violation → duplicate, skip silently
        if (err?.code === 'P2002') {
          logger.info('recurrence.create.duplicate_skipped', {
            seriesId: series.id, occurrenceIndex: i,
          });
          continue;
        }
        throw err;
      }
    }

    return { series, appointments };
  });

  logger.info('recurrence.series_created', {
    seriesId: result.series.id,
    createdCount: result.appointments.length,
    skippedConflicts: allConflicts.length,
    freq, guardianId, clientId,
  });

  return {
    seriesId:            result.series.id,
    createdCount:        result.appointments.length,
    skippedConflicts:    allConflicts,
    createdAppointments: result.appointments,
  };
}

// ── Cancel Series ─────────────────────────────────────────────────────────────

export async function cancelSeries(
  seriesId: string,
  actorId: string
): Promise<{ canceledCount: number }> {
  const now = new Date();

  // Mark series as canceled
  await prisma.appointmentSeries.update({
    where: { id: seriesId },
    data:  { status: 'canceled' },
  });

  // Soft-cancel all future (pending/rescheduled) appointments in the series
  const result = await supabaseAdmin
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('series_id', seriesId)
    .in('status', ['pending', 'rescheduled'])
    .gte('date', now.toISOString());

  const canceledCount = (result as any).count ?? 0;

  logger.info('recurrence.series_canceled', { seriesId, actorId, canceledCount });

  return { canceledCount };
}

// ── Preview (no DB writes) ────────────────────────────────────────────────────

export interface PreviewResult {
  occurrences: Array<{
    occurrenceIndex: number;
    date: string;        // ISO UTC
    hasConflict: boolean;
    conflictingAppointmentId?: string;
  }>;
  totalCount: number;
}

export async function previewSeries(
  input: Omit<CreateSeriesInput, 'serviceName' | 'price' | 'conflictStrategy'>
): Promise<PreviewResult> {
  const occurrenceDates = generateOccurrences({
    startAt:     input.startAt,
    durationMin: input.durationMin,
    timezone:    input.timezone,
    freq:        input.freq,
    byDay:       input.byDay,
    count:       input.count,
    until:       input.until,
  });

  const conflicts = await detectConflicts(
    input.guardianId,
    occurrenceDates,
    input.durationMin
  );

  const conflictMap = new Map(conflicts.map(c => [c.occurrenceIndex, c]));

  // Return first 6 for preview, plus total count
  const preview = occurrenceDates.slice(0, 6).map((date, idx) => ({
    occurrenceIndex: idx,
    date: date.toISOString(),
    hasConflict: conflictMap.has(idx),
    conflictingAppointmentId: conflictMap.get(idx)?.conflictingAppointmentId,
  }));

  return { occurrences: preview, totalCount: occurrenceDates.length };
}
