import { Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.service';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async.middleware';
import { interactionService } from '../services/interaction.service';
import prisma from '../lib/prisma';

const createAppointmentSchema = z.object({
  professional_id: z.string().uuid().or(z.string()), // Allow simple string for mock
  service_name: z.string(),
  date: z.string(),
  time: z.string(),
  price: z.number(),
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

    let confirmation: any = null;
    const appointmentId = String((data as any)?.id || '');
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

      const calendarRows = [
        {
          user_id: String(payload.professional_id || ''),
          title: `Atendimento: ${payload.service_name}`,
          start_time: isoDate,
          end_time: new Date(requestedDateTime.getTime() + 60 * 60 * 1000).toISOString(),
          type: 'appointment',
          details: `Agendamento confirmado para ${payload.time}.`,
        }
      ];

      if (professionalProfile?.hub_id) {
        calendarRows.push({
          user_id: String(professionalProfile.hub_id),
          title: `Agenda bloqueada (${payload.service_name})`,
          start_time: isoDate,
          end_time: new Date(requestedDateTime.getTime() + 60 * 60 * 1000).toISOString(),
          type: 'guardian_booking_block',
          details: `Guardião vinculado recebeu agendamento em ${payload.date} ${payload.time}.`,
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

    return res.json({
      ...data,
      code: 'APPOINTMENT_CREATED',
      confirmation,
    });
});
