
import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import * as Sentry from '@sentry/react';

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

// Sentry Error Monitoring (production only)
// Configure VITE_SENTRY_DSN in your .env file
if (isProd && (import.meta as any).env?.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: (import.meta as any).env.VITE_SENTRY_DSN,
    environment: 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.1, // 10% of transactions for performance
    replaysSessionSampleRate: 0.0, // Disable session replays
    replaysOnErrorSampleRate: 0.1, // 10% of errors get replays
  });
}

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
