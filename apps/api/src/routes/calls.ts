import { Router } from 'express';
import { asyncHandler } from '../lib/errors';
import * as attemptRepo from '../repos/attempts';
import { requireAuth } from '../middleware/auth';

export const callsRouter = Router();

callsRouter.use(requireAuth());

callsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const { attempts, nextCursor } = await attemptRepo.listAttemptsByUser({
      userId: req.user!.id,
      limit,
      cursor
    });

    res.json({
      attempts: attempts.map((a) => ({
        id: a.id,
        reminderId: a.reminderId,
        reminderMessage: a.reminder.message,
        destinationE164: a.reminder.phoneNumber?.e164 ?? null,
        status: a.status,
        startedAt: a.startedAt.toISOString(),
        endedAt: a.endedAt?.toISOString() ?? null,
        detail: a.detail
      })),
      nextCursor: nextCursor ?? null
    });
  })
);