import { Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.service';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async.middleware';

const createAppointmentSchema = z.object({
  professional_id: z.string().uuid().or(z.string()), // Allow simple string for mock
  service_name: z.string(),
  date: z.string(),
  time: z.string(),
  price: z.number(),
});

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
    return res.json(data);
});
