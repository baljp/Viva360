import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { isMockMode, mockEventResponse } from '../services/mockAdapter';

const INTERVENTION_EVENT_TYPE = 'CLINICAL_INTERVENTION';

export const saveIntervention = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const payload = req.body || {};

  if (isMockMode()) {
    return res.status(201).json(mockEventResponse('intervention', userId, payload));
  }

  const created = await prisma.event.create({
    data: {
      stream_id: userId,
      type: INTERVENTION_EVENT_TYPE,
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

export const listInterventions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (isMockMode()) {
    const items = mockAdapter.events.list('clinical', String(userId || '')).map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt,
      userId: entry.userId,
      ...entry.payload,
    }));
    return res.json(items);
  }

  const events = await prisma.event.findMany({
    where: {
      stream_id: userId,
      type: INTERVENTION_EVENT_TYPE,
    },
    orderBy: { created_at: 'desc' },
    take: 200,
  });

  const data = events.map((event) => ({
    id: event.id,
    createdAt: event.created_at.toISOString(),
    userId,
    ...(event.payload as Record<string, unknown>),
  }));

  return res.json(data);
});
