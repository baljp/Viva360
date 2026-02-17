import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { logger } from './logger';

// Auto-detect serverless environment - skip heavy SDK in serverless
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);

// Lightweight SDK wrapper for serverless environments
export const sdk = {
  start: () => {},
  shutdown: async () => {},
};

// Excellence Metric: Resource Saturation tracking
export const logSaturation = () => {
    const usage = process.memoryUsage();
    if (usage.heapUsed > usage.heapTotal * 0.8) {
        logger.warn('saturation_alert', {
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
          rss: usage.rss,
        });
    }
};

export const initTelemetry = () => {
    if (isServerless) {
        logger.debug('telemetry_skipped_serverless');
        return;
    }
    
    // In non-serverless mode, we could load full SDK here
    // For now, keeping it lightweight for all environments
    logger.info('telemetry_initialized', { mode: 'lightweight' });
};

// Graceful shutdown - no-op in serverless
if (!isServerless) {
    process.on('SIGTERM', () => {
      logger.info('telemetry_sigterm');
      process.exit(0);
    });
}
