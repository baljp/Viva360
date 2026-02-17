// [DEPLOYMENT_HEARTBEAT]: 2026-01-28 14:55
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initMonitoring } from './lib/monitoring';
import './src/index.css'; // Global Design System
import { installBootRecovery } from './src/boot/bootRecovery';

// Recovery guard to avoid "blank screen" after SW/cached-chunk mismatches.
// NOTE: Service worker registration is already handled by vite-plugin-pwa (registerSW.js).
installBootRecovery();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

initMonitoring();

import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Used by boot recovery watchdog as a signal that hydration succeeded.
(window as any).__VIVA360_MOUNTED__ = true;
