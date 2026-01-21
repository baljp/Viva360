
import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';


// Get environment safely
const getIsProd = () => {
  try {
    const env = (import.meta as any).env;
    return env ? env.PROD : false;
  } catch (e) {
    return false;
  }
};

const isProd = getIsProd();

// Initialize Sentry Asynchronously (Fire & Forget)
// This prevents bootstrap crashes if Sentry fails to load or init
const initSentry = async () => {
  if (!isProd) return;

  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN;
  // Robust check for DSN to prevent internal Sentry errors
  if (!dsn || typeof dsn !== 'string' || !dsn.startsWith('http')) {
    return;
  }

  try {
    const Sentry = await import('@sentry/react');
    
    Sentry.init({
      dsn,
      environment: 'production',
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 0.1,
    });
  } catch (e) {
    // Sentry failed to load - do not crash the app
    // In production we might want to silence this, or just log error safely
    console.error('Sentry initialization failed (non-fatal)');
  }
};

// Start Sentry (background)
// initSentry(); // Temporarily disabled for binary testing

// Registro do Service Worker para PWA (apenas em produção real processada por Vite)
if ('serviceWorker' in navigator && isProd) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { type: 'module' })
      .then(reg => console.log('SW Registered', reg))
      .catch(err => console.error('SW Registration Failed', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
