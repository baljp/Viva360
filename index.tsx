// [DEPLOYMENT_HEARTBEAT]: 2026-01-28 14:55
/// <reference types="vite-plugin-pwa/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './src/index.css'; // Global Design System
import { installBootRecovery } from './src/boot/bootRecovery';
import { OfflineIndicator } from './components/OfflineIndicator';
import { registerSW } from 'virtual:pwa-register';

// Setup PWA Service Worker for automated cache invalidation post-deploy
const updateSW = registerSW({
  onNeedRefresh() {
    // Automatically accept the new sw and reload the page to ensure clients always run the latest version
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] Ready for offline use');
  }
});

// Recovery guard to avoid "blank screen" after SW/cached-chunk mismatches.
// NOTE: Service worker registration is already handled by vite-plugin-pwa (registerSW.js).
installBootRecovery();

const scheduleIdle = (cb: () => void) => {
  if (typeof window === 'undefined') return;
  const w = window as Window & { requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(cb, { timeout: 2500 });
    return;
  }
  window.setTimeout(cb, 800);
};

// Dev-only: load click tracker lazily to avoid startup cost in production.
if (import.meta.env.DEV) {
  scheduleIdle(() => {
    import('./src/utils/deathClickTracker')
      .then((m) => m.initDeathClickTracker())
      .catch(() => undefined);
  });
}

// Monitoring is non-critical for first paint; defer to idle so the UI boots sooner.
const shouldLoadMonitoring = Boolean(import.meta.env.VITE_SENTRY_DSN || import.meta.env.VITE_LOGROCKET_APP_ID);
if (shouldLoadMonitoring) {
  scheduleIdle(() => {
    import('./lib/monitoring')
      .then((m) => m.initMonitoring())
      .catch((err) => console.warn('[Monitoring] Deferred init failed', err));
  });
}

// Flow telemetry aggregation/export is lightweight and useful for QA/pilots; install off the critical path.
scheduleIdle(() => {
  import('./src/flow/flowTelemetryRuntime')
    .then((m) => m.installFlowTelemetryRuntime())
    .catch(() => undefined);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <OfflineIndicator />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Used by boot recovery watchdog as a signal that hydration succeeded.
(window as any).__VIVA360_MOUNTED__ = true;
