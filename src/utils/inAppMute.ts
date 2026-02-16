// In-app notification mute window (used by "Retiro Offline").
// This intentionally only mutes in-app UX surfaces and does not attempt to
// control OS/browser push notification permissions.

const LS_KEY_UNTIL = 'viva360.inapp_mute_until';
const EVT = 'viva360:inappmute';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getInAppMuteUntil(): number | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY_UNTIL);
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  } catch {
    return null;
  }
}

export function setInAppMuteUntil(untilMs: number): void {
  if (!hasStorage()) return;
  try {
    if (!Number.isFinite(untilMs) || untilMs <= Date.now()) {
      window.localStorage.removeItem(LS_KEY_UNTIL);
      window.dispatchEvent(new Event(EVT));
      return;
    }
    window.localStorage.setItem(LS_KEY_UNTIL, String(Math.floor(untilMs)));
    window.dispatchEvent(new Event(EVT));
  } catch {
    // ignore
  }
}

export function clearInAppMute(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(LS_KEY_UNTIL);
    window.dispatchEvent(new Event(EVT));
  } catch {
    // ignore
  }
}

export function onInAppMuteChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  // Also react to cross-tab storage updates.
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function isInAppMuted(nowMs: number = Date.now()): boolean {
  const until = getInAppMuteUntil();
  return typeof until === 'number' && until > nowMs;
}
