"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const AppError_1 = require("../lib/AppError");
const logger_1 = require("../lib/logger");
const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError_1.AppError && err.isOperational) {
        logger_1.logger.warn(`Operational Error: ${err.message}`, { statusCode: err.statusCode });
        return res.status(err.statusCode).json({ error: err.message });
    }
    if (err instanceof zod_1.z.ZodError) {
        logger_1.logger.warn('Validation Error', { errors: err.errors });
        return res.status(400).json({ error: 'Validation Error', details: err.errors });
    }
    logger_1.logger.error('Unhandled Error', err);
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
    res.status(statusCode).json({
        error: message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};
exports.errorHandler = errorHandler;
