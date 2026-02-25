import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { isMockMode } from '../services/supabase.service';
import { mockEventResponse } from '../services/mockAdapter';

const JOURNAL_EVENT_TYPE = 'JOURNAL_ENTRY';

const computeStreak = (dates: string[]) => {
  if (!dates.length) return 0;
  const uniqueDays = Array.from(
    new Set(dates.map((value) => new Date(value).toISOString().slice(0, 10)))
  ).sort((a, b) => (a < b ? 1 : -1));

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const day of uniqueDays) {
    const expected = cursor.toISOString().slice(0, 10);
    if (day !== expected) {
      if (streak === 0) {
        const yesterday = new Date(cursor);
        yesterday.setDate(cursor.getDate() - 1);
        if (day !== yesterday.toISOString().slice(0, 10)) {
          break;
        }
      } else {
        break;
      }
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const createEntry = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const payload = req.body || {};

  if (isMockMode()) {
    return res.status(201).json(mockEventResponse('journal', userId, payload));
  }

  const created = await prisma.event.create({
    data: {
      stream_id: userId,
      type: JOURNAL_EVENT_TYPE,
      payload,
      version: 1,
    },
  });

  return res.status(201).json({
    id: created.id,
    createdAt: created.created_at.toISOString(),
    userId,
    ...payload,
  });
});

export const listEntries = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  if (isMockMode()) {
    return res.json([]);
  }

  const events = await prisma.event.findMany({
    where: {
      stream_id: userId,
      type: JOURNAL_EVENT_TYPE,
    },
    orderBy: { created_at: 'desc' },
    take: 200,
  });

  const entries = events.map((event) => {
    const payload = (event.payload || {}) as Record<string, unknown>;
    return {
      id: event.id,
      createdAt: event.created_at.toISOString(),
      userId,
      ...payload,
    };
  });

  return res.json(entries);
});

export const getJournalStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  if (isMockMode()) {
    return res.json({ totalEntries: 0, streak: 0, commonWords: [] });
  }

  const events = await prisma.event.findMany({
    where: {
      stream_id: userId,
      type: JOURNAL_EVENT_TYPE,
    },
    select: {
      created_at: true,
      payload: true,
    },
    orderBy: { created_at: 'desc' },
    take: 500,
  });

  const dates = events.map((event) => event.created_at.toISOString());
  const streak = computeStreak(dates);

  return res.json({
    totalEntries: events.length,
    streak,
    commonWords: [],
  });
});

