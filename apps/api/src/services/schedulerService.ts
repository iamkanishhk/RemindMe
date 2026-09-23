import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import type { ReminderStatus } from '@prisma/client';

export const QUEUE_NAME = 'reminder-calls';

export async function enqueueReminder(reminder: { id: string; nextRunAt: Date | null; isEnabled: boolean; status: string }): Promise<void> {
  if (!reminder.isEnabled || !reminder.nextRunAt) return;
  if (reminder.status !== 'SCHEDULED' && reminder.status !== 'CALLING') return;
  logger.debug({ reminderId: reminder.id, nextRunAt: reminder.nextRunAt.toISOString() }, 'reminder scheduled (db-driven fire)');
}

export async function cancelJob(_reminderId: string, _nextRunAt: Date | null): Promise<void> {
  return;
}

export async function failStaleCallingReminders(graceMs: number): Promise<number> {
  const cutoff = new Date(Date.now() - graceMs);
  const stale = await prisma.reminder.findMany({
    where: {
      status: 'CALLING',
      lastCallAt: { lte: cutoff }
    }
  });
  let failed = 0;
  for (const r of stale) {
    await prisma.callAttempt.create({
      data: { reminderId: r.id, startedAt: r.lastCallAt ?? new Date(), endedAt: new Date(), status: 'FAILED', detail: 'stale-calling' }
    });
    await prisma.reminder.update({
      where: { id: r.id },
      data: { status: 'FAILED' as ReminderStatus }
    });
    failed += 1;
  }
  return failed;
}