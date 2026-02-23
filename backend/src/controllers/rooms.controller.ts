import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { z } from 'zod';
import { CloudinaryService } from '../services/cloudinary.service';
import { isMockMode } from '../services/supabase.service';

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
  // Aggregate data
  const totalRooms = await prisma.room.count();
  const occupied = await prisma.room.count({ where: { status: 'occupied' } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const revenueAgg = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      status: 'completed',
      date: { gte: today },
    },
  });

  return res.json({
    total_rooms: totalRooms,
    occupied_rate: totalRooms > 0 ? (occupied / totalRooms) * 100 : 0,
    revenue_today: Number(revenueAgg._sum?.amount || 0)
  });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

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

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (String((room as any).hub_id) !== hubId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  let imageUrl: string | null = null;
  if (payload.imageBase64) {
    // If Cloudinary is configured, store URL; otherwise persist the data URL as a last-resort
    // so the UX "Alterar Foto" actually works in environments without external storage.
    const uploaded = await CloudinaryService.uploadImage(payload.imageBase64, 'viva360/rooms');
    imageUrl = uploaded || payload.imageBase64;
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
  const { title, description, specialties, availability } = req.body;

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
      {
        id: 'mock-vacancy-1',
        title: 'Guardião de Reiki',
        description: 'Atendimento integrativo com agenda flexível.',
        specialties: ['Reiki'],
        status: 'OPEN',
      },
      {
        id: 'mock-vacancy-2',
        title: 'Facilitador(a) de Yoga',
        description: 'Turmas coletivas e práticas de alinhamento.',
        specialties: ['Yoga'],
        status: 'OPEN',
      },
    ]);
  }

  try {
    const vacancies = await prisma.vacancy.findMany();
    return res.json(vacancies);
  } catch (error: any) {
    // If the table/columns are missing (common when DB wasn't migrated yet),
    // degrade gracefully to an empty list so the UI can show an honest empty state.
    const code = String(error?.code || '');
    if (code === 'P2021' || code === 'P2022') {
      return res.json([]);
    }
    throw error;
  }
});
