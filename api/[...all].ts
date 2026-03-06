// Vercel Serverless catch-all for Express backend.
// Handles every /api/* path in production.
//
// IMPORTANT:
// - Vercel runs this as ESM because the repo root has `"type": "module"`.
// - Node ESM does not resolve extensionless relative imports, and it can't load TS.
// - Import the compiled CJS backend artifact and unwrap `default`.
// - dist/app.js only exists after `npm run build:backend` in CI/Vercel.
// @ts-ignore — dist is generated at build time; not available during local type-check
import appModule from '../backend/dist/app.js';

type AppModuleShape = { default?: unknown };
const app = (appModule as AppModuleShape).default ?? appModule;

export default app;
