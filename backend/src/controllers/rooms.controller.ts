import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';

export const getRealTime = async (req: Request, res: Response) => {
  if (isMockMode()) {
    return res.json([
      { id: 'mock-room-1', name: 'Sala Hera', status: 'available', next_booking: null },
      { id: 'mock-room-2', name: 'Sala Zeus', status: 'occupied', next_booking: '14:00' }
    ]);
  }
  // Return all rooms for simplicity or filter by hub
  const rooms = await prisma.room.findMany();
  return res.json(rooms);
};

export const getAnalytics = async (req: Request, res: Response) => {
  if (isMockMode()) {
    return res.json({
      total_rooms: 10,
      occupied_rate: 45,
      revenue_today: 1250.00
    });
  }

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
    if (isMockMode() || id === 'dummy_id') {
       return res.json({ id, status, success: true, mock: true });
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

export const createVacancy = async (req: Request, res: Response) => {
    try {
        const { title, description, specialties, availability } = req.body; // Added availability
        
        if (isMockMode()) {
            return res.status(201).json({
                id: 'mock-vacancy-id',
                title,
                description,
                specialties,
                availability,
                spaceId: (req as any).user?.id || 'mock-space-id',
                created_at: new Date().toISOString()
            });
        }

        const vacancy = await prisma.vacancy.create({
            data: {
                title,
                description,
                specialties: specialties || [],
                space_id: req.user?.userId || 'unknown'
            }
        });
        return res.status(201).json(vacancy);
    } catch (e: any) {
        return res.status(500).json({ error: e.message || "Failed to create vacancy" });
    }
};

export const listVacancies = async (req: Request, res: Response) => {
    if (isMockMode()) {
        return res.json([
            { id: 'v1', title: 'Psicólogo(a) Clínico', description: 'Atendimento de segunda a sexta', specialties: ['Psicologia'] },
            { id: 'v2', title: 'Massoterapeuta', description: 'Sala equipada disponível', specialties: ['Massagem'] }
        ]);
    }
    
    const vacancies = await prisma.vacancy.findMany();
    return res.json(vacancies);
};
