import './lib/env';
import { createBaseApiApp } from './lib/createBaseApiApp';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware';

const { app } = createBaseApiApp();

app.use('/api/auth', authRoutes);

app.use('/api/auth/*', (req, res) => {
  return res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId,
  });
});

app.use(errorHandler);

export default app;

