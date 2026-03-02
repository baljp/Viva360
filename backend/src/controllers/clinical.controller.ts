import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { isMockMode, mockEventResponse, saveMockClinicalIntervention, listMockClinicalInterventions } from '../services/mockAdapter';
import { isDbUnavailableError } from '../lib/dbReadFallback';

const INTERVENTION_EVENT_TYPE = 'CLINICAL_INTERVENTION';

export const saveIntervention = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const payload = req.body || {};
  try {
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
  } catch (error) {
    if (isMockMode() && isDbUnavailableError(error)) {
      const fallback = mockEventResponse('mock-clinical', userId, payload);
      saveMockClinicalIntervention({
        id: String(fallback.id),
        stream_id: String(userId || ''),
        payload,
        created_at: String(fallback.createdAt || new Date().toISOString()),
      });
      return res.status(201).json(fallback);
    }
    throw error;
  }
});

export const listInterventions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  try {
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
  } catch (error) {
    if (isMockMode() && isDbUnavailableError(error)) {
      const fallback = listMockClinicalInterventions(String(userId || '')).map((event) => ({
        id: event.id,
        createdAt: event.created_at,
        userId,
        ...(event.payload as Record<string, unknown>),
      }));
      return res.json(fallback);
    }
    throw error;
  }
});
