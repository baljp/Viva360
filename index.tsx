// [DEPLOYMENT_HEARTBEAT]: 2026-01-28 14:55
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserRouter, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initMonitoring } from './lib/monitoring';
import './src/index.css'; // Global Design System
import { installBootRecovery } from './src/boot/bootRecovery';

// Recovery guard to avoid "blank screen" after SW/cached-chunk mismatches.
// NOTE: Service worker registration is already handled by vite-plugin-pwa (registerSW.js).
installBootRecovery();

// ── Sentry: init before render so the first route transition is captured ──────
initMonitoring();

// Wire up React Router v7 so Sentry creates a span per navigation.
// Only active when DSN is set (initMonitoring already guards this).
Sentry.reactRouterV6BrowserTracingIntegration?.({
  useEffect: React.useEffect,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* Sentry catches render errors that bypass our custom ErrorBoundary */}
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Algo inesperado aconteceu</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            O erro foi registrado automaticamente. Nossa equipe foi notificada.
          </p>
          <button
            onClick={resetError}
            style={{
              background: '#6366f1', color: '#fff', border: 'none',
              borderRadius: '0.75rem', padding: '0.75rem 1.5rem',
              cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      onError={(error, info) => {
        console.error('[Sentry.ErrorBoundary]', error, info);
      }}
    >
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

// Used by boot recovery watchdog as a signal that hydration succeeded.
(window as any).__VIVA360_MOUNTED__ = true;
