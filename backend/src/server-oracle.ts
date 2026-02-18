import express from 'express';
import cors from 'cors';
import { buildCorsOptions } from './lib/corsConfig';
import helmet from 'helmet';
import dotenv from 'dotenv';
import oracleRoutes from './routes/oracle.routes';
import { chaosMiddleware } from './lib/chaos';
import register, { httpRequestDurationMicroseconds, httpRequestErrors } from './lib/metrics';
import { initTelemetry } from './lib/instrumentation';
import { authenticateUser } from './middleware/auth.middleware';
import { logger } from './lib/logger';

initTelemetry();
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors(buildCorsOptions()));
app.use(express.json());

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
app.use('/api/oracle', authenticateUser, oracleRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'oracle-service' });
});

app.listen(PORT, () => {
    logger.info('server_oracle.listening', { port: PORT });
});
