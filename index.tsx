// [DEPLOYMENT_HEARTBEAT]: 2026-01-28 14:55
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initMonitoring } from './lib/monitoring';
import './src/index.css'; // Global Design System

// Get environment safely
const getIsProd = () => {
  try {
    const env = (import.meta as any).env;
    return env ? env.PROD : false;
  } catch (e) {
    return false;
  }
};

// Registro do Service Worker para PWA (apenas em produção real processada por Vite)
if ('serviceWorker' in navigator && getIsProd()) {
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
