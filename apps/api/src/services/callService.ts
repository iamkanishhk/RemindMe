import { DateTime } from 'luxon';
import { env } from '../config';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { RateLimiter } from '../lib/ratelimit';
import { LIMITS } from '../lib/limits';
import type { ReminderStatus } from '@prisma/client';
import * as attemptRepo from '../repos/attempts';
import { telnyxProvider } from '../telephony/telnyx';
import type { TelephonyEvent } from '../telephony/types';
import { nextOccurrence } from '../lib/schedule';
import { enqueueReminder } from './schedulerService';
import { isEntitled, recordTrialCall } from './billingService';

const TERMINAL: ReminderStatus[] = ['COMPLETED', 'NO_ANSWER', 'BUSY', 'FAILED', 'CANCELED'];

export async function fireReminder(reminderId: string, nextRunIso: string): Promise<{ outcome: string; providerCallId?: string }> {
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    include: { phoneNumber: true }
  });
  if (!reminder || !reminder.phoneNumber) return { outcome: 'missing-phone' };
  if (!reminder.isEnabled || reminder.status === 'CANCELED') return { outcome: 'skipped' };
  if (reminder.nextRunAt?.toISOString() !== nextRunIso) return { outcome: 'stale-job' };
  if (reminder.status === 'CALLING') return { outcome: 'already-calling' };

  return performCall(reminderId, nextRunIso);
}

export async function fireClaimedReminder(reminderId: string, nextRunIso: string): Promise<{ outcome: string; providerCallId?: string }> {
  return performCall(reminderId, nextRunIso);
}

const FIRE_STALE_WINDOW_MS = 15 * 60 * 1000;

export async function fireDueReminders(now = new Date()): Promise<number> {
  const due = await prisma.reminder.findMany({
    where: {
      isEnabled: true,
      status: 'SCHEDULED',
      nextRunAt: { lte: now, gte: new Date(now.getTime() - FIRE_STALE_WINDOW_MS) }
    },
    select: { id: true, nextRunAt: true, userId: true, isFreeCall: true }
  });

  let fired = 0;
  for (const r of due) {
    if (!r.nextRunAt) continue;
    if (!(await isEntitled(r.userId)) && !r.isFreeCall) {
      logger.info({ reminderId: r.id, userId: r.userId }, 'reminder skipped at fire time: no active subscription or trial');
      continue;
    }
    const nextRunIso = r.nextRunAt.toISOString();
    const claimed = await prisma.reminder.updateMany({
      where: { id: r.id, isEnabled: true, status: 'SCHEDULED', nextRunAt: r.nextRunAt },
      data: { status: 'CALLING', lastCallAt: now }
    });
    if (claimed.count !== 1) continue;
    try {
      const result = await fireClaimedReminder(r.id, nextRunIso);
      fired += 1;
      logger.info({ reminderId: r.id, outcome: result.outcome }, 'db-driven reminder fired');
    } catch (err) {
      logger.warn({ err: err instanceof Error ? err.message : String(err), reminderId: r.id }, 'db-driven fire failed');
    }
  }
  return fired;
}

async function performCall(reminderId: string, nextRunIso: string): Promise<{ outcome: string; providerCallId?: string }> {
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    include: { phoneNumber: true }
  });
  if (!reminder || !reminder.phoneNumber) return { outcome: 'missing-phone' };
  if (!reminder.isEnabled || reminder.status === 'CANCELED') return { outcome: 'skipped' };
  if (reminder.nextRunAt?.toISOString() !== nextRunIso) return { outcome: 'stale-job' };

  if (!(await isEntitled(reminder.userId)) && !reminder.isFreeCall) {
    logger.info({ reminderId, userId: reminder.userId }, 'call skipped at perform time: no active subscription or trial');
    return { outcome: 'no-subscription' };
  }

  if (!(await withinCallLimits(reminder))) {
    logger.warn({ reminderId }, 'rate limit breached at fire time; failing call');
    const startedAt = new Date();
    await prisma.callAttempt.create({
      data: { reminderId, startedAt, endedAt: new Date(), status: 'FAILED', detail: 'rate-limited' }
    });
    await finishReminder(reminderId, 'FAILED');
    return { outcome: 'rate-limited' };
  }

  const startedAt = new Date();
  await prisma.reminder.update({ where: { id: reminderId }, data: { status: 'CALLING', lastCallAt: startedAt } });
  const attempt = await attemptRepo.createCallAttempt({ reminderId, startedAt });

  try {
    const webhookUrl = `${env.API_BASE_URL}/api/calls/webhook`;
    const placed = await telnyxProvider.placeCall({
      to: reminder.phoneNumber.e164,
      from: env.TELNYX_FROM_NUMBER,
      message: reminder.message,
      reminderId,
      webhookUrl
    });
    await prisma.callAttempt.update({ where: { id: attempt.id }, data: { providerCallId: placed.providerCallId } });
    await recordTrialCall(reminder.userId);
    return { outcome: 'placed', providerCallId: placed.providerCallId };
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err), reminderId }, 'telnyx place call failed');
    await attemptRepo.setAttemptStatus(attempt.id, 'FAILED', { endedAt: new Date(), detail: err instanceof Error ? err.message : String(err) });
    await finishReminder(reminderId, 'FAILED');
    return { outcome: 'failed' };
  }
}

async function withinCallLimits(reminder: { userId: string; phoneNumberId: string | null }): Promise<boolean> {
  const rl = new RateLimiter(3600, 100);
  const destinationE164 = reminder.phoneNumberId
    ? ((await prisma.phoneNumber.findUnique({ where: { id: reminder.phoneNumberId } }))?.e164 ?? 'unknown')
    : 'unknown';
  const checks = [
    rl.check(`user:${reminder.userId}:call`, LIMITS.callsPerUserHour.limit, LIMITS.callsPerUserHour.windowSeconds),
    rl.check(`user:${reminder.userId}:call`, LIMITS.callsPerUserDay.limit, LIMITS.callsPerUserDay.windowSeconds),
    rl.check(`dest:${destinationE164}:call`, LIMITS.callsPerDestinationHour.limit, LIMITS.callsPerDestinationHour.windowSeconds),
    rl.check(`dest:${destinationE164}:call`, LIMITS.callsPerDestinationDay.limit, LIMITS.callsPerDestinationDay.windowSeconds)
  ];
  const results = await Promise.all(checks);
  return results.every((r) => r.allowed);
}

export async function handleTelnyxEvent(evt: TelephonyEvent): Promise<void> {
  const payload = evt.payload as Record<string, unknown>;
  const callControlId = typeof payload.call_control_id === 'string' ? payload.call_control_id : undefined;
  if (!callControlId) {
    logger.warn({ event: evt.eventType }, 'telnyx event without call_control_id');
    return;
  }

  const attempt = await attemptRepo.findByProviderCallId(callControlId);
  if (!attempt) {
    logger.debug({ event: evt.eventType }, 'no attempt for provider call; ignoring');
    return;
  }
  if (attempt.status && TERMINAL.includes(attempt.status)) return;

  const evtType = evt.eventType;
  const occurredAt = evt.occurredAt ? new Date(evt.occurredAt) : new Date();

  switch (evtType) {
    case 'call.answered': {
      await attemptRepo.setAttemptStatus(attempt.id, 'ANSWERED');
      await prisma.reminder.update({ where: { id: attempt.reminderId }, data: { status: 'ANSWERED' } });
      const reminder = await prisma.reminder.findUnique({ where: { id: attempt.reminderId } });
      if (reminder) {
        fireAndForget(() => telnyxProvider.speak(callControlId, reminder.message));
      }
      break;
    }
    case 'call.speak.ended':
      fireAndForget(() => telnyxProvider.hangup(callControlId));
      break;
    case 'call.busy':
      await finalize(attempt.id, attempt.reminderId, 'BUSY', occurredAt, 'busy');
      break;
    case 'call.missed':
      await finalize(attempt.id, attempt.reminderId, 'NO_ANSWER', occurredAt, 'no-answer');
      break;
    case 'call.failed':
      await finalize(attempt.id, attempt.reminderId, 'FAILED', occurredAt, String(payload.reason ?? 'call failed'));
      break;
    case 'call.hangup':
      await handleHangup(attempt.id, attempt.reminderId, payload, occurredAt);
      break;
    default:
      break;
  }
}

function fireAndForget(fn: () => Promise<unknown>): void {
  void fn().catch((err) => logger.error({ err: err instanceof Error ? err.message : String(err) }, 'telephony action failed'));
}

async function handleHangup(
  attemptId: string,
  reminderId: string,
  payload: Record<string, unknown>,
  occurredAt: Date
): Promise<void> {
  const current = await prisma.callAttempt.findUnique({ where: { id: attemptId } });
  const hangupCause = typeof payload.hangup_cause === 'string' ? payload.hangup_cause : '';
  const endTime = typeof payload.end_time === 'string' && payload.end_time ? new Date(payload.end_time) : occurredAt;

  if (current?.status === 'ANSWERED') {
    await finalize(attemptId, reminderId, 'COMPLETED', endTime, undefined);
  } else if (hangupCause.includes('busy')) {
    await finalize(attemptId, reminderId, 'BUSY', endTime, `hangup_cause=${hangupCause}`);
  } else {
    await finalize(attemptId, reminderId, 'NO_ANSWER', endTime, `hangup_cause=${hangupCause}`);
  }
}

async function finalize(
  attemptId: string,
  reminderId: string,
  status: ReminderStatus,
  endedAt: Date,
  detail: string | undefined
): Promise<void> {
  await attemptRepo.setAttemptStatus(attemptId, status, { endedAt, ...(detail ? { detail } : {}) });

  const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } });
  if (!reminder) return;

  if (status === 'ANSWERED') {
    await prisma.reminder.update({ where: { id: reminderId }, data: { status: 'ANSWERED' } });
    return;
  }

  if (reminder.repeatRule && reminder.repeatRule !== 'NONE') {
    const after = new Date();
    const next = nextOccurrence({
      runAtUtc: DateTime.fromJSDate(reminder.scheduledAt),
      timezone: reminder.timezone,
      repeatRule: reminder.repeatRule,
      after: DateTime.fromJSDate(after)
    });
    if (next) {
      const nextDate = new Date(next);
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { nextRunAt: nextDate, status: 'SCHEDULED' }
      });
      await enqueueReminder({
        id: reminderId,
        nextRunAt: nextDate,
        isEnabled: reminder.isEnabled,
        status: 'SCHEDULED'
      });
      return;
    }
  }

  await finishReminder(reminderId, status);
}

async function finishReminder(reminderId: string, status: ReminderStatus): Promise<void> {
  await prisma.reminder.update({ where: { id: reminderId }, data: { status } });
}