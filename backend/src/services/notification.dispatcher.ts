/**
 * NotificationDispatcher — multi-channel delivery
 *
 * Channels: IN_APP | PUSH | EMAIL | WHATSAPP
 *
 * PUSH flow:
 *   1. Load all push_subscriptions for userId from DB
 *   2. Send real web-push via pushService.sendBatch()
 *   3. Auto-delete expired subscriptions (HTTP 410/404)
 */
import { emailService }       from './email.service';
import { whatsappService }    from './whatsapp.service';
import { pushService, PushPayload } from './push.service';
import prisma                 from '../lib/prisma';
import { logger }             from '../lib/logger';
import { isMockMode } from '../lib/appMode';

export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'PUSH' | 'IN_APP';

export interface NotificationPayload {
  userId:   string;
  title:    string;
  message:  string;
  channels: NotificationChannel[];
  metadata?: {
    eventType?:  string;
    entityType?: string;
    entityId?:   string;
    url?:        string;
    [k: string]: unknown;
  };
}

export class NotificationDispatcher {

  static async dispatch(payload: NotificationPayload) {
    if (isMockMode()) {
      logger.info('notification.dispatch.mock', { userId: payload.userId, title: payload.title });
      return payload.channels.map(ch => ({ channel: ch, status: 'mock' }));
    }

    logger.info('notification.dispatch', { userId: payload.userId, channels: payload.channels });

    const settled = await Promise.allSettled(
      payload.channels.map(ch => NotificationDispatcher._send(ch, payload))
    );

    return settled.map((r, i) => ({
      channel: payload.channels[i],
      status:  r.status === 'fulfilled' ? r.value : 'failed',
      ...(r.status === 'rejected' ? { error: String(r.reason) } : {}),
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  private static async _send(ch: NotificationChannel, p: NotificationPayload): Promise<string> {
    switch (ch) {

      // IN_APP: row already written by NotificationEngine; Supabase Realtime
      // broadcasts it to connected clients automatically.
      case 'IN_APP':
        return 'realtime';

      // PUSH
      case 'PUSH': {
        const subs = await NotificationDispatcher._getSubscriptions(p.userId);
        if (!subs.length) return 'no_subscriptions';

        const pushPayload: PushPayload = {
          title: p.title,
          body:  p.message,
          tag:   p.metadata?.eventType ?? 'viva360',
          url:   p.metadata?.url ?? '/',
          data: {
            eventType:  p.metadata?.eventType,
            entityType: p.metadata?.entityType,
            entityId:   p.metadata?.entityId,
          },
        };

        const expired = await pushService.sendBatch(subs, pushPayload);
        if (expired.length) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expired } } });
          logger.info('push.cleanup_expired', { userId: p.userId, count: expired.length });
        }
        return `sent:${subs.length - expired.length}`;
      }

      // EMAIL
      case 'EMAIL': {
        const email = await NotificationDispatcher._getEmail(p.userId);
        if (!email) return 'no_email';
        await emailService.send({ to: email, subject: p.title, template: 'NOTIFICATION',
          context: { body: p.message } });
        return 'sent';
      }

      // WHATSAPP
      case 'WHATSAPP': {
        const phone = await NotificationDispatcher._getPhone(p.userId);
        if (!phone) return 'no_phone';
        await whatsappService.send({ to: phone, text: `*${p.title}*\n${p.message}` });
        return 'sent';
      }

      default: return 'unknown';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  private static async _getSubscriptions(userId: string) {
    try {
      const rows = await prisma.pushSubscription.findMany({
        where:  { user_id: userId },
        select: { endpoint: true, p256dh: true, auth: true },
      });
      return rows.map(r => ({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }));
    } catch (err) {
      logger.error('push.fetch_subs_error', { userId, err });
      return [];
    }
  }

  private static async _getEmail(userId: string): Promise<string | null> {
    try {
      const p = await prisma.profile.findUnique({ where: { id: userId }, select: { email: true } });
      return p?.email ?? null;
    } catch { return null; }
  }

  private static async _getPhone(userId: string): Promise<string | null> {
    try {
      const p = await prisma.profile.findUnique({ where: { id: userId }, select: {} });
      return (p as any)?.phone ?? null;
    } catch { return null; }
  }
}
