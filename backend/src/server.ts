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


// Middleware
import { errorHandler } from './middleware/error';
import { sanitizeBody } from './middleware/validation';

// WebSocket
import { initializeWebSocket } from './websocket';

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Initialize WebSocket
const io = initializeWebSocket(httpServer);

// Compression - gzip responses for better performance
app.use(compression());

// Security & Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting - more lenient for development
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 100, // Higher limit for dev/testing
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10, // Higher limit for dev/testing
  message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// XSS Sanitization
app.use(sanitizeBody);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

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


// Error Handler (must be last)
app.use(errorHandler);

// Start Server (using httpServer for WebSocket)
httpServer.listen(PORT, () => {
  console.log(`\n✨ Servidor Viva360 Backend rodando!`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 API disponível em: http://localhost:${PORT}/api`);
  console.log(`💬 WebSocket habilitado`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor graciosamente...');
  httpServer.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});

export { io };
export default app;

