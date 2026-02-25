import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';

const getUserIdCompat = (req: Request): string =>
  String(req.user?.userId || req.user?.id || '').trim();

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).max(5000).optional(),
});

const idParamsSchema = z.object({
  id: z.string().min(1).max(128),
});

const isoDateString = z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date');

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  start: isoDateString,
  end: isoDateString,
  type: z.string().min(1).max(64),
  details: z.string().max(5000).optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  start: isoDateString.optional(),
  end: isoDateString.optional(),
  type: z.string().min(1).max(64).optional(),
  details: z.string().max(5000).optional(),
});

const toIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const sanitizeIcs = (value: string) => String(value || '')
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdCompat(req);
  const { limit = 100, offset = 0 } = paginationSchema.parse(req.query || {});
  const events = await prisma.calendarEvent.findMany({
    where: { user_id: userId },
    orderBy: { start_time: 'asc' },
    take: limit,
    skip: offset,
  });
  return res.json(events);
});

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdCompat(req);
  const { id } = idParamsSchema.parse(req.params || {});

  const event = await prisma.calendarEvent.findFirst({
    where: { id, user_id: userId },
  });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  return res.json(event);
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdCompat(req);
  const { title, start, end, type, details } = createEventSchema.parse(req.body || {});

  const event = await prisma.calendarEvent.create({
    data: {
      user_id: userId,
      title,
      start_time: new Date(start),
      end_time: new Date(end),
      type,
      details: typeof details === 'string' ? details : undefined,
    },
  });

  return res.json(event);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdCompat(req);
  const { id } = idParamsSchema.parse(req.params || {});
  const { title, start, end, type, details } = updateEventSchema.parse(req.body || {});

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
  const { id } = idParamsSchema.parse(req.params || {});
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const existing = await prisma.calendarEvent.findFirst({ where: { id, user_id: userId } });
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  await prisma.calendarEvent.delete({ where: { id } });
  return res.json({ id, deleted: true });
});

export const syncToMobile = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdCompat(req);
  const { limit = 200, offset = 0 } = paginationSchema.parse(req.query || {});

  const events = await prisma.calendarEvent.findMany({
    where: { user_id: userId },
    orderBy: { start_time: 'asc' },
    take: limit,
    skip: offset,
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
  const ics = lines.join('\r\n') + '\r\n';

  return res.json({
    format: 'ics',
    filename: 'viva360-calendar.ics',
    data: ics,
    sync_status: 'synced',
  });
});
