"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTelemetry = exports.logSaturation = exports.sdk = void 0;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const api_1 = require("@opentelemetry/api");
// Debug logging (optional, good for dev)
api_1.diag.setLogger(new api_1.DiagConsoleLogger(), api_1.DiagLogLevel.INFO);
// Use OTLP if endpoint is provided, fallback to Console
const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? new exporter_trace_otlp_http_1.OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        headers: JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS || '{}'),
    })
    : new sdk_trace_node_1.ConsoleSpanExporter();
exports.sdk = new sdk_node_1.NodeSDK({
    traceExporter,
    instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()],
    serviceName: 'viva360-backend-enterprise'
});
// Excellence Metric: Resource Saturation tracking
const logSaturation = () => {
    const usage = process.memoryUsage();
    if (usage.heapUsed > usage.heapTotal * 0.8) {
        console.warn('⚠️ [SATURATION ALERT] Heap memory approaching threshold');
    }
};
exports.logSaturation = logSaturation;
const initTelemetry = () => {
    try {
        exports.sdk.start();
        console.log('📡 OpenTelemetry initialized');
    }
    catch (error) {
        console.error('Error initializing OpenTelemetry:', error);
    }
};
exports.initTelemetry = initTelemetry;
// Graceful shutdown
process.on('SIGTERM', () => {
    exports.sdk.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => process.exit(0));
});
