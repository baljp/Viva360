/**
 * NotificationsController
 *
 * GET    /notifications                  → list in-app
 * POST   /notifications/read-all         → mark all read
 * POST   /notifications/:id/read         → mark one read
 * GET    /notifications/push/vapid-key   → VAPID public key (no auth)
 * POST   /notifications/push/subscribe   → save push subscription
 * DELETE /notifications/push/subscribe   → remove push subscription
 */
import { Request, Response }  from 'express';
import { asyncHandler }       from '../middleware/async.middleware';
import { notificationService } from '../services/notification.service';
import { pushService }        from '../services/push.service';
import { handleDbReadFallback } from '../lib/dbReadFallback';
import prisma                 from '../lib/prisma';
import { logger }             from '../lib/logger';
import { z }                  from 'zod';

// ── In-App ────────────────────────────────────────────────────────────────────

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  try {
    const notes = await notificationService.list(userId);
    return res.json(notes);
  } catch (err) {
    if (handleDbReadFallback(res, err, { route: 'notifications.list', userId, fallbackPayload: [] })) return;
    throw err;
  }
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  return res.json(await notificationService.markAsRead(userId, id));
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  return res.json(await notificationService.markAllAsRead(userId));
});

// ── Push: VAPID public key ────────────────────────────────────────────────────

export const getVapidKey = asyncHandler(async (_req: Request, res: Response) => {
  const publicKey = pushService.getVapidPublicKey();
  if (!publicKey) return res.status(503).json({ error: 'Push not configured' });
  return res.json({ publicKey });
});

// ── Push: Subscribe ───────────────────────────────────────────────────────────

const SubscribeBody = z.object({
  endpoint:  z.string().url(),
  keys:      z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  userAgent: z.string().optional(),
});

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const parsed = SubscribeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bad payload', details: parsed.error.flatten() });

  const { endpoint, keys, userAgent } = parsed.data;
  try {
    await prisma.pushSubscription.upsert({
      where:  { endpoint },
      create: { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth,
                user_agent: userAgent ?? req.headers['user-agent'] ?? null },
      update: { user_id: userId, p256dh: keys.p256dh, auth: keys.auth, last_used_at: new Date() },
    });
    logger.info('push.subscribed', { userId, ep: endpoint.slice(0, 40) });
    return res.status(201).json({ success: true });
  } catch (err) {
    logger.error('push.subscribe_error', { userId, err });
    return res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// ── Push: Unsubscribe ─────────────────────────────────────────────────────────

const UnsubBody = z.object({ endpoint: z.string().url() });

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const parsed = UnsubBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bad payload' });
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint, user_id: userId } });
    logger.info('push.unsubscribed', { userId });
    return res.json({ success: true });
  } catch (err) {
    logger.error('push.unsubscribe_error', { userId, err });
    return res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

export const sendPushSimulation = async (userId: string, title: string, message: string) => {
  await notificationService.sendPushSimulation(userId, title, message);
};
