import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import ritualsRoutes from './routes/rituals.routes';
import metamorphosisRoutes from './routes/metamorphosis.routes';
import { chaosMiddleware } from './lib/chaos';
import register, { httpRequestDurationMicroseconds, httpRequestErrors } from './lib/metrics';
import { initTelemetry } from './lib/instrumentation';
import { authenticateUser } from './middleware/auth.middleware';

initTelemetry();
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
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
app.use('/api/rituals', authenticateUser, ritualsRoutes);
app.use('/api/metamorphosis', authenticateUser, metamorphosisRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ritual-service' });
});

app.listen(PORT, () => {
    console.log(`🚀 Ritual Service running on port ${PORT}`);
});
