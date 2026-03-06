#!/usr/bin/env node

const isProdBuild = String(process.env.NODE_ENV || '').trim() === 'production';
const dsn = String(process.env.VITE_SENTRY_DSN || '').trim();

if (isProdBuild && !dsn) {
  console.error('Missing VITE_SENTRY_DSN for production build.');
  process.exit(1);
}
