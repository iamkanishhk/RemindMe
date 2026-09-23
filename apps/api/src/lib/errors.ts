import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodIssue } from 'zod';
import { logger } from './logger';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ZodIssue[];
  readonly isOperational: boolean;

  constructor(status: number, message: string, code?: string, details?: ZodIssue[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code ?? httpCodeName(status);
    this.details = details;
    this.isOperational = true;
  }
}

function httpCodeName(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    402: 'SUBSCRIPTION_REQUIRED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };
  return map[status] ?? 'ERROR';
}

export function badRequest(message: string, details?: ZodIssue[]): ApiError {
  return new ApiError(400, message, 'BAD_REQUEST', details);
}

export function unauthorized(message = 'Authentication required'): ApiError {
  return new ApiError(401, message, 'UNAUTHORIZED');
}

export function paymentRequired(message = 'Active subscription or free trial required'): ApiError {
  return new ApiError(402, message, 'SUBSCRIPTION_REQUIRED');
}

export function forbidden(message = 'Not allowed'): ApiError {
  return new ApiError(403, message, 'FORBIDDEN');
}

export function notFound(message = 'Not found'): ApiError {
  return new ApiError(404, message, 'NOT_FOUND');
}

export function conflict(message: string): ApiError {
  return new ApiError(409, message, 'CONFLICT');
}

export function unprocessable(message: string): ApiError {
  return new ApiError(422, message, 'UNPROCESSABLE_ENTITY');
}

export function rateLimited(message = 'Too many requests'): ApiError {
  return new ApiError(429, message, 'RATE_LIMITED');
}

export function serviceUnavailable(message: string): ApiError {
  return new ApiError(503, message, 'SERVICE_UNAVAILABLE');
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(422).json({ error: { code: 'VALIDATION', message: 'Validation failed', details: err.issues } });
    return;
  }
  logger.error({ err: err instanceof Error ? { message: err.message, stack: err.stack } : err, method: req.method, url: req.url }, 'unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}