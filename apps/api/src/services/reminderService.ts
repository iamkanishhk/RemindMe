import { DateTime, IANAZone } from 'luxon';
import type { ReminderStatus, RepeatRule } from '@prisma/client';
import { badRequest, notFound, unprocessable } from '../lib/errors';
import * as reminderRepo from '../repos/reminders';
import * as phoneRepo from '../repos/phoneNumbers';
import { computeNextRun } from '../lib/schedule';
import { enqueueReminder, cancelJob } from './schedulerService';
import { assertEntitled, assertReminderCreateAllowed } from './billingService';

export interface ReminderInput {
  title: string;
  message: string;
  timezone: string;
  localDateTime: string;
  repeatRule: RepeatRule;
  phoneNumberId: string;
}

function isoToDate(iso: string): Date {
  return new Date(iso);
}

async function assertCallablePhone(userId: string, phoneNumberId: string) {
  const phone = await phoneRepo.findPhoneOwned(userId, phoneNumberId);
  if (!phone) throw notFound('Phone number not found');
  if (!phone.verified) throw unprocessable('Phone number must be verified before scheduling reminders');
  return phone;
}

function wallClockFor(existing: { scheduledAt: Date; timezone: string }): string {
  const z = IANAZone.create(existing.timezone);
  return DateTime.fromJSDate(existing.scheduledAt, { zone: z }).toISO() ?? '';
}

export async function createReminder(userId: string, input: ReminderInput) {
  const phone = await assertCallablePhone(userId, input.phoneNumberId);
  const isFreeCall = await assertReminderCreateAllowed(userId, input.repeatRule, input.timezone);

  const run = computeNextRun({ localDateTime: input.localDateTime, timezone: input.timezone });
  if (!run) throw badRequest('Invalid local date-time or timezone');

  const scheduledAt = isoToDate(run.scheduledAtIso);
  const reminder = await reminderRepo.createReminder({
    userId,
    title: input.title,
    message: input.message,
    timezone: input.timezone,
    scheduledAt,
    nextRunAt: scheduledAt,
    repeatRule: input.repeatRule,
    phoneNumberId: phone.id,
    isFreeCall
  });

  await enqueueReminder({ id: reminder.id, nextRunAt: reminder.nextRunAt, isEnabled: reminder.isEnabled, status: reminder.status });
  return reminder;
}

export async function listReminders(userId: string, opts: { status?: ReminderStatus; upcoming?: boolean }) {
  const items = await reminderRepo.listReminders(userId, opts);
  return items.map((r) => serializeReminder(r));
}

export function serializeReminder(r: {
  id: string;
  title: string;
  message: string;
  timezone: string;
  scheduledAt: Date;
  nextRunAt: Date | null;
  repeatRule: RepeatRule;
  isEnabled: boolean;
  status: string;
  lastCallAt: Date | null;
  phoneNumber?: { id: string; e164: string } | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const nextLocal = r.nextRunAt ? DateTime.fromJSDate(r.nextRunAt, { zone: r.timezone }).toISO() ?? null : null;
  return {
    id: r.id,
    title: r.title,
    message: r.message,
    timezone: r.timezone,
    scheduledAt: r.scheduledAt.toISOString(),
    nextRunAt: r.nextRunAt?.toISOString() ?? null,
    nextLocal,
    repeatRule: r.repeatRule,
    isEnabled: r.isEnabled,
    status: r.status,
    lastCallAt: r.lastCallAt?.toISOString() ?? null,
    phoneNumber: r.phoneNumber ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  };
}

export async function getReminder(userId: string, reminderId: string) {
  const r = await reminderRepo.getReminderWithAttempts(userId, reminderId);
  if (!r) throw notFound('Reminder not found');
  const phone = r.phoneNumber ? { id: r.phoneNumber.id, e164: r.phoneNumber.e164 } : null;
  return {
    ...serializeReminder({ ...r, phoneNumber: phone }),
    attempts: r.attempts.map((a) => ({
      id: a.id,
      status: a.status,
      startedAt: a.startedAt.toISOString(),
      endedAt: a.endedAt?.toISOString() ?? null,
      providerCallId: a.providerCallId,
      detail: a.detail
    }))
  };
}

export async function updateReminder(userId: string, reminderId: string, patch: Partial<ReminderInput> & { isEnabled?: boolean }) {
  const existing = await reminderRepo.findReminderOwned(userId, reminderId);
  if (!existing) throw notFound('Reminder not found');

  if (patch.isEnabled === true && !existing.isFreeCall) {
    await assertEntitled(userId);
  }

  if (patch.phoneNumberId && patch.phoneNumberId !== existing.phoneNumberId) {
    await assertCallablePhone(userId, patch.phoneNumberId);
  }

  const timeChanged = patch.localDateTime !== undefined || patch.timezone !== undefined;
  const localDateTime = patch.localDateTime ?? wallClockFor(existing);
  const timezone = patch.timezone ?? existing.timezone;
  let scheduledAt: Date | undefined;
  if (timeChanged) {
    const run = computeNextRun({ localDateTime, timezone });
    if (!run) throw badRequest('Invalid local date-time or timezone');
    scheduledAt = isoToDate(run.scheduledAtIso);
  }

  // Cancel the pending job under the current scheduling before mutating.
  await cancelJob(existing.id, existing.nextRunAt);

  const updated = await reminderRepo.updateReminderFields(existing.id, {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.message !== undefined ? { message: patch.message } : {}),
    ...(patch.repeatRule !== undefined ? { repeatRule: patch.repeatRule } : {}),
    ...(patch.phoneNumberId !== undefined ? { phoneNumber: { connect: { id: patch.phoneNumberId } } } : {}),
    ...(patch.isEnabled !== undefined ? { isEnabled: patch.isEnabled } : {}),
    ...(timeChanged && scheduledAt ? { timezone, scheduledAt, nextRunAt: scheduledAt, status: 'SCHEDULED' } : {})
  });

  if (updated.isEnabled && updated.status !== 'CANCELED') {
    if (updated.status !== 'SCHEDULED') {
      await reminderRepo.updateReminderFields(updated.id, { status: 'SCHEDULED' });
      updated.status = 'SCHEDULED';
    }
    await enqueueReminder({ id: updated.id, nextRunAt: updated.nextRunAt, isEnabled: updated.isEnabled, status: updated.status });
  }

  return serializeReminder(updated);
}

export async function deleteReminder(userId: string, reminderId: string) {
  const existing = await reminderRepo.findReminderOwned(userId, reminderId);
  if (!existing) throw notFound('Reminder not found');
  await cancelJob(existing.id, existing.nextRunAt);
  const cancelled = await reminderRepo.cancelReminder(existing.id);
  return { deleted: true, id: cancelled.id };
}