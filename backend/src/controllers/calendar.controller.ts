import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';
import { asyncHandler } from '../middleware/async.middleware';

const getUserIdCompat = (req: Request): string =>
  String((req as any).user?.userId || (req as any).user?.id || '').trim();

const toIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const sanitizeIcs = (value: string) => String(value || '')
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdCompat(req);
  
  if (isMockMode()) {
    const events = [
      { id: 'evt-1', title: 'Meditação Matinal', start_time: new Date().toISOString(), type: 'routine' },
      { id: 'evt-2', title: 'Sessão Terapia', start_time: new Date(Date.now() + 3600000).toISOString(), type: 'appointment' },
      { id: 'evt-3', title: 'Weekly Yoga', start_time: new Date().toISOString(), type: 'routine', recurrence: 'WEEKLY' }
    ];

    // UPGRADE: 9.3 Recurrence Logic
    // Simple expansion for Mock Mode
    const expanded = [...events];
    events.filter(e => e.recurrence === 'WEEKLY').forEach(e => {
         const nextWeek = new Date(e.start_time);
         nextWeek.setDate(nextWeek.getDate() + 7);
         expanded.push({ ...e, id: `${e.id}-next`, start_time: nextWeek.toISOString(), title: `${e.title} (Recurring)` });
    });

    return res.json(expanded);
  }

  const events = await prisma.calendarEvent.findMany({
    where: { user_id: userId },
    orderBy: { start_time: 'asc' }
  });
  return res.json(events);
});

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdCompat(req);
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: 'Missing event id' });

  if (isMockMode()) {
    return res.json({
      id,
      user_id: userId || 'mock-user',
      title: 'Vivência (Mock)',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      type: 'workshop',
      details: JSON.stringify({ kind: 'workshop', capacity: 15, roomName: 'Sala Cristal', price: 0 }),
    });
  }

  const event = await prisma.calendarEvent.findFirst({
    where: { id, user_id: userId },
  });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  return res.json(event);
});


export const createEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserIdCompat(req);
    const { title, start, end, type, details } = req.body;
    
    if (isMockMode()) {
      // Conflict Simulation: Reject appointments at 14:00
      const startDate = new Date(start);
      if (startDate.getHours() === 14) {
          return res.status(409).json({ error: 'Conflict detected: Time slot occupied' });
      }

      return res.status(201).json({
        id: 'mock-event-id',
        user_id: userId || 'mock-user',
        title,
        start_time: start,
        end_time: end,
        type,
        details: typeof details === 'string' ? details : undefined,
      });
    }

    const event = await prisma.calendarEvent.create({
        data: {
            user_id: userId,
            title,
            start_time: new Date(start),
            end_time: new Date(end),
            type,
            details: typeof details === 'string' ? details : undefined,
        }
    });

    return res.json(event);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdCompat(req);
  const { id } = req.params;
  const { title, start, end, type, details } = req.body || {};

  if (!id) return res.status(400).json({ error: 'Missing event id' });
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (isMockMode()) {
    return res.json({
      id,
      user_id: userId || 'mock-user',
      ...(title ? { title } : {}),
      ...(start ? { start_time: start } : {}),
      ...(end ? { end_time: end } : {}),
      ...(typeof type === 'string' ? { type } : {}),
      ...(typeof details === 'string' ? { details } : {}),
      updated_at: new Date().toISOString(),
      mock: true,
    });
  }

  const existing = await prisma.calendarEvent.findFirst({ where: { id, user_id: userId } });
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  const updated = await prisma.calendarEvent.update({
    where: { id },
    data: {
      ...(typeof title === 'string' && title.trim() ? { title: title.trim() } : {}),
      ...(start ? { start_time: new Date(start) } : {}),
      ...(end ? { end_time: new Date(end) } : {}),
      ...(typeof type === 'string' ? { type } : {}),
      ...(typeof details === 'string' ? { details } : {}),
    },
  });

  return res.json(updated);
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdCompat(req);
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing event id' });
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (isMockMode()) {
    return res.json({ id, deleted: true, mock: true });
  }

  const existing = await prisma.calendarEvent.findFirst({ where: { id, user_id: userId } });
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  await prisma.calendarEvent.delete({ where: { id } });
  return res.json({ id, deleted: true });
});

export const syncToMobile = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdCompat(req);
  
  if (isMockMode()) {
     return res.json({
      format: 'ics',
      filename: 'viva360-calendar.ics',
      data: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Viva360//Agenda//PT-BR\r\nEND:VCALENDAR\r\n',
      sync_status: 'synced'
    });
  }

  const events = await prisma.calendarEvent.findMany({
    where: { user_id: userId },
    orderBy: { start_time: 'asc' },
  });

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Viva360//Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((event) => {
    const uid = `${event.id}@viva360.app`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(new Date(event.start_time))}`,
      `DTEND:${toIcsDate(new Date(event.end_time))}`,
      `SUMMARY:${sanitizeIcs(event.title)}`,
      `DESCRIPTION:${sanitizeIcs(event.details || event.type || 'Evento Viva360')}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');

  return res.json({
    format: 'ics',
    filename: 'viva360-calendar.ics',
    data: `${lines.join('\r\n')}\r\n`,
    sync_status: 'synced',
    eventCount: events.length,
  });
});
