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

// Initialize Telemetry
// initTelemetry();
// assertCriticalProdConfig();

// Load environment variables
// env already loaded via import './lib/env' at the top
import { securityHardening } from './middleware/security.middleware';
import { attachRequestContext } from './middleware/request.middleware';

const app = express();

// Compression (Gzip/Brotli)
app.use(compression());

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // For easier dev, can be tightened
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
app.use(express.json());
app.use(attachRequestContext);
app.use(securityHardening); // Excellence Layer: WAF & Headers
if (process.env.NODE_ENV !== 'production') app.use(morgan('tiny'));

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

// RATE LIMITING
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// CHAOS ENGINEERING
if (process.env.CHAOS_MODE === 'true') {
    app.use(chaosMiddleware);
}

// CIRCUIT BREAKER (Enterprise Resilience)
import { circuitBreaker } from './middleware/circuitBreaker';
app.use(circuitBreaker);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', pid: process.pid, timestamp: new Date().toISOString(), requestId: req.requestId });
});

// Diagnostic Login Endpoint (temporary)
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

// Network Diagnostic Endpoint (temporary)
app.get('/api/debug-net', async (req, res) => {
    const dns = require('dns').promises;
    const net = require('net');
    const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
    const results: any = {
        DATABASE_URL_masked: dbUrl.replace(/:[^:@]+@/, ':***@'),
        dns: null,
        tcp: null,
        env_present: {
            DATABASE_URL: !!process.env.DATABASE_URL,
            DIRECT_URL: !!process.env.DIRECT_URL,
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            JWT_SECRET: !!process.env.JWT_SECRET,
        }
    };
    // Extract host and port from DATABASE_URL
    try {
        const urlObj = new URL(dbUrl);
        const host = urlObj.hostname;
        const port = parseInt(urlObj.port || '5432');
        results.parsed = { host, port };
        // DNS lookup
        try {
            const addresses = await dns.resolve(host);
            results.dns = { ok: true, addresses };
        } catch (e: any) {
            results.dns = { ok: false, error: e.message };
        }
        // TCP connect test
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

// Raw DB Diagnostic Endpoint (temporary)
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
