/**
 * sw-push.js — Viva360 Service Worker push handler
 *
 * Injected into Workbox-generated SW via vite.config.ts importScripts.
 * Handles push events even when app is closed/backgrounded.
 *
 * Payload JSON (from push.service.ts):
 * { title, body, icon, badge, tag, url, data }
 */

// ── Push received ─────────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;

  let payload = {};
  try { payload = event.data.json(); }
  catch { payload = { title: 'Viva360', body: event.data.text() || '' }; }

  const title   = payload.title || 'Viva360';
  const options = {
    body:               payload.body   || '',
    icon:               payload.icon   || '/icons/icon-192.png',
    badge:              payload.badge  || '/icons/icon-192.png',
    tag:                payload.tag    || 'viva360-default',
    data:               { url: payload.url || '/', ...(payload.data || {}) },
    vibrate:            [200, 100, 200],
    requireInteraction: false,
    silent:             false,
    actions: [
      { action: 'open',    title: 'Abrir' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification clicked ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Focus existing tab
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      // Open new tab
      return clients.openWindow?.(url);
    })
  );
});

// ── Subscription key rotation ─────────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    (async () => {
      try {
        const newSub = await self.registration.pushManager.subscribe(
          event.oldSubscription?.options || { userVisibleOnly: true }
        );
        // Notify open tabs to re-register with backend
        const tabs = await clients.matchAll({ type: 'window' });
        tabs.forEach(c => c.postMessage({
          type: 'PUSH_SUBSCRIPTION_CHANGED',
          newSubscription: JSON.parse(JSON.stringify(newSub)),
        }));
      } catch (e) {
        // Best-effort flow: tabs will re-register on next session if rotation fails.
      }
    })()
  );
});
