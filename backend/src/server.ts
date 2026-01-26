
import cluster from 'cluster';
import os from 'os';
import app from './app';

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

  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Process terminated');
    });
  });

  // Prevent crash on unhandled errors
  process.on('uncaughtException', (err) => {
      console.error('🔥 UNCAUGHT EXCEPTION:', err);
  });

  process.on('unhandledRejection', (reason) => {
      console.error('🔥 UNHANDLED REJECTION:', reason);
  });
}
