import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getEvents = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const events = await prisma.calendarEvent.findMany({
    where: { user_id: userId },
    orderBy: { start_time: 'asc' }
  });
  return res.json(events);
};


export const createEvent = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { title, start, end, type } = req.body;
    
    const event = await prisma.calendarEvent.create({
        data: {
            user_id: userId,
            title,
            start_time: new Date(start),
            end_time: new Date(end),
            type
        }
    });

    return res.json(event);
};

export const syncToMobile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const events = await prisma.calendarEvent.findMany({ where: { user_id: userId } });
  
  // Minimal ICS format simulation
  const icsData = events.map(e => `BEGIN:VEVENT\nSUMMARY:${e.title}\nDTSTART:${e.start_time.toISOString()}\nEND:VEVENT`).join('\n');
  
  return res.json({ format: 'ics', data: icsData, sync_status: 'synced' });
};
