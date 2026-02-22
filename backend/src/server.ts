import './lib/env'; // Load ENV first
import cluster from 'cluster';
import os from 'os';
import app from './app';
import { logger } from './lib/logger';

// IMPORTANT: Node treats a string "3001" as a pipe name, not a TCP port.
// Normalize numeric ports to a number to avoid `listen EPERM` in sandboxed envs.
const rawPort = (process.env.PORT || '').trim();
const PORT: number | string = rawPort
  ? (/^\d+$/.test(rawPort) ? Number(rawPort) : rawPort)
  : 3000;
const HOST = (process.env.HOST || process.env.BIND_HOST || '').trim() || null;
const numCPUs = os.cpus().length;

if (cluster.isPrimary && process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') {
  logger.warn('server.cluster_primary', { pid: process.pid, numCPUs });

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    logger.warn('server.cluster_worker_exit', { pid: worker.process.pid });
    cluster.fork();
  });
} else {
  // Worker Process or Direct Process
  const server = HOST
    ? app.listen(Number(PORT), HOST, () => {
      logger.info('server.listening', { port: PORT, host: HOST, pid: process.pid });
    })
    : app.listen(PORT, () => {
      logger.info('server.listening', { port: PORT, pid: process.pid });
    });

  process.on('SIGTERM', () => {
    server.close(() => {
      logger.info('server.sigterm');
    });
  });

  // Prevent crash on unhandled errors
  process.on('uncaughtException', (err) => {
    logger.error('🔥 UNCAUGHT EXCEPTION:', err);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('🔥 UNHANDLED REJECTION:', reason);
  });
}
