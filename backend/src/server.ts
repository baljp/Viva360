import { initTelemetry } from './lib/instrumentation';

// Initialize Telemetry before anything else
initTelemetry();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import router from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('combined')); // Logging

// CHAOS ENGINEERING (Enabled via ENV)
import { chaosMiddleware } from './lib/chaos';
if (process.env.CHAOS_MODE === 'true') {
    app.use(chaosMiddleware);
    console.warn("⚠️  CHAOS MODE ENABLED: Expect random failures! ⚠️");
}

// API Routes
app.use('/api', router);

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
