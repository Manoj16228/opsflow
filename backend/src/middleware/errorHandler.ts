import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): Response {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload provided.',
        details: formattedErrors,
      },
    });
  }

  // Handle Typed App Errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[Operational Error 500] ${err.message}`, {
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
      });
    }

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Handle Prisma Known Errors (like unique constraint violation)
  if (err?.code === 'P2002') {
    const fields = err.meta?.target || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        message: `A record with this unique ${Array.isArray(fields) ? fields.join(', ') : fields} already exists.`,
      },
    });
  }

  if (err?.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'The requested record could not be found or has been deleted.',
      },
    });
  }

  // Unhandled / Unexpected Errors
  logger.error(`[Unhandled Exception] ${err.message || 'Unknown Error'}`, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        config.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please contact support.'
          : err.message || 'Internal server error',
    },
  });
}
