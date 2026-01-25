"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpRequestErrors = exports.httpRequestDurationMicroseconds = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
// Create a Registry
const register = new prom_client_1.default.Registry();
// Default metrics (CPU, Memory, Event Loop)
prom_client_1.default.collectDefaultMetrics({ register });
// HTTP Request Duration Histogram
exports.httpRequestDurationMicroseconds = new prom_client_1.default.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // Buckets for latency
    registers: [register]
});
// HTTP Request Error Counter
exports.httpRequestErrors = new prom_client_1.default.Counter({
    name: 'http_request_errors_total',
    help: 'Total number of HTTP errors',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});
exports.default = register;
