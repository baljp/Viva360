import { cleanupRecoveryQuery, hasCssIntegrityProblem } from './bootRecoveryCss';

type RecoveryReason =
  | 'chunk_load_error'
  | 'boot_timeout'
  | 'css_load_error'
  | 'css_integrity_error';

const RECOVERY_ATTEMPTS_KEY = 'viva360.boot_recovery.attempts';
const RECOVERY_MAX_ATTEMPTS = 3;

function getRecoveryAttempts(): number {
  try {
    const raw = sessionStorage.getItem(RECOVERY_ATTEMPTS_KEY) || '0';
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function canRecover(): boolean {
  return getRecoveryAttempts() < RECOVERY_MAX_ATTEMPTS;
}

function markRecoveryAttempt(): void {
  try {
    sessionStorage.setItem(RECOVERY_ATTEMPTS_KEY, String(getRecoveryAttempts() + 1));
  } catch {
    // ignore
  }
}

function clearRecoveryMarkerOnHealthyBoot(): void {
  try {
    sessionStorage.removeItem(RECOVERY_ATTEMPTS_KEY);
    sessionStorage.removeItem('viva360.boot_recovery.reason');
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
  if (!canRecover()) return;
  markRecoveryAttempt();

  // Best-effort: ensure we don't keep serving stale precached assets.
  await clearServiceWorkersAndCaches();

  // Preserve reason for potential future diagnostics.
  try {
    sessionStorage.setItem('viva360.boot_recovery.reason', reason);
  } catch {
    // ignore
  }

  // Bust browser HTML cache on the current route. Plain reload is not always enough in Safari.
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('__viva_recover__', String(Date.now()));
  nextUrl.searchParams.set('__viva_recover_reason__', reason);
  window.location.replace(nextUrl.toString());
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
    const href: string | undefined = target?.href;
    const tagName = String(target?.tagName || '').toUpperCase();
    if (src && typeof src === 'string' && src.includes('/assets/')) {
      void recover('chunk_load_error');
      return;
    }
    // CSS asset failed to load (common on stale HTML -> hashed CSS mismatch after deploy).
    if (tagName === 'LINK' && href && href.includes('/assets/') && href.includes('.css')) {
      void recover('css_load_error');
      return;
    }
    // Some browsers emit generic error events with only href for missing stylesheets.
    if (!src && href && href.includes('/assets/') && href.includes('.css')) {
      void recover('css_load_error');
      return;
    }

    if (msg && isLikelyChunkLoadFailure(msg)) {
      void recover('chunk_load_error');
    }
  }, true);

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

  // 3) CSS watchdog: React may mount with missing CSS if a hashed stylesheet 404s due stale cache.
  // In that case the app "works" but looks broken (raw layout / huge images). Recover once.
  const runCssSanityCheck = () => {
    // Small delay lets the stylesheet load + React mount settle.
    window.setTimeout(() => {
      const mounted = (window as any).__VIVA360_MOUNTED__ === true;
      if (!mounted) return;
      void (async () => {
        if (await hasCssIntegrityProblem()) {
          await recover('css_integrity_error');
          return;
        }
        clearRecoveryMarkerOnHealthyBoot();
        cleanupRecoveryQuery();
      })();
    }, 1600);

    // Safari/slow network guard: second pass catches late stylesheet failures after initial mount.
    window.setTimeout(() => {
      const mounted = (window as any).__VIVA360_MOUNTED__ === true;
      if (!mounted) return;
      void (async () => {
        if (await hasCssIntegrityProblem()) {
          await recover('css_integrity_error');
        }
      })();
    }, 4200);
  };

  if (document.readyState === 'complete') {
    runCssSanityCheck();
  } else {
    window.addEventListener('load', runCssSanityCheck, { once: true });
  }
}
