import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  config.NODE_ENV === 'production'
    ? winston.format.json()
    : winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}]: ${stack || message}${metaStr}`;
      })
);

export const logger = winston.createLogger({
  level: config.LOG_LEVEL || (config.NODE_ENV === 'development' ? 'debug' : 'info'),
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: config.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), logFormat),
    }),
  ],
});
