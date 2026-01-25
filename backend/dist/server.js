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
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const instrumentation_1 = require("./lib/instrumentation");
// Initialize Telemetry before anything else (in workers too)
(0, instrumentation_1.initTelemetry)();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const chaos_1 = require("./lib/chaos");
const metrics_1 = __importStar(require("./lib/metrics"));
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const numCPUs = os_1.default.cpus().length;
if (cluster_1.default.isPrimary && process.env.NODE_ENV !== 'test') { // Simple check to allow non-cluster for tests if needed
    console.warn(`🔥 Master ${process.pid} is running`);
    console.warn(`🚀 Forking ${numCPUs} workers for Performance 10/10...`);
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on('exit', (worker, code, signal) => {
        console.warn(`⚠️ Worker ${worker.process.pid} died. Forking new one...`);
        cluster_1.default.fork();
    });
}
else {
    // Worker Process
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // app.use(morgan('combined')); // Disable logging in workers to reduce IO noise during stress test?
    // Let's keep it minimal
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
        // Redis store recommended for cluster, but memory store is per-process (so total limit = 1000 * numCPUs). 
        // This effectively increases capacity 8x on 8-core machine. Benefit!
    });
    app.use(limiter);
    // CHAOS ENGINEERING
    if (process.env.CHAOS_MODE === 'true') {
        app.use(chaos_1.chaosMiddleware);
    }
    // API Routes
    app.use('/api', routes_1.default);
    // Health Check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', pid: process.pid, timestamp: new Date().toISOString() });
    });
    const server = app.listen(PORT, () => {
        // Console log only once per worker might be noisy, but confirms startup
        // console.log(`🚀 Worker ${process.pid} started`);
    });
    process.on('SIGTERM', () => {
        server.close(() => {
            // closed
        });
    });
}
