import './lib/env'; // Load ENV first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import rateLimit from 'express-rate-limit';
import { chaosMiddleware } from './lib/chaos';
import register, { httpRequestDurationMicroseconds, httpRequestErrors } from './lib/metrics';
import compression from 'compression';
import { initTelemetry } from './lib/instrumentation';

// Initialize Telemetry
initTelemetry();

// Load environment variables
// env already loaded via import './lib/env' at the top
import { securityHardening } from './middleware/security.middleware';

const app = express();

// Compression (Gzip/Brotli)
app.use(compression());

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // For easier dev, can be tightened
})); 
app.use(cors()); 
app.use(express.json());
app.use(securityHardening); // Excellence Layer: WAF & Headers
if (process.env.NODE_ENV !== 'production') app.use(morgan('tiny'));

// Observability Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;
        httpRequestDurationMicroseconds.labels(req.method, route, res.statusCode.toString()).observe(duration);
        
        if (res.statusCode >= 400) {
            httpRequestErrors.labels(req.method, route, res.statusCode.toString()).inc();
        }
    });
    next();
});

// Metrics Endpoint
app.get('/metrics', async (req, res) => {
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

// API Routes
app.use('/api', routes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', pid: process.pid, timestamp: new Date().toISOString() });
});

// Global Error Handler
import { errorHandler } from './middleware/error.middleware';
app.use(errorHandler);

export default app;

// Deployment Trigger: 2026-01-27T00:32:00
