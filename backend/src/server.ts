import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

// Routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import professionalsRoutes from './routes/professionals.routes';
import appointmentsRoutes from './routes/appointments.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import notificationsRoutes from './routes/notifications.routes';
import spacesRoutes from './routes/spaces.routes';
import searchRoutes from './routes/search.routes';
import healthRecordsRoutes from './routes/healthRecords.routes';
import soulPharmacyRoutes from './routes/soulPharmacy.routes';
import gamificationRoutes from './routes/gamification.routes';
import paymentsRoutes from './routes/payments.routes';
import ordersRoutes from './routes/orders.routes';
import reviewsRoutes from './routes/reviews.routes';
import swapsRoutes from './routes/swaps.routes';
import ritualsRoutes from './routes/rituals.routes';
import financeRoutes from './routes/finance.routes';
import roomsRoutes from './routes/rooms.routes';
import checkoutRoutes from './routes/checkout.routes';
import healthRoutes from './routes/health.routes';


// Middleware
import { errorHandler } from './middleware/error';
import { sanitizeBody } from './middleware/validation';
import { correlationIdMiddleware } from './middleware/correlation';

// WebSocket
import { initializeWebSocket } from './websocket';

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Initialize WebSocket
let io: any;
initializeWebSocket(httpServer).then(instance => {
  io = instance;
});

// Initialize Workers (Email, Notifications)
import { initWorkers } from './workers';
initWorkers();

// 1. Connectivity & Identity Middleware (Must be first)
app.use(correlationIdMiddleware);
app.disable('x-powered-by');

// Compression - gzip responses for better performance
app.use(compression());

// Security & Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Serve static files with CDN Cache Headers (Cloud Prep)
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../../dist'), {
  maxAge: '1d', // Cache for 1 day
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache'); // HTML always fresh
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Assets cached for CDN
    }
  }
}));

// CORS configuration - supports multiple origins for development and production
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting with Redis store for cluster-safe operation
import RedisStore from 'rate-limit-redis';
import { redis as redisClient } from './config/redis';

// Create Redis store for rate limiter (with fallback to memory)
const createRateLimitStore = () => {
  if (process.env.REDIS_URL) {
    return new RedisStore({
      // @ts-expect-error - ioredis is compatible
      sendCommand: (...args: string[]) => redisClient.call(...args),
    });
  }
  return undefined; // Falls back to memory store
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100000 : 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  store: createRateLimitStore(),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50000 : 10,
  message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
  store: createRateLimitStore(),
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// XSS Sanitization
app.use(sanitizeBody);

// Correlation ID Middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  (req as any).id = correlationId;
  res.setHeader('X-Correlation-ID', correlationId as string);
  next();
});

// Structured Logging (JSON)
import { logger } from './config/logger';

// Metrics Middleware (Prometheus)
import { metricsMiddleware } from './middleware/metrics';
app.use(metricsMiddleware);

app.use((req, res, next) => {
  if (process.env.STRESS_TEST === 'true') return next(); // Skip logs in stress test

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    
    const logInfo = {
        timestamp: new Date().toISOString(),
        correlationId: (req as any).id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 400) {
        logger.error(message, logInfo);
    } else {
        logger.info(message, logInfo);
    }
  });
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    websocket: io ? 'enabled' : 'disabled',
    version: '2.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/professionals', professionalsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/spaces', spacesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/health-records', healthRecordsRoutes);
app.use('/api/soul-pharmacy', soulPharmacyRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/swaps', swapsRoutes);
app.use('/api/rituals', ritualsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/checkout', checkoutRoutes);  // Batch checkout (10x performance)
app.use('/api/health', healthRoutes);       // Enhanced health + metrics


// Error Handler (must be last)
app.use(errorHandler);

// Start Server (using httpServer for WebSocket)
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary && (process.env.NODE_ENV === 'production' || process.env.ENABLE_CLUSTER === 'true')) {
  const numCPUs = os.cpus().length;
  console.log(`Primary ${process.pid} is running`);
  console.log(`Forking server for ${numCPUs} CPUs...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  httpServer.listen(PORT, () => {
    console.log(`\n✨ Servidor Viva360 Backend rodando! (Worker ${process.pid})`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 API disponível em: http://localhost:${PORT}/api`);
    console.log(`💬 WebSocket habilitado`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
  });
}

// Graceful shutdown
if (!cluster.isPrimary) {
  process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor graciosamente...');
    httpServer.close(() => {
      console.log('Servidor encerrado.');
      process.exit(0);
    });
  });
}

export { io };
export default app;

