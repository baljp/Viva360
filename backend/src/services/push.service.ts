/**
 * PushService — Real Web Push (VAPID) using `web-push` library
 *
 * Supports:
 *   Chrome/Android → Google FCM
 *   Firefox        → Mozilla Push Service
 *   Safari 16+     → Apple Push Notification Service
 *
 * Keys:  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT_EMAIL
 * Generate: node -e "require('web-push').generateVAPIDKeys()" | npx json
 */
import webpush, { PushSubscription as WebPushSub } from 'web-push';
import { logger } from '../lib/logger';

export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_CONTACT = process.env.VAPID_CONTACT_EMAIL || 'noreply@viva360.com.br';

const isConfigured = !!(VAPID_PUBLIC && VAPID_PRIVATE);

if (isConfigured) {
  webpush.setVapidDetails(`mailto:${VAPID_CONTACT}`, VAPID_PUBLIC, VAPID_PRIVATE);
  logger.info('push_service.vapid_ready');
} else {
  logger.warn('push_service.vapid_missing', {
    hint: 'Set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY + VAPID_CONTACT_EMAIL',
  });
}

export class PushService {
  private static _instance: PushService;
  static getInstance() {
    return (PushService._instance ??= new PushService());
  }

  getVapidPublicKey(): string { return VAPID_PUBLIC; }

  /**
   * Send to one subscription.
   * Returns false if subscription is expired (410/404) — caller should delete it.
   * Throws on unexpected errors.
   */
  async send(sub: PushSubscriptionData, payload: PushPayload): Promise<boolean> {
    if (!isConfigured) {
      logger.warn('push.send.skipped_no_vapid', { ep: sub.endpoint.slice(0, 40) });
      return false;
    }

    const wps: WebPushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    };

    const body = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      icon:  payload.icon  ?? '/icons/icon-192.png',
      badge: payload.badge ?? '/icons/icon-192.png',
      tag:   payload.tag   ?? 'viva360',
      url:   payload.url   ?? '/',
      data:  payload.data  ?? {},
    });

    try {
      await webpush.sendNotification(wps, body, { TTL: 86_400, urgency: 'normal' });
      logger.info('push.sent', { ep: sub.endpoint.slice(0, 40) });
      return true;
    } catch (err: any) {
      const code = err?.statusCode as number | undefined;
      if (code === 410 || code === 404) {
        logger.info('push.expired', { ep: sub.endpoint.slice(0, 40), code });
        return false; // caller removes from DB
      }
      logger.error('push.error', { ep: sub.endpoint.slice(0, 40), code, msg: err?.message });
      throw err;
    }
  }

  /** Send to many subscriptions, return list of expired endpoints. */
  async sendBatch(subs: PushSubscriptionData[], payload: PushPayload): Promise<string[]> {
    const expired: string[] = [];
    await Promise.allSettled(
      subs.map(async s => {
        try {
          const ok = await this.send(s, payload);
          if (!ok) expired.push(s.endpoint);
        } catch { /* non-fatal */ }
      })
    );
    return expired;
  }
}

export const pushService = PushService.getInstance();
