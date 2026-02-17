import './lib/env';
import { createBaseApiApp } from './lib/createBaseApiApp';
import { authenticateUser } from './middleware/auth.middleware';
import { swrMiddleware } from './middleware/swr.middleware';
import tribeRoutes from './routes/tribe.routes';
import { errorHandler } from './middleware/error.middleware';

const { app } = createBaseApiApp();

// Keep same behavior as routes/index.ts: authenticate + SWR caching.
app.use('/api/tribe', authenticateUser, swrMiddleware(1, 59), tribeRoutes);

app.use('/api/tribe/*', (req, res) => {
  return res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId,
  });
});

app.use(errorHandler);

export default app;

