import './lib/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import { attachRequestContext } from './middleware/request.middleware';

// Minimal App for Isolation Debugging
const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(attachRequestContext);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', minimal: true, time: new Date().toISOString() });
});

// Auth Routes (Critical Path)
// app.use('/api/auth', authRoutes);

// 404
app.use('*', (req, res) => res.status(404).json({ error: 'Not Found in Minimal Mode' }));

export default app;
