"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (message, meta) => {
        console.log(JSON.stringify({ level: 'info', message, timestamp: new Date(), ...meta }));
    },
    error: (message, error) => {
        console.error(JSON.stringify({
            level: 'error',
            message,
            timestamp: new Date(),
            stack: error?.stack,
            ...error
        }));
    },
    warn: (message, meta) => {
        console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date(), ...meta }));
    },
    debug: (message, meta) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(JSON.stringify({ level: 'debug', message, timestamp: new Date(), ...meta }));
        }
    }
};
