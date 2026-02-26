/**
 * series.controller.ts
 * ────────────────────
 * CRUD handlers for AppointmentSeries.
 * Feature flag: VIVA360_RECURRENCE_ENABLED
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async.middleware';
import { logger } from '../lib/logger';
import {
  createSeries,
  cancelSeries,
  previewSeries,
  generateOccurrences,
  FREQ,
  type Freq,
} from '../services/recurrence.service';
import { interactionService } from '../services/interaction.service';
import prisma from '../lib/prisma';
import { supabaseAdmin } from '../services/supabase.service';

// ── Feature flag guard ────────────────────────────────────────────────────────

function recurrenceEnabled(): boolean {
  const v = (process.env.VIVA360_RECURRENCE_ENABLED ?? 'false').trim().toLowerCase();
  return v === 'true' || v === '1';
}

function requireRecurrence(res: Response): boolean {
  if (!recurrenceEnabled()) {
    res.status(501).json({
      error: 'Recorrência não habilitada neste ambiente.',
      code: 'FEATURE_DISABLED',
      hint: 'Set VIVA360_RECURRENCE_ENABLED=true to enable.',
    });
    return false;
  }
  return true;
}

// ── Validation schemas ────────────────────────────────────────────────────────

const createSeriesSchema = z.object({
  guardianId:       z.string().uuid('guardianId deve ser UUID'),
  clientId:         z.string().uuid('clientId deve ser UUID'),
  spaceId:          z.string().uuid().optional(),
  startAt:          z.string().datetime({ message: 'startAt deve ser ISO 8601' }),
  durationMin:      z.number().int().min(15).max(480).default(60),
  timezone:         z.string().default('America/Fortaleza'),
  freq:             z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  byDay:            z.array(z.string()).default([]),
  count:            z.number().int().min(1).max(52).optional(),
  until:            z.string().datetime().optional(),
  serviceName:      z.string().min(2).max(120),
  price:            z.number().min(0).default(0),
  conflictStrategy: z.enum(['skip', 'fail']).default('fail'),
});

const previewSeriesSchema = z.object({
  guardianId:  z.string().uuid(),
  clientId:    z.string().uuid(),
  startAt:     z.string().datetime(),
  durationMin: z.number().int().min(15).max(480).default(60),
  timezone:    z.string().default('America/Fortaleza'),
  freq:        z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  byDay:       z.array(z.string()).default([]),
  count:       z.number().int().min(1).max(52).optional(),
  until:       z.string().datetime().optional(),
});

// ── POST /appointments/series ─────────────────────────────────────────────────

export const createAppointmentSeries = asyncHandler(async (req: Request, res: Response) => {
  if (!requireRecurrence(res)) return;

  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const body = createSeriesSchema.parse(req.body);

  // Authorization: actor must be the guardian or an admin
  const actorId = String(user.userId || user.id || '');
  const role     = String(user.role || '').toUpperCase();
  if (actorId !== body.guardianId && role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Apenas o Guardião responsável pode criar a série.',
      code: 'FORBIDDEN',
    });
  }

  const result = await createSeries({
    guardianId:       body.guardianId,
    clientId:         body.clientId,
    spaceId:          body.spaceId,
    startAt:          new Date(body.startAt),
    durationMin:      body.durationMin,
    timezone:         body.timezone,
    freq:             body.freq as Freq,
    byDay:            body.byDay,
    count:            body.count,
    until:            body.until ? new Date(body.until) : undefined,
    serviceName:      body.serviceName,
    price:            body.price,
    conflictStrategy: body.conflictStrategy,
  });

  // Emit SeriesCreated notifications for both parties
  try {
    await interactionService.emitSeriesCreated({
      seriesId:    result.seriesId,
      guardianId:  body.guardianId,
      clientId:    body.clientId,
      serviceName: body.serviceName,
      createdCount: result.createdCount,
      firstDateIso: result.createdAppointments[0]?.startAt ?? body.startAt,
    });
  } catch (err) {
    // Notification failure must not break the response
    logger.warn('series.create.notification_failed', { err: String(err) });
  }

  return res.status(201).json({
    code: 'SERIES_CREATED',
    ...result,
  });
});

// ── POST /appointments/series/preview ────────────────────────────────────────

export const previewAppointmentSeries = asyncHandler(async (req: Request, res: Response) => {
  if (!requireRecurrence(res)) return;

  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const body = previewSeriesSchema.parse(req.body);

  const preview = await previewSeries({
    guardianId:  body.guardianId,
    clientId:    body.clientId,
    startAt:     new Date(body.startAt),
    durationMin: body.durationMin,
    timezone:    body.timezone,
    freq:        body.freq as Freq,
    byDay:       body.byDay,
    count:       body.count,
    until:       body.until ? new Date(body.until) : undefined,
  });

  return res.json(preview);
});

// ── GET /appointments/series/:id ──────────────────────────────────────────────

export const getAppointmentSeries = asyncHandler(async (req: Request, res: Response) => {
  if (!requireRecurrence(res)) return;

  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const actorId = String(user.userId || user.id || '');

  const series = await prisma.appointmentSeries.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          time: true,
          status: true,
          is_exception: true,
          occurrence_index: true,
          original_start_at: true,
        },
      },
    },
  });

  if (!series) {
    return res.status(404).json({ error: 'Série não encontrada.', code: 'NOT_FOUND' });
  }

  // Must be guardian, client, or admin
  const role = String(user.role || '').toUpperCase();
  if (series.guardian_id !== actorId && series.client_id !== actorId && role !== 'ADMIN') {
    return res.status(403).json({ error: 'Sem permissão.', code: 'FORBIDDEN' });
  }

  return res.json(series);
});

// ── PATCH /appointments/series/:id ────────────────────────────────────────────

export const updateAppointmentSeries = asyncHandler(async (req: Request, res: Response) => {
  // Partial edit of series (update from date X) — not implemented in v1
  res.status(501).json({
    error: 'Edição de série ainda não implementada.',
    code: 'NOT_IMPLEMENTED',
    hint: 'Use PATCH /appointments/:id/reschedule para remarcar ocorrências individuais.',
  });
});

// ── DELETE /appointments/series/:id ──────────────────────────────────────────

export const deleteAppointmentSeries = asyncHandler(async (req: Request, res: Response) => {
  if (!requireRecurrence(res)) return;

  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const actorId = String(user.userId || user.id || '');

  const series = await prisma.appointmentSeries.findUnique({
    where: { id },
    select: { guardian_id: true, client_id: true, status: true },
  });

  if (!series) {
    return res.status(404).json({ error: 'Série não encontrada.', code: 'NOT_FOUND' });
  }

  const role = String(user.role || '').toUpperCase();
  if (series.guardian_id !== actorId && series.client_id !== actorId && role !== 'ADMIN') {
    return res.status(403).json({ error: 'Sem permissão.', code: 'FORBIDDEN' });
  }

  if (series.status === 'canceled') {
    return res.status(409).json({ error: 'Série já cancelada.', code: 'ALREADY_CANCELED' });
  }

  const { canceledCount } = await cancelSeries(id, actorId);

  // Emit SeriesCanceled notification
  try {
    await interactionService.emitSeriesCanceled({
      seriesId:    id,
      guardianId:  series.guardian_id,
      clientId:    series.client_id,
      canceledBy:  actorId,
      canceledCount,
    });
  } catch (err) {
    logger.warn('series.delete.notification_failed', { err: String(err) });
  }

  return res.json({
    code: 'SERIES_CANCELED',
    seriesId: id,
    canceledCount,
  });
});

// ── PATCH /appointments/:id/reschedule (exception) ───────────────────────────
// This extends the existing rescheduleAppointment to also handle series exceptions.
// The route already exists — this function is called as a post-processor.

export async function markAsException(
  appointmentId: string,
  newDate: Date
): Promise<void> {
  await supabaseAdmin
    .from('appointments')
    .update({
      is_exception: true,
      original_start_at: null, // will be set from existing date before update
    })
    .eq('id', appointmentId)
    .not('series_id', 'is', null); // only series occurrences
}
