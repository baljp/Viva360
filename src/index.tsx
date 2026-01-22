import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
console.log("🚀 [index.tsx] Starting application initialization...");
import { router } from './Router'; // Import the router
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Get environment safely
const getIsProd = () => {
// ... existing code ...
    try {
        const env = (import.meta as any).env;
        return env ? env.PROD : false;
    } catch (e) {
        return false;
    }
};

const isProd = getIsProd();

// ... existing code for Sentry ...
const logStartup = (msg: string, error?: any) => {
  console.log(`[Viva360 Startup] ${msg}`, error || '');
};

const renderFatalError = (error: any) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FEF9C3; color: #422006; padding: 20px; text-align: center;">
        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 16px; color: #854D0E;">Ops... Algo deu errado</h1>
        <p style="font-size: 18px; margin-bottom: 32px; max-w: 600px; line-height: 1.6;">
          Encontramos um problema ao carregar a plataforma.
        </p>
        <div style="background: rgba(255,255,255,0.5); padding: 16px; border-radius: 12px; margin-bottom: 32px; text-align: left; max-width: 800px; overflow: auto;">
          <code style="font-family: monospace; color: #B91C1C;">${error?.message || String(error)}</code>
        </div>
        <button onclick="localStorage.clear(); if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))}; window.location.reload();" 
          style="background: #CA8A04; color: white; border: none; padding: 16px 32px; font-size: 18px; font-weight: 600; border-radius: 9999px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          🛠️ Corrigir Automaticamente (Limpar Cache)
        </button>
      </div>
    `;
  }
};

window.addEventListener('error', (event) => renderFatalError(event.error));
window.addEventListener('unhandledrejection', (event) => renderFatalError(event.reason));

const initSentry = async () => {
  if (!isProd) return;
  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string' || !dsn.startsWith('http')) return;
  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn,
      environment: 'production',
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 0.1,
    });
  } catch (e) {
    console.warn('Sentry initialization failed (non-fatal)', e);
  }
};
initSentry();

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ [index.tsx] FATAL: Root element not found!");
  throw new Error("Could not find root element to mount to");
}

console.log("✅ [index.tsx] Root element found, mounting React app...");
const root = ReactDOM.createRoot(rootElement);
try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  renderFatalError(error);
}
