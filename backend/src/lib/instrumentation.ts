import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Debug logging (optional, good for dev)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Use OTLP if endpoint is provided, fallback to Console
const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  ? new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      headers: JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS || '{}'),
    })
  : new ConsoleSpanExporter();

export const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'viva360-backend-enterprise'
});

// Excellence Metric: Resource Saturation tracking
export const logSaturation = () => {
    const usage = process.memoryUsage();
    if (usage.heapUsed > usage.heapTotal * 0.8) {
        console.warn('⚠️ [SATURATION ALERT] Heap memory approaching threshold');
    }
};

export const initTelemetry = () => {
    try {
        sdk.start();
        console.log('📡 OpenTelemetry initialized');
    } catch (error) {
        console.error('Error initializing OpenTelemetry:', error);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
