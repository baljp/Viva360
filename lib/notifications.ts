/**
 * lib/notifications.ts — Web Push subscription management (frontend)
 *
 * Flow:
 *  1. subscribePush()   → asks permission → creates PushSubscription → POST /notifications/push/subscribe
 *  2. unsubscribePush() → removes from browser → DELETE /notifications/push/subscribe
 *  3. SW message listener handles VAPID key rotation automatically
 */
import { api } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert URL-safe base64 VAPID key to Uint8Array for PushManager */
function b64ToUint8(b64: string): Uint8Array {
  const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
  const raw    = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ── VAPID key (fetched once, then cached) ─────────────────────────────────────

let _vapidKey: string | null = null;

async function getVapidKey(): Promise<string | null> {
  if (_vapidKey) return _vapidKey;

  // 1. Build-time env var (fastest)
  const env = typeof import.meta !== 'undefined'
    ? (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY
    : null;
  if (env) { _vapidKey = env; return _vapidKey; }

  // 2. Runtime fetch from backend
  try {
    const res  = await fetch('/api/notifications/push/vapid-key');
    const data = await res.json();
    _vapidKey  = data?.publicKey ?? null;
  } catch { /* network error */ }

  return _vapidKey;
}

// ── SW registration ───────────────────────────────────────────────────────────

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.ready; }
  catch { return null; }
}

// ── Permission ────────────────────────────────────────────────────────────────

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getPushPermissionState(): PushPermissionState {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as PushPermissionState;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;
  return (await Notification.requestPermission()) === 'granted';
}

// ── Subscribe ─────────────────────────────────────────────────────────────────

export interface PushSubscribeResult {
  success: boolean;
  reason?: 'unsupported' | 'permission_denied' | 'no_vapid_key' | 'sw_unavailable' | 'error';
}

export async function subscribePush(): Promise<PushSubscribeResult> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window))
    return { success: false, reason: 'unsupported' };

  if (!(await requestNotificationPermission()))
    return { success: false, reason: 'permission_denied' };

  const vapidKey = await getVapidKey();
  if (!vapidKey) return { success: false, reason: 'no_vapid_key' };

  const reg = await registerServiceWorker();
  if (!reg)  return { success: false, reason: 'sw_unavailable' };

  try {
    // Reuse existing subscription if already subscribed
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: b64ToUint8(vapidKey).buffer as ArrayBuffer,
      });
    }

    const json = sub.toJSON();
    await api.notifications.subscribePush({
      endpoint:  sub.endpoint,
      keys:      { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
      userAgent: navigator.userAgent,
    });

    _setupKeyRotationListener();
    return { success: true };
  } catch (err) {
    console.error('[Push] subscribe error:', err);
    return { success: false, reason: 'error' };
  }
}

// ── Unsubscribe ───────────────────────────────────────────────────────────────

export async function unsubscribePush(): Promise<boolean> {
  const reg = await registerServiceWorker();
  if (!reg) return false;
  try {
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;
    const ep = sub.endpoint;
    await sub.unsubscribe();
    await api.notifications.unsubscribePush(ep);
    return true;
  } catch (err) {
    console.error('[Push] unsubscribe error:', err);
    return false;
  }
}

// ── Current state ─────────────────────────────────────────────────────────────

export async function getPushSubscriptionState(): Promise<{ permission: PushPermissionState; subscribed: boolean }> {
  const permission = getPushPermissionState();
  if (permission !== 'granted') return { permission, subscribed: false };
  const reg = await registerServiceWorker();
  if (!reg)  return { permission, subscribed: false };
  const sub = await reg.pushManager.getSubscription();
  return { permission, subscribed: !!sub };
}

// ── Key rotation listener ─────────────────────────────────────────────────────

let _listenerActive = false;
function _setupKeyRotationListener() {
  if (_listenerActive || !('serviceWorker' in navigator)) return;
  _listenerActive = true;

  navigator.serviceWorker.addEventListener('message', async ev => {
    if (ev.data?.type !== 'PUSH_SUBSCRIPTION_CHANGED') return;
    const s = ev.data.newSubscription;
    if (!s) return;
    try {
      await api.notifications.subscribePush({
        endpoint:  s.endpoint,
        keys:      { p256dh: s.keys?.p256dh ?? '', auth: s.keys?.auth ?? '' },
        userAgent: navigator.userAgent,
      });
      console.log('[Push] Key rotation: new subscription saved to backend');
    } catch { console.warn('[Push] Key rotation: failed to save'); }
  });
}
