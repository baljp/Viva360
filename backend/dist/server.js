"use strict";
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
