import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Debug logging (optional, good for dev)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

export const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(), // Corrected usage
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'viva360-backend-enterprise'
});

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
