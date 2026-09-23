import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getAuth } from '@clerk/express';
import { unauthorized } from '../lib/errors';
import { ensureUserByClerkId } from '../services/userService';

export function requireAuth(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId;
    if (!clerkUserId) {
      next(unauthorized());
      return;
    }
    try {
      req.user = await ensureUserByClerkId(clerkUserId);
      next();
    } catch (err) {
      next(err);
    }
  };
}

