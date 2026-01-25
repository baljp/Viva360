import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Default metrics (CPU, Memory, Event Loop)
client.collectDefaultMetrics({ register });

// HTTP Request Duration Histogram
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // Buckets for latency
  registers: [register]
});

// HTTP Request Error Counter
export const httpRequestErrors = new client.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export default register;
