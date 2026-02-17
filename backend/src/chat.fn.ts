import './lib/env';
import { createBaseApiApp } from './lib/createBaseApiApp';
import { authenticateUser } from './middleware/auth.middleware';
import chatRoutes from './routes/chat.routes';
import { errorHandler } from './middleware/error.middleware';

const { app } = createBaseApiApp();

app.use('/api/chat', authenticateUser, chatRoutes);

app.use('/api/chat/*', (req, res) => {
  return res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId,
  });
});

app.use(errorHandler);

export default app;

