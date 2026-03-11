import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import marketplaceRoutes from './routes/marketplace.routes';
import checkoutRoutes from './routes/checkout.routes';
import { chaosMiddleware } from './lib/chaos';
import { attachRawBody, buildCorsOptions as buildSharedCorsOptions, getApiHelmetOptions } from './lib/httpSecurity';
import register, { httpRequestDurationMicroseconds, httpRequestErrors } from './lib/metrics';
import { initTelemetry } from './lib/instrumentation';
import { authenticateUser } from './middleware/auth.middleware';
import { logger } from './lib/logger';

initTelemetry();
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;
const jsonBodyLimit = process.env.JSON_BODY_LIMIT || '2mb';

app.use(helmet(getApiHelmetOptions()));
app.use(cors(buildSharedCorsOptions()));
app.use(express.json({ limit: jsonBodyLimit, verify: attachRawBody }));
app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));

// Metrics
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
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

if (process.env.CHAOS_MODE === 'true') app.use(chaosMiddleware);

// Routes
app.use('/api/marketplace', authenticateUser, marketplaceRoutes);
app.use('/api/checkout', authenticateUser, checkoutRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'marketplace-service' });
});

app.listen(PORT, () => {
    logger.info('server_marketplace.listening', { port: PORT });
});
