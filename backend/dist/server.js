"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 3000;
const numCPUs = os_1.default.cpus().length;
if (cluster_1.default.isPrimary && process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') {
    console.warn(`🔥 Master ${process.pid} is running`);
    console.warn(`🚀 Forking ${numCPUs} workers for Performance 10/10...`);
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on('exit', (worker) => {
        console.warn(`⚠️ Worker ${worker.process.pid} died. Forking new one...`);
        cluster_1.default.fork();
    });
}
else {
    // Worker Process or Direct Process
    const server = app_1.default.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} (PID: ${process.pid})`);
    });
    process.on('SIGTERM', () => {
        server.close(() => {
            console.log('Process terminated');
        });
    });
    // Prevent crash on unhandled errors
    process.on('uncaughtException', (err) => {
        console.error('🔥 UNCAUGHT EXCEPTION:', err);
    });
    process.on('unhandledRejection', (reason) => {
        console.error('🔥 UNHANDLED REJECTION:', reason);
    });
}
