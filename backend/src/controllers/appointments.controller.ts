import { Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.service';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async.middleware';
import { interactionService } from '../services/interaction.service';
import prisma from '../lib/prisma';
import { notificationEngine } from '../services/notificationEngine.service';
import { interactionReceiptService } from '../services/interactionReceipt.service';

const createAppointmentSchema = z.object({
  professional_id: z.string().uuid().or(z.string()), // Allow simple string for mock
  service_name: z.string(),
  date: z.string(),
  time: z.string(),
  price: z.number(),
});

const rescheduleAppointmentSchema = z.object({
  date: z.string(),
  time: z.string(),
  service_name: z.string().min(2).optional(),
});

const cancelAppointmentSchema = z.object({
  reason: z.string().max(500).optional(),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const listAppointments = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });


    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
      .order('date', { ascending: false });

    if (error) throw error;
    return res.json(data);
});

export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const payload = createAppointmentSchema.parse(req.body);

    // Date and Time Synchronization Logic
    const requestedDateTime = new Date(`${payload.date}T${payload.time}`);
    const now = new Date();

    if (requestedDateTime < now) {
        return res.status(400).json({ 
            error: 'Sincronização Falhou', 
            message: 'O tempo flui apenas para frente. Escolha um momento no futuro.' 
        });
    }


    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        ...payload,
        client_id: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Supabase .single() returns typed row; id is always present after insert
    type AppointmentRow = { id: string; [k: string]: unknown };
    let confirmation: Awaited<ReturnType<typeof interactionService.emitAppointmentLifecycle>> | null = null;
    const appointmentId = String((data as AppointmentRow).id ?? '');
    const isoDate = requestedDateTime.toISOString();

    try {
      confirmation = await interactionService.emitAppointmentLifecycle({
        appointmentId,
        clientId: String(user.id),
        professionalId: String(payload.professional_id || ''),
        serviceName: payload.service_name,
        isoDate,
      });

      // Block sanctuary agenda if guardian belongs to a sanctuary.
      const professionalId = String(payload.professional_id || '');
      const professionalProfile = UUID_REGEX.test(professionalId)
        ? await prisma.profile.findUnique({
            where: { id: professionalId },
            select: { id: true, hub_id: true },
          })
        : null;

      const appointmentTag = `[appointment:${appointmentId}]`;
      const calendarRows = [
        {
          user_id: String(payload.professional_id || ''),
          title: `Atendimento: ${payload.service_name}`,
          start_time: isoDate,
          end_time: new Date(requestedDateTime.getTime() + 60 * 60 * 1000).toISOString(),
          type: 'appointment',
          details: `${appointmentTag} Agendamento confirmado para ${payload.time}.`,
        }
      ];

      if (professionalProfile?.hub_id) {
        calendarRows.push({
          user_id: String(professionalProfile.hub_id),
          title: `Agenda bloqueada (${payload.service_name})`,
          start_time: isoDate,
          end_time: new Date(requestedDateTime.getTime() + 60 * 60 * 1000).toISOString(),
          type: 'guardian_booking_block',
          details: `${appointmentTag} Guardião vinculado recebeu agendamento em ${payload.date} ${payload.time}.`,
        });
      }

      await supabaseAdmin.from('calendar_events').insert(calendarRows);
    } catch (interactionError) {
      interactionService.logInteractionFailure('appointment.create', interactionError, {
        requestId: req.requestId,
        userId: user.id,
        professionalId: payload.professional_id,
      });
    }

    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      action: 'CREATE',
      actorId: String(user.id),
      status: 'COMPLETED',
      nextStep: 'ATTEND_APPOINTMENT',
      requestId: req.requestId,
      payload: {
        professionalId: payload.professional_id,
        date: isoDate,
      },
    });

    return res.json({
      ...data,
      code: 'APPOINTMENT_CREATED',
      confirmation,
      actionReceipt,
    });
});

export const rescheduleAppointment = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const payload = rescheduleAppointmentSchema.parse(req.body || {});
    const requestedDateTime = new Date(`${payload.date}T${payload.time}`);
    if (requestedDateTime.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Novo horário precisa ser no futuro.', code: 'INVALID_DATE' });
    }

    const { data: existing, error: findError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Agendamento não encontrado.', code: 'APPOINTMENT_NOT_FOUND' });
    }

    const actorId = String(user.userId || user.id || '').trim();
    const isOwner = String(existing.client_id || '') === actorId || String(existing.professional_id || '') === actorId || String(user.role || '').toUpperCase() === 'ADMIN';
    if (!isOwner) {
      return res.status(403).json({ error: 'Sem permissão para reagendar.', code: 'FORBIDDEN' });
    }

    type AppointmentUpdate = {
      date: string;
      time: string;
      status: string;
      service_name?: string;
      is_exception?: boolean;
      original_start_at?: string | null;
    };
    const updatePayload: AppointmentUpdate = {
      date: payload.date,
      time: payload.time,
      status: 'rescheduled',
    };
    if (payload.service_name) updatePayload.service_name = payload.service_name;

    // If this appointment belongs to a series, mark it as an exception
    // and preserve the original start date for audit/display purposes.
    if (existing.series_id) {
      updatePayload.is_exception = true;
      updatePayload.original_start_at = existing.date; // preserve original
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      throw updateError || new Error('Falha ao reagendar.');
    }

    const isoDate = requestedDateTime.toISOString();
    const endDate = new Date(requestedDateTime.getTime() + 60 * 60 * 1000).toISOString();
    const appointmentTag = `[appointment:${id}]`;

    await supabaseAdmin
      .from('calendar_events')
      .update({
        start_time: isoDate,
        end_time: endDate,
        details: `${appointmentTag} Agendamento reagendado para ${payload.date} ${payload.time}.`,
      })
      .like('details', `%${appointmentTag}%`);

    let confirmation: Awaited<ReturnType<typeof interactionService.emitAppointmentRescheduled>> | null = null;
    try {
      confirmation = await interactionService.emitAppointmentRescheduled({
        appointmentId: id,
        clientId: String(updated.client_id || ''),
        professionalId: String(updated.professional_id || ''),
        serviceName: String(updated.service_name || payload.service_name || 'Atendimento'),
        isoDate,
      });
    } catch (error) {
      interactionService.logInteractionFailure('appointment.reschedule', error, {
        requestId: req.requestId,
        appointmentId: id,
      });
    }

    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'APPOINTMENT',
      entityId: id,
      action: 'RESCHEDULE',
      actorId,
      status: 'COMPLETED',
      nextStep: 'ATTEND_APPOINTMENT',
      requestId: req.requestId,
      payload: {
        date: isoDate,
      },
    });

    return res.json({
      ...updated,
      code: 'APPOINTMENT_RESCHEDULED',
      confirmation,
      actionReceipt,
    });
});

export const cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { reason } = cancelAppointmentSchema.parse(req.body || {});
    const actorId = String(user.userId || user.id || '').trim();

    const { data: existing, error: findError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Agendamento não encontrado.', code: 'APPOINTMENT_NOT_FOUND' });
    }

    const isOwner = String(existing.client_id || '') === actorId || String(existing.professional_id || '') === actorId || String(user.role || '').toUpperCase() === 'ADMIN';
    if (!isOwner) {
      return res.status(403).json({ error: 'Sem permissão para cancelar.', code: 'FORBIDDEN' });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      throw updateError || new Error('Falha ao cancelar.');
    }

    const isoDate = new Date(`${String(existing.date).slice(0, 10)}T${String(existing.time || '00:00')}`).toISOString();
    const appointmentTag = `[appointment:${id}]`;

    await supabaseAdmin
      .from('calendar_events')
      .delete()
      .like('details', `%${appointmentTag}%`);

    let confirmation: Awaited<ReturnType<typeof interactionService.emitAppointmentCancelled>> | null = null;
    try {
      confirmation = await interactionService.emitAppointmentCancelled({
        appointmentId: id,
        clientId: String(updated.client_id || ''),
        professionalId: String(updated.professional_id || ''),
        isoDate,
      });

      const professional = await prisma.profile.findUnique({
        where: { id: String(updated.professional_id || '') },
        select: { hub_id: true },
      });

      if (professional?.hub_id) {
        await notificationEngine.emit({
          type: 'appointment.space_unblocked',
          actorId,
          targetUserId: professional.hub_id,
          entityType: 'appointment',
          entityId: String(id),
          data: { date: isoDate },
        });
      }
    } catch (error) {
      interactionService.logInteractionFailure('appointment.cancel', error, {
        requestId: req.requestId,
        appointmentId: id,
      });
    }

    const actionReceipt = await interactionReceiptService.upsert({
      entityType: 'APPOINTMENT',
      entityId: id,
      action: 'CANCEL',
      actorId,
      status: 'COMPLETED',
      nextStep: 'CLOSED',
      requestId: req.requestId,
      payload: {
        reason: reason || null,
      },
    });

    return res.json({
      ...updated,
      code: 'APPOINTMENT_CANCELLED',
      confirmation,
      actionReceipt,
    });
});
