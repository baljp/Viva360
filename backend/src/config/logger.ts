
import winston from 'winston';
import { getCorrelationId } from '../middleware/correlation';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    const correlationId = getCorrelationId();
    const cidStr = correlationId ? `[${correlationId}] ` : '';
    return `${timestamp} ${level}: ${cidStr}${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
});

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  logFormat
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

const transports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? jsonFormat : format,
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: jsonFormat,
  }),
  new winston.transports.File({ filename: 'logs/all.log', format: jsonFormat }),
];

export const logger = winston.createLogger({
  level: level(),
  levels,
  defaultMeta: { service: 'viva360-backend' },
  transports,
});
