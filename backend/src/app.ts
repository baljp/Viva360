import './lib/env'; // Load ENV first
import express from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import rateLimit from 'express-rate-limit';
import { chaosMiddleware } from './lib/chaos';
import register, { httpRequestDurationMicroseconds, httpRequestErrors } from './lib/metrics';
import compression from 'compression';
import { initTelemetry } from './lib/instrumentation';
import { assertCriticalProdConfig } from './lib/runtimeGuard';
import { getAuthConfigHealthSnapshot } from './lib/authConfigHealth';

const isProductionRuntime = process.env.NODE_ENV === 'production';
const jsonBodyLimit = String(process.env.JSON_BODY_LIMIT || '256kb').trim() || '256kb';
const truthy = (value?: string) => String(value || '').trim().toLowerCase() === 'true';
const isDebugRoutesEnabled = !isProductionRuntime && (
    truthy(process.env.ENABLE_DEBUG_ROUTES) || truthy(process.env.ENABLE_TEST_MODE)
);
const blockedProdRoutePatterns = [
    /^\/api\/debug(?:\/|$|-)/i,
    /^\/api\/test(?:\/|$|-)/i,
    /^\/api\/mock(?:\/|$|-)/i,
];

// Initialize Telemetry
initTelemetry();
const criticalProdConfigIssues = assertCriticalProdConfig();
const hasCriticalProdConfigIssues = isProductionRuntime && criticalProdConfigIssues.length > 0;

// Load environment variables
// env already loaded via import './lib/env' at the top
import { securityHardening } from './middleware/security.middleware';
import { attachRequestContext } from './middleware/request.middleware';

const app = express();

// Compression (Gzip/Brotli)
app.use(compression());

// Middleware
// SEC-CSP: Content-Security-Policy active on API responses.
// Tightened for serverless (Vercel Functions) — no inline scripts needed on API.
// Frontend static CSP is handled separately via vercel.json headers.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'"],
      imgSrc:      ["'self'", "data:"],
      connectSrc:  ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
      fontSrc:     ["'self'"],
      objectSrc:   ["'none'"],
      frameSrc:    ["'none'"],
      baseUri:     ["'self'"],
      formAction:  ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: isProductionRuntime ? [] : undefined,
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Supabase realtime WebSocket
})); 
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) {
      return callback(null, process.env.NODE_ENV !== 'production');
    }
    return callback(null, allowedOrigins.includes(origin));
  },
  credentials: true,
};

app.use(cors(corsOptions)); 
app.use(express.json({ limit: jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));
app.use(attachRequestContext);
app.use(securityHardening); // Excellence Layer: WAF & Headers
if (!isProductionRuntime) app.use(morgan('tiny'));

// Observability Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? String(req.route.path) : (req.originalUrl || req.path);
        httpRequestDurationMicroseconds.labels(req.method, route, res.statusCode.toString()).observe(duration);
        
        if (res.statusCode >= 400) {
            httpRequestErrors.labels(req.method, route, res.statusCode.toString()).inc();
        }
    });
    next();
});

// Metrics Endpoint
app.get('/metrics', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        const token = (process.env.METRICS_TOKEN || '').trim();
        if (!token) {
            return res.status(503).json({ error: 'Metrics disabled' });
        }
        const auth = req.headers.authorization || '';
        if (auth !== `Bearer ${token}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

// RATE LIMITING (layered)
// - Global limiter here uses standard `RateLimit-*` headers for coarse abuse control.
// - Route-level limiter in `routes/index.ts` uses custom `X-RateLimit-*` headers for short-window API throttling.
// - `/api/health*` is exempt from the global limiter to keep probes deterministic.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => /^\/api\/health(?:\/|$)/i.test(String(req.path || req.originalUrl || '')),
});
app.use(limiter);

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

// CHAOS ENGINEERING
if (process.env.CHAOS_MODE === 'true') {
    app.use(chaosMiddleware);
}

// CIRCUIT BREAKER (Enterprise Resilience)
import { circuitBreaker } from './middleware/circuitBreaker';
app.use(circuitBreaker);

// Health Check
app.get('/api/health', (req, res) => {
    const payload = {
        status: hasCriticalProdConfigIssues ? 'degraded' : 'ok',
        degraded: hasCriticalProdConfigIssues,
        configIssues: hasCriticalProdConfigIssues ? criticalProdConfigIssues : [],
        pid: process.pid,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    if (hasCriticalProdConfigIssues) {
        return res.status(503).json(payload);
    }
    return res.json(payload);
});

app.get('/api/health/auth-config', (req, res) => {
    const snapshot = getAuthConfigHealthSnapshot();
    const payload = {
        ...snapshot,
        requestId: req.requestId,
    };
    if (!snapshot.ok) {
        return res.status(503).json(payload);
    }
    return res.json(payload);
});

// If production config is incomplete, keep API observable with controlled 503 responses.
app.use((req, res, next) => {
    if (!hasCriticalProdConfigIssues) return next();
    const pathname = String(req.path || req.originalUrl || '');
    if (!pathname.startsWith('/api')) return next();
    return res.status(503).json({
        error: 'Service temporarily unavailable: critical production configuration is incomplete.',
        code: 'CONFIG_DEGRADED',
        configIssues: criticalProdConfigIssues,
        requestId: req.requestId,
    });
});

if (isDebugRoutesEnabled) {
    // Diagnostic Login Endpoint (debug only)
    app.post('/api/debug-login', async (req, res) => {
        try {
            const { AuthService } = require('./services/auth.service');
            const result = await AuthService.login(req.body.email || '', req.body.password || '');
            res.json({ ok: true, result });
        } catch (err: any) {
            res.status(500).json({
                error: err.message,
                name: err.name,
                stack: err.stack?.split('\n').slice(0, 5),
                code: err.code,
                statusCode: err.statusCode,
            });
        }
    });

    // Network Diagnostic Endpoint (debug only)
    app.get('/api/debug-net', async (req, res) => {
        const dns = require('dns').promises;
        const net = require('net');
        const poolerUrl = process.env.SUPABASE_POOLER_URL || 'NOT_SET';
        const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
        const activeUrl = process.env.SUPABASE_POOLER_URL || process.env.DATABASE_URL || 'NOT_SET';

        const results: any = {
            active_url_masked: activeUrl.replace(/:[^:@]+@/, ':***@'),
            pooler_url_masked: poolerUrl.replace(/:[^:@]+@/, ':***@'),
            db_url_masked: dbUrl.replace(/:[^:@]+@/, ':***@'),
            dns: null,
            tcp: null,
            env_present: {
                SUPABASE_POOLER_URL: !!process.env.SUPABASE_POOLER_URL,
                DATABASE_URL: !!process.env.DATABASE_URL,
                DIRECT_URL: !!process.env.DIRECT_URL,
                SUPABASE_URL: !!process.env.SUPABASE_URL,
                JWT_SECRET: !!process.env.JWT_SECRET,
            }
        };
        try {
            const urlObj = new URL(activeUrl);
            const host = urlObj.hostname;
            const port = parseInt(urlObj.port || '5432');
            results.parsed = { host, port };
            try {
                const addresses = await dns.resolve(host);
                results.dns = { ok: true, addresses };
            } catch (e: any) {
                results.dns = { ok: false, error: e.message };
            }
            try {
                await new Promise<void>((resolve, reject) => {
                    const socket = new net.Socket();
                    socket.setTimeout(5000);
                    socket.on('connect', () => { socket.destroy(); resolve(); });
                    socket.on('timeout', () => { socket.destroy(); reject(new Error('TCP timeout (5s)')); });
                    socket.on('error', (e: any) => { reject(e); });
                    socket.connect(port, host);
                });
                results.tcp = { ok: true };
            } catch (e: any) {
                results.tcp = { ok: false, error: e.message };
            }
        } catch (e: any) {
            results.urlParseError = e.message;
        }
        res.json(results);
    });

    // Raw DB Diagnostic Endpoint (debug only)
    app.get('/api/debug-db', async (req, res) => {
        const prisma = require('./lib/prisma').default;
        const results: any = { connect: null, query: null };
        try {
            await prisma.$connect();
            results.connect = { ok: true };
        } catch (e: any) {
            results.connect = { ok: false, error: e.message, code: e.errorCode, meta: e.meta };
        }
        if (results.connect.ok) {
            try {
                const r = await prisma.$queryRaw`SELECT 1 as test`;
                results.query = { ok: true, result: r };
            } catch (e: any) {
                results.query = { ok: false, error: e.message };
            }
        }
        res.json(results);
    });
}

// API Routes
app.use('/api', routes);

// API 404s are explicit and machine-readable.
app.use('/api/*', (req, res) => {
    return res.status(404).json({
        error: 'Route not found',
        requestId: req.requestId,
    });
});

// Global Error Handler
import { errorHandler } from './middleware/error.middleware';
app.use(errorHandler);

export default app;

// Deployment Trigger: 2026-01-27T00:32:00
