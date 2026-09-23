import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      { method: req.method, path: req.originalUrl, status: res.statusCode, ms: Date.now() - start, ip: req.ip },
      'http'
    );
  });
  next();
}