import './lib/env';
import { createBaseApiApp } from './lib/createBaseApiApp';
import { authenticateUser } from './middleware/auth.middleware';
import checkoutRoutes from './routes/checkout.routes';
import { errorHandler } from './middleware/error.middleware';

const { app } = createBaseApiApp();

// Keep same behavior as routes/index.ts: authenticate.
app.use('/api/checkout', authenticateUser, checkoutRoutes);

app.use('/api/checkout/*', (req, res) => {
  return res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId,
  });
});

app.use(errorHandler);

export default app;

