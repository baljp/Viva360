"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./lib/env"); // Load ENV first
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./routes"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const chaos_1 = require("./lib/chaos");
const metrics_1 = __importStar(require("./lib/metrics"));
const compression_1 = __importDefault(require("compression"));
const instrumentation_1 = require("./lib/instrumentation");
// Initialize Telemetry
(0, instrumentation_1.initTelemetry)();
// Load environment variables
// env already loaded via import './lib/env' at the top
const security_middleware_1 = require("./middleware/security.middleware");
const app = (0, express_1.default)();
// Compression (Gzip/Brotli)
app.use((0, compression_1.default)());
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // For easier dev, can be tightened
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(security_middleware_1.securityHardening); // Excellence Layer: WAF & Headers
if (process.env.NODE_ENV !== 'production')
    app.use((0, morgan_1.default)('tiny'));
// Observability Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;
        metrics_1.httpRequestDurationMicroseconds.labels(req.method, route, res.statusCode.toString()).observe(duration);
        if (res.statusCode >= 400) {
            metrics_1.httpRequestErrors.labels(req.method, route, res.statusCode.toString()).inc();
        }
    });
    next();
});
// Metrics Endpoint
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', metrics_1.default.contentType);
    res.send(await metrics_1.default.metrics());
});
// RATE LIMITING
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// CHAOS ENGINEERING
if (process.env.CHAOS_MODE === 'true') {
    app.use(chaos_1.chaosMiddleware);
}
// CIRCUIT BREAKER (Enterprise Resilience)
const circuitBreaker_1 = require("./middleware/circuitBreaker");
app.use(circuitBreaker_1.circuitBreaker);
// API Routes
app.use('/api', routes_1.default);
// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', pid: process.pid, timestamp: new Date().toISOString() });
});
// Global Error Handler
const error_middleware_1 = require("./middleware/error.middleware");
app.use(error_middleware_1.errorHandler);
exports.default = app;
// Deployment Trigger: 2026-01-27T00:32:00
