import express, { type Express } from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { securityHardening } from '../middleware/security.middleware';
import { attachRequestContext } from '../middleware/request.middleware';
import { circuitBreaker } from '../middleware/circuitBreaker';
import { assertCriticalProdConfig, enforceNoProdMockLeakage } from './runtimeGuard';
import { attachRawBody, buildCorsOptions, getApiHelmetOptions } from './httpSecurity';

const isProductionRuntime = process.env.NODE_ENV === 'production';
const jsonBodyLimit = String(process.env.JSON_BODY_LIMIT || '256kb').trim() || '256kb';

const blockedProdRoutePatterns = [
  /^\/api\/debug(?:\/|$|-)/i,
  /^\/api\/test(?:\/|$|-)/i,
  /^\/api\/mock(?:\/|$|-)/i,
];

export type BaseApiConfig = {
  isProductionRuntime: boolean;
  hasCriticalProdConfigIssues: boolean;
  criticalProdConfigIssues: string[];
};

export const createBaseApiApp = (): { app: Express; config: BaseApiConfig } => {
  enforceNoProdMockLeakage();
  const criticalProdConfigIssues = assertCriticalProdConfig();
  const hasCriticalProdConfigIssues = isProductionRuntime && criticalProdConfigIssues.length > 0;

  const app = express();

  app.use(compression());
  app.use(helmet(getApiHelmetOptions()));

  const corsOptions: CorsOptions = buildCorsOptions();

  app.use(cors(corsOptions));
  app.use(express.json({ limit: jsonBodyLimit, verify: attachRawBody }));
  app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));
  app.use(attachRequestContext);
  app.use(securityHardening);
  if (!isProductionRuntime) app.use(morgan('tiny'));

  // Layered strategy matches `app.ts`:
  // global coarse limiter (`RateLimit-*`) + route-level short-window limiter (`X-RateLimit-*`).
  // `/api/health*` stays exempt to avoid noisy probe failures.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => /^\/api\/health(?:\/|$)/i.test(String(req.path || req.originalUrl || '')),
    }),
  );

  // Production hardening: block test/debug/mock surface explicitly.
  app.use((req, res, next) => {
    if (!isProductionRuntime) return next();
    const pathname = String(req.path || req.originalUrl || '');
    if (blockedProdRoutePatterns.some((pattern) => pattern.test(pathname))) {
      return res.status(404).json({
        error: 'Route not found',
        requestId: req.requestId,
      });
    }
    return next();
  });

  // Circuit breaker (resilience)
  app.use(circuitBreaker);

  // If production config is incomplete, keep API observable with controlled 503 responses.
  app.use((req, res, next) => {
    if (!hasCriticalProdConfigIssues) return next();
    const pathname = String(req.path || req.originalUrl || '');
    if (!pathname.startsWith('/api')) return next();
    if (/^\/api\/health(?:\/|$)/i.test(pathname)) return next();
    return res.status(503).json({
      error: 'Service temporarily unavailable: critical production configuration is incomplete.',
      code: 'CONFIG_DEGRADED',
      configIssues: criticalProdConfigIssues,
      requestId: req.requestId,
    });
  });

  return {
    app,
    config: {
      isProductionRuntime,
      hasCriticalProdConfigIssues,
      criticalProdConfigIssues,
    },
  };
};
