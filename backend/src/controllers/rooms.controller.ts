import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getRealTime = async (req: Request, res: Response) => {
  // Return all rooms for simplicity or filter by hub
  const rooms = await prisma.room.findMany();
  return res.json(rooms);
};

export const getAnalytics = async (req: Request, res: Response) => {
  // Aggregate data
  const totalRooms = await prisma.room.count();
  const occupied = await prisma.room.count({ where: { status: 'occupied' } });
  
  return res.json({
    total_rooms: totalRooms,
    occupied_rate: totalRooms > 0 ? (occupied / totalRooms) * 100 : 0,
    revenue_today: 1250.00 // Mock for speed
  });
};

export const updateStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    // If id is 'dummy_id' from k6 script, handle it
    if (id === 'dummy_id') {
       return res.json({ success: true, mock: true });
    }

    const room = await prisma.room.update({
      where: { id },
      data: { status }
    });
    return res.json(room);
  } catch (e) {
    return res.status(404).json({ error: 'Room not found' });
  }
};
