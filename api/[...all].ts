// Vercel Serverless catch-all for Express backend.
// Handles every /api/* path in production.
import '../backend/src/lib/env';
import app from '../backend/src/app';

export default app;
