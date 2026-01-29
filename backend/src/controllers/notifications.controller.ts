import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { notificationService } from '../services/notification.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  
  const notifications = await notificationService.list(userId);
  return res.json(notifications);
});

export const sendPushSimulation = async (userId: string, title: string, message: string) => {
  await notificationService.sendPushSimulation(userId, title, message);
};
