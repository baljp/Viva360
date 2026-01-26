"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTelemetry = exports.sdk = void 0;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const api_1 = require("@opentelemetry/api");
// Debug logging (optional, good for dev)
api_1.diag.setLogger(new api_1.DiagConsoleLogger(), api_1.DiagLogLevel.INFO);
exports.sdk = new sdk_node_1.NodeSDK({
    traceExporter: new sdk_trace_node_1.ConsoleSpanExporter(), // Corrected usage
    instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()],
    serviceName: 'viva360-backend-enterprise'
});
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
