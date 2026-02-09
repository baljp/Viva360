import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { auditService } from '../services/audit.service';

export const listLogs = asyncHandler(async (req: Request, res: Response) => {
  const actorId = (req as any).user?.userId;
  const logs = await auditService.getEventsByActor(actorId, 100);
  return res.json(logs);
});

