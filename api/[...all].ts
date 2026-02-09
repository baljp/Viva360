// Vercel Serverless catch-all for Express backend.
// Handles every /api/* path in production.
//
// IMPORTANT:
// - Vercel runs this as ESM because the repo root has `"type": "module"`.
// - Node ESM does not resolve extensionless relative imports, and it can't load TS.
// - Import the compiled CJS backend artifact and unwrap `default`.
import appModule from '../backend/dist/app.js';

const app = (appModule as any)?.default ?? appModule;

export default app;
