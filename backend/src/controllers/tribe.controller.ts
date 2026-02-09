import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { tribeService } from '../services/tribe.service';

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const hubId = (req as any).user?.userId;
  const { email } = req.body;

  try {
      const invite = await tribeService.inviteMember(hubId, email);
      return res.json(invite);
  } catch (error: any) {
      if (error.message === 'Only Sanctuaries can invite team members') {
          return res.status(403).json({ error: error.message });
      }
      throw error;
  }
});

export const listInvites = asyncHandler(async (req: Request, res: Response) => {
  const hubId = (req as any).user?.userId;
  
  const invites = await tribeService.listInvites(hubId);
  return res.json(invites);
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const hubId = (req as any).user?.userId;

  const members = await tribeService.listMembers(hubId);
  return res.json(members);
});

export const joinTribe = asyncHandler(async (req: Request, res: Response) => {
    const { vacancyId } = req.body;
    const proId = (req as any).user?.userId;

    const result = await tribeService.joinTribe(proId, vacancyId);
    return res.json(result);
});

export const syncVibration = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const reward = 10;

    return res.json({
        success: true,
        reward,
        syncedAt: new Date().toISOString(),
        userId,
    });
});
