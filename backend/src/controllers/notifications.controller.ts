import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { notificationService } from '../services/notification.service';
import { handleDbReadFallback } from '../lib/dbReadFallback';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  try {
    const notifications = await notificationService.list(userId);
    return res.json(notifications);
  } catch (err) {
    if (handleDbReadFallback(res, err, { route: 'notifications.list', userId, fallbackPayload: [] })) return;
    throw err;
  }
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const result = await notificationService.markAsRead(userId, id);
  return res.json(result);
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await notificationService.markAllAsRead(userId);
  return res.json(result);
});

export const sendPushSimulation = async (userId: string, title: string, message: string) => {
  await notificationService.sendPushSimulation(userId, title, message);
};
