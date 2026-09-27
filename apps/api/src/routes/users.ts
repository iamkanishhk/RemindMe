import { Router } from 'express';
import { asyncHandler } from '../lib/errors';
import * as userService from '../services/userService';
import { requireAuth } from '../middleware/auth';
import * as phoneRepo from '../repos/phoneNumbers';

export const usersRouter = Router();

usersRouter.use(requireAuth());

usersRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await userService.getOwnUser(req.user!.id);
    const phones = await phoneRepo.listPhonesForUser(user.id);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        phoneNumbers: phones.map((p) => ({ id: p.id, e164: p.e164, verified: p.verified })),
        counts: { phoneNumbers: user._count.phoneNumbers, reminders: user._count.reminders },
        onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString()
      }
    });
  })
);

usersRouter.post(
  '/me/onboarding-complete',
  asyncHandler(async (req, res) => {
    const user = await userService.completeOnboarding(req.user!.id);
    res.json({ onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null });
  })
);

usersRouter.delete(
  '/me',
  asyncHandler(async (req, res) => {
    await userService.deleteMe(req.user!.id);
    res.json({ deleted: true });
  })
);