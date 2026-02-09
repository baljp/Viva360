"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTelemetry = exports.logSaturation = exports.sdk = void 0;
// Auto-detect serverless environment - skip heavy SDK in serverless
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
// Lightweight SDK wrapper for serverless environments
exports.sdk = {
    start: () => { },
    shutdown: async () => { },
};
// Excellence Metric: Resource Saturation tracking
const logSaturation = () => {
    const usage = process.memoryUsage();
    if (usage.heapUsed > usage.heapTotal * 0.8) {
        console.warn('⚠️ [SATURATION ALERT] Heap memory approaching threshold');
    }
};
exports.logSaturation = logSaturation;
const initTelemetry = () => {
    if (isServerless) {
        console.log('⚡ OpenTelemetry skipped in serverless mode');
        return;
    }
    // In non-serverless mode, we could load full SDK here
    // For now, keeping it lightweight for all environments
    console.log('📡 Telemetry initialized (lightweight mode)');
};
exports.initTelemetry = initTelemetry;
// Graceful shutdown - no-op in serverless
if (!isServerless) {
    process.on('SIGTERM', () => {
        console.log('Tracing terminated');
        process.exit(0);
    });
}
