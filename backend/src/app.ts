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
initTelemetry();
assertCriticalProdConfig();

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
