import { Router } from 'express';
import { reminderActionSchema, reminderPatchSchema, listRemindersQuerySchema } from '../lib/validators';
import { asyncHandler, notFound } from '../lib/errors';
import * as reminderService from '../services/reminderService';
import { requireAuth } from '../middleware/auth';
import * as reminderRepo from '../repos/reminders';
import * as attemptRepo from '../repos/attempts';

export const remindersRouter = Router();

remindersRouter.use(requireAuth());

remindersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listRemindersQuerySchema.parse(req.query);
    const reminders = await reminderService.listReminders(req.user!.id, query);
    res.json({ reminders });
  })
);

remindersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = reminderActionSchema.parse(req.body);
    const created = await reminderService.createReminder(req.user!.id, body);
    res.status(201).json({ reminder: created });
  })
);

remindersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const reminder = await reminderService.getReminder(req.user!.id, id);
    res.json({ reminder });
  })
);

remindersRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const body = reminderPatchSchema.parse(req.body);
    const reminder = await reminderService.updateReminder(req.user!.id, id, body);
    res.json({ reminder });
  })
);

remindersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const result = await reminderService.deleteReminder(req.user!.id, id);
    res.json(result);
  })
);

remindersRouter.get(
  '/:id/attempts',
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const reminder = await reminderRepo.findReminderOwned(req.user!.id, id);
    if (!reminder) throw notFound('Reminder not found');
    const attempts = await attemptRepo.listAttemptsByReminder(reminder.id);
    res.json({
      attempts: attempts.map((a) => ({
        id: a.id,
        status: a.status,
        startedAt: a.startedAt.toISOString(),
        endedAt: a.endedAt?.toISOString() ?? null,
        detail: a.detail
      }))
    });
  })
);