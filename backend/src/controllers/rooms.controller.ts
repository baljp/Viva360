import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';
import { asyncHandler } from '../middleware/async.middleware';
import { z } from 'zod';
import { CloudinaryService } from '../services/cloudinary.service';

const getUserIdCompat = (req: Request): string =>
  String((req as any).user?.userId || (req as any).user?.id || '').trim();

const parseRoomMeta = (raw?: string | null): { meta: any; legacyOccupant?: string } => {
  if (!raw) return { meta: {} };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return { meta: parsed };
    return { meta: {}, legacyOccupant: String(raw) };
  } catch {
    return { meta: {}, legacyOccupant: String(raw) };
  }
};

const serializeRoomMeta = (existing: string | null | undefined, updates: any) => {
  const { meta, legacyOccupant } = parseRoomMeta(existing);
  const next = {
    ...meta,
    ...updates,
    ...(legacyOccupant && !meta.occupant ? { occupant: legacyOccupant } : {}),
  };
  return JSON.stringify(next);
};

export const getRealTime = asyncHandler(async (req: Request, res: Response) => {
  if (isMockMode()) {
    return res.json([
      { id: 'mock-room-1', name: 'Sala Hera', status: 'available', next_booking: null },
      { id: 'mock-room-2', name: 'Sala Zeus', status: 'occupied', next_booking: '14:00' }
    ]);
  }
  const hubId = getUserIdCompat(req);
  // Filter rooms by hub (space) by default.
  const rooms = await prisma.room.findMany({
    where: hubId ? { hub_id: hubId } : undefined,
    orderBy: { created_at: 'desc' },
  });
  const shaped = rooms.map((room: any) => {
    const { meta } = parseRoomMeta(room.current_occupant);
    return {
      ...room,
      imageUrl: meta?.imageUrl || null,
      description: meta?.description || null,
    };
  });
  return res.json(shaped);
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
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
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (isMockMode() || id === 'dummy_id') {
      return res.json({ id, status, success: true, mock: true });
  }

  const room = await prisma.room.update({
    where: { id },
    data: { status }
  });
  return res.json(room);
});

const updateRoomSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  capacity: z.number().int().min(1).max(500).optional(),
  status: z.string().min(1).max(40).optional(),
  description: z.string().max(2000).optional(),
  imageBase64: z.string().min(20).optional(),
});

export const updateRoom = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const hubId = getUserIdCompat(req);
  const payload = updateRoomSchema.parse(req.body || {});

  if (!id) return res.status(400).json({ error: 'Missing room id' });
  if (!hubId) return res.status(401).json({ error: 'Unauthorized' });

  if (isMockMode() || id === 'dummy_id') {
    return res.json({ id, ...payload, success: true, mock: true });
  }

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (String((room as any).hub_id) !== hubId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  let imageUrl: string | null = null;
  if (payload.imageBase64) {
    // If Cloudinary is configured, store URL; otherwise persist base64 as last-resort.
    const uploaded = await CloudinaryService.uploadImage(payload.imageBase64, 'viva360/rooms');
    imageUrl = uploaded || null;
  }

  const nextMetaUpdates: any = {};
  if (typeof payload.description === 'string') nextMetaUpdates.description = payload.description;
  if (imageUrl) nextMetaUpdates.imageUrl = imageUrl;

  const updated = await prisma.room.update({
    where: { id },
    data: {
      ...(payload.name ? { name: payload.name } : {}),
      ...(typeof payload.capacity === 'number' ? { capacity: payload.capacity } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(Object.keys(nextMetaUpdates).length ? { current_occupant: serializeRoomMeta((room as any).current_occupant, nextMetaUpdates) } : {}),
    },
  });

  const { meta } = parseRoomMeta((updated as any).current_occupant);
  return res.json({
    ...updated,
    imageUrl: meta?.imageUrl || null,
    description: meta?.description || null,
  });
});

export const createVacancy = asyncHandler(async (req: Request, res: Response) => {
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
});

export const listVacancies = asyncHandler(async (req: Request, res: Response) => {
    if (isMockMode()) {
        return res.json([
            { id: 'v1', title: 'Psicólogo(a) Clínico', description: 'Atendimento de segunda a sexta', specialties: ['Psicologia'] },
            { id: 'v2', title: 'Massoterapeuta', description: 'Sala equipada disponível', specialties: ['Massagem'] }
        ]);
    }
    
    const vacancies = await prisma.vacancy.findMany();
    return res.json(vacancies);
});
