type RecoveryReason = 'chunk_load_error' | 'boot_timeout';

const RECOVERY_FLAG = 'viva360.boot_recovery.did_recover';

function didRecoverAlready(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_FLAG) === '1';
  } catch {
    return false;
  }
}

function markRecovered(): void {
  try {
    sessionStorage.setItem(RECOVERY_FLAG, '1');
  } catch {
    // ignore
  }
}

async function clearServiceWorkersAndCaches(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch {
    // ignore
  }

  try {
    // Clear CacheStorage if available (best-effort)
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {
    // ignore
  }
}

async function recover(reason: RecoveryReason): Promise<void> {
  if (didRecoverAlready()) return;
  markRecovered();

  // Best-effort: ensure we don't keep serving stale precached assets.
  await clearServiceWorkersAndCaches();

  // Preserve reason for potential future diagnostics.
  try {
    sessionStorage.setItem('viva360.boot_recovery.reason', reason);
  } catch {
    // ignore
  }

  // Reload hard; Vercel serves latest index/assets on alias.
  window.location.reload();
}

function isLikelyChunkLoadFailure(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('loading chunk') ||
    m.includes('chunkloaderror') ||
    m.includes('failed to fetch dynamically imported module') ||
    m.includes('importing a module script failed') ||
    m.includes('module script failed to load')
  );
}

export function installBootRecovery(): void {
  // 1) Catch typical chunk-load failures (usually stale SW cache after deploy).
  window.addEventListener('error', (event: Event) => {
    // Script load errors may come via event.target (HTMLScriptElement)
    const anyEvent = event as any;
    const msg: string = String(anyEvent?.message || '');

    const target = anyEvent?.target;
    const src: string | undefined = target?.src;
    if (src && typeof src === 'string' && src.includes('/assets/')) {
      void recover('chunk_load_error');
      return;
    }

    if (msg && isLikelyChunkLoadFailure(msg)) {
      void recover('chunk_load_error');
    }
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const msg =
      typeof reason === 'string'
        ? reason
        : reason && typeof reason?.message === 'string'
          ? reason.message
          : '';

    if (msg && isLikelyChunkLoadFailure(msg)) {
      void recover('chunk_load_error');
    }
  });

  // 2) Watchdog: if React never mounts, offer a recovery reload.
  // Avoid being aggressive: this only triggers once per tab-session.
  window.setTimeout(() => {
    const mounted = (window as any).__VIVA360_MOUNTED__ === true;
    if (!mounted) {
      void recover('boot_timeout');
    }
  }, 12000);
}

