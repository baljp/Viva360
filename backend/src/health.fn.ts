import './lib/env';
import { createBaseApiApp } from './lib/createBaseApiApp';
import { errorHandler } from './middleware/error.middleware';

const { app, config } = createBaseApiApp();

// Health Check (lightweight, safe JSON always)
app.get('/api/health', (req, res) => {
  const payload = {
    status: config.hasCriticalProdConfigIssues ? 'degraded' : 'ok',
    degraded: config.hasCriticalProdConfigIssues,
    configIssues: config.hasCriticalProdConfigIssues ? config.criticalProdConfigIssues : [],
    pid: process.pid,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };
  if (config.hasCriticalProdConfigIssues) return res.status(503).json(payload);
  return res.json(payload);
});

app.use('/api/*', (req, res) => {
  return res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId,
  });
});

app.use(errorHandler);

export default app;

