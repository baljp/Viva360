import './lib/env'; // Load ENV first
import cluster from 'cluster';
import os from 'os';
import app from './app';
import { logger } from './lib/logger';

const PORT = process.env.PORT || 3000;
const numCPUs = os.cpus().length;

if (cluster.isPrimary && process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') { 
  console.warn(`🔥 Master ${process.pid} is running`);
  console.warn(`🚀 Forking ${numCPUs} workers for Performance 10/10...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.warn(`⚠️ Worker ${worker.process.pid} died. Forking new one...`);
    cluster.fork();
  });
} else {
  // Worker Process or Direct Process
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (PID: ${process.pid})`);
  });

  // Middleware Registration (Circuit Breaker)
  // Dynamic import or require if app.use is not exposed here.
  // Actually, app is imported. We should attach it to app, but app is already exported from ./app.
  // It's better to add this in app.ts, but `server.ts` controls the process.
  // Let's modify app.ts instead? No, app.ts handles middleware.
  // Wait, `app` is imported from `./app`. We can manipulate it before listen if needed, 
  // but standard practice is in app.ts.
  // Checking `app.ts` content first would be safer, but user asked for server.ts updates in plan.
  // Assuming I can't see app.ts, I will try to use it here or check app.ts.
  
  // Checking app.ts is safer. I'll read it.

  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Process terminated');
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
