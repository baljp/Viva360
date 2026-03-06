import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { z } from 'zod';
import { CloudinaryService } from '../services/cloudinary.service';
import { isMockMode } from '../lib/appMode';
import { isDbUnavailableError } from '../lib/dbReadFallback';
import { listMockRoomsByHub, mockAdapter, saveMockRoom } from '../services/mockAdapter';

const getUserIdCompat = (req: Request): string =>
  String(req.user?.userId || req.user?.id || '').trim();
const getRole = (req: Request): string => String(req.user?.role || '').trim().toUpperCase();

type RoomMeta = {
  imageUrl?: string;
  description?: string;
  occupant?: string;
  [key: string]: unknown;
};

const parseRoomMeta = (raw?: string | null): { meta: RoomMeta; legacyOccupant?: string } => {
  if (!raw) return { meta: {} };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return { meta: parsed as RoomMeta };
    return { meta: {}, legacyOccupant: String(raw) };
  } catch {
    return { meta: {}, legacyOccupant: String(raw) };
  }
};

const serializeRoomMeta = (existing: string | null | undefined, updates: Partial<RoomMeta>) => {
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
  try {
    // Filter rooms by hub (space) by default.
    const rooms = await prisma.room.findMany({
      where: hubId ? { hub_id: hubId } : undefined,
      orderBy: { created_at: 'desc' },
    });
    const shaped = rooms.map((room) => {
      const { meta } = parseRoomMeta(room.current_occupant);
      return {
        ...room,
        imageUrl: meta?.imageUrl || null,
        description: meta?.description || null,
      };
    });
    return res.json(shaped);
  } catch (error) {
    if (isMockMode() && isDbUnavailableError(error)) {
      const fallbackRooms = hubId
        ? listMockRoomsByHub(hubId)
        : [...mockAdapter.spaces.rooms.values()];
      const shaped = fallbackRooms.map((room) => {
        const { meta } = parseRoomMeta(room.current_occupant);
        return {
          ...room,
          imageUrl: meta?.imageUrl || null,
          description: meta?.description || null,
        };
      });
      return res.json(shaped);
    }
    throw error;
  }
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const hubId = getUserIdCompat(req);
  const role = getRole(req);
  try {
    const roomWhere = role === 'ADMIN' ? undefined : { hub_id: hubId };

    const totalRooms = await prisma.room.count({ where: roomWhere });
    const occupied = await prisma.room.count({
      where: {
        ...(roomWhere || {}),
        status: 'occupied',
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const revenueWhere = role === 'ADMIN'
      ? {
        status: 'completed',
        date: { gte: today },
      }
      : {
        user_id: hubId,
        status: 'completed',
        date: { gte: today },
      };

    const revenueAgg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: revenueWhere,
    });

    return res.json({
      total_rooms: totalRooms,
      occupied_rate: totalRooms > 0 ? (occupied / totalRooms) * 100 : 0,
      revenue_today: Number(revenueAgg._sum?.amount || 0)
    });
  } catch (error) {
    if (isMockMode() && isDbUnavailableError(error)) {
      const rooms = role === 'ADMIN'
        ? [...mockAdapter.spaces.rooms.values()]
        : listMockRoomsByHub(hubId);
      const occupied = rooms.filter((room) => String(room.status || '').toLowerCase() === 'occupied').length;
      return res.json({
        total_rooms: rooms.length,
        occupied_rate: rooms.length > 0 ? (occupied / rooms.length) * 100 : 0,
        revenue_today: 0,
        _fallback: true,
      });
    }
    throw error;
  }
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = getUserIdCompat(req);
  const role = getRole(req);

  if (!id) return res.status(400).json({ error: 'Missing room id' });

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (role !== 'ADMIN' && String(room.hub_id) !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await prisma.room.update({
    where: { id },
    data: { status }
  });
  return res.json(updated);
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

  try {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (String(room.hub_id) !== hubId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let imageUrl: string | null = null;
    if (payload.imageBase64) {
      // If Cloudinary is configured, store URL; otherwise persist the data URL as a last-resort
      // so the UX "Alterar Foto" actually works in environments without external storage.
      const uploaded = await CloudinaryService.uploadImage(payload.imageBase64, 'viva360/rooms');
      imageUrl = uploaded || payload.imageBase64;
    }

    const nextMetaUpdates: Partial<RoomMeta> = {};
    if (typeof payload.description === 'string') nextMetaUpdates.description = payload.description;
    if (imageUrl) nextMetaUpdates.imageUrl = imageUrl;

    const updated = await prisma.room.update({
      where: { id },
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(typeof payload.capacity === 'number' ? { capacity: payload.capacity } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        ...(Object.keys(nextMetaUpdates).length ? { current_occupant: serializeRoomMeta(room.current_occupant, nextMetaUpdates) } : {}),
      },
    });

    const { meta } = parseRoomMeta(updated.current_occupant);
    return res.json({
      ...updated,
      imageUrl: meta?.imageUrl || null,
      description: meta?.description || null,
    });
  } catch (error) {
    if (isMockMode() && isDbUnavailableError(error)) {
      const room = mockAdapter.spaces.rooms.get(id);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (String(room.hub_id) !== hubId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const nextMetaUpdates: Partial<RoomMeta> = {};
      if (typeof payload.description === 'string') nextMetaUpdates.description = payload.description;
      if (payload.imageBase64) nextMetaUpdates.imageUrl = payload.imageBase64;
      const updated = saveMockRoom({
        ...room,
        ...(payload.name ? { name: payload.name } : {}),
        ...(typeof payload.capacity === 'number' ? { capacity: payload.capacity } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        current_occupant: Object.keys(nextMetaUpdates).length
          ? serializeRoomMeta(room.current_occupant, nextMetaUpdates)
          : room.current_occupant,
        updated_at: new Date().toISOString(),
      });
      const { meta } = parseRoomMeta(updated.current_occupant);
      return res.json({
        ...updated,
        imageUrl: meta?.imageUrl || null,
        description: meta?.description || null,
      });
    }
    throw error;
  }
});

export const createVacancy = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, specialties, availability } = req.body;
  const actorId = getUserIdCompat(req);
  const role = getRole(req);
  const spaceId = role === 'ADMIN'
    ? String(req.body?.spaceId || actorId).trim()
    : actorId;

  const vacancy = await prisma.vacancy.create({
    data: {
      title,
      description,
      specialties: specialties || [],
      space_id: spaceId || 'unknown'
    }
  });
  return res.status(201).json(vacancy);
});

export const listVacancies = asyncHandler(async (req: Request, res: Response) => {
  const role = getRole(req);
  const userId = getUserIdCompat(req);
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
    const where = role === 'ADMIN'
      ? undefined
      : role === 'SPACE'
        ? { space_id: userId }
        : { status: 'open' };
    const vacancies = await prisma.vacancy.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 200,
    });
    return res.json(vacancies);
  } catch (error: unknown) {
    // If the table/columns are missing (common when DB wasn't migrated yet),
    // degrade gracefully to an empty list so the UI can show an honest empty state.
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code || '') : '';
    if (code === 'P2021' || code === 'P2022') {
      return res.json([]);
    }
    throw error;
  }
});
