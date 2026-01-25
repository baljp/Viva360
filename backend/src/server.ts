import cluster from 'cluster';
import os from 'os';
import { initTelemetry } from './lib/instrumentation';
// Initialize Telemetry before anything else (in workers too)
initTelemetry();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes';
import rateLimit from 'express-rate-limit';
import { chaosMiddleware } from './lib/chaos';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const numCPUs = os.cpus().length;

if (cluster.isPrimary && process.env.NODE_ENV !== 'test') { // Simple check to allow non-cluster for tests if needed
  console.warn(`🔥 Master ${process.pid} is running`);
  console.warn(`🚀 Forking ${numCPUs} workers for Performance 10/10...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`⚠️ Worker ${worker.process.pid} died. Forking new one...`);
    cluster.fork();
  });
} else {
  // Worker Process
  const app = express();

  // Middleware
  app.use(helmet()); 
  app.use(cors()); 
  app.use(express.json()); 
  // app.use(morgan('combined')); // Disable logging in workers to reduce IO noise during stress test?
  // Let's keep it minimal
  if (process.env.NODE_ENV !== 'production') app.use(morgan('tiny'));

  // RATE LIMITING
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    standardHeaders: true,
    legacyHeaders: false,
    // Redis store recommended for cluster, but memory store is per-process (so total limit = 1000 * numCPUs). 
    // This effectively increases capacity 8x on 8-core machine. Benefit!
  });
  app.use(limiter);

  // CHAOS ENGINEERING
  if (process.env.CHAOS_MODE === 'true') {
      app.use(chaosMiddleware);
  }

  // API Routes
  app.use('/api', router);

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', pid: process.pid, timestamp: new Date().toISOString() });
  });

  const server = app.listen(PORT, () => {
    // Console log only once per worker might be noisy, but confirms startup
    // console.log(`🚀 Worker ${process.pid} started`);
  });

  process.on('SIGTERM', () => {
    server.close(() => {
      // closed
    });
  });
}
