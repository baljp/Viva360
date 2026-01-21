import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';

// Get User Notifications
export const getUserNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json(notifications);
});

// Mark Notification as Read
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const notification = await prisma.notification.findUnique({ where: { id: String(id) } });

  if (!notification) {
    throw new AppError('Notificação não encontrada', 404);
  }

  if (notification.userId !== userId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  const updated = await prisma.notification.update({
    where: { id: String(id) },
    data: { read: true },
  });

  res.json(updated);
});

// Mark All as Read
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  res.json({ message: 'Todas as notificações marcadas como lidas' });
});

// Create Notification (Internal use)
export const createNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, type, title, message, actionUrl } = req.body;

  if (!userId || !type || !title || !message) {
    throw new AppError('Dados incompletos para criar notificação', 400);
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      actionUrl,
    },
  });

  res.status(201).json(notification);
});
