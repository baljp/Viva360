import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

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
        console.warn('⚠️ [SATURATION ALERT] Heap memory approaching threshold');
    }
};

export const initTelemetry = () => {
    if (isServerless) {
        console.log('⚡ OpenTelemetry skipped in serverless mode');
        return;
    }
    
    // In non-serverless mode, we could load full SDK here
    // For now, keeping it lightweight for all environments
    console.log('📡 Telemetry initialized (lightweight mode)');
};

// Graceful shutdown - no-op in serverless
if (!isServerless) {
    process.on('SIGTERM', () => {
      console.log('Tracing terminated');
      process.exit(0);
    });
}
