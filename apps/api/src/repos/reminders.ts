import type { Prisma, Reminder, ReminderStatus, RepeatRule } from '@prisma/client';
import { prisma } from '../lib/prisma';

export type ReminderCreateInput = {
  userId: string;
  title: string;
  message: string;
  timezone: string;
  scheduledAt: Date;
  nextRunAt: Date;
  repeatRule: RepeatRule;
  phoneNumberId: string;
};

export async function createReminder(data: ReminderCreateInput) {
  return prisma.reminder.create({
    data: { ...data, status: 'SCHEDULED' }
  });
}

export async function findReminderOwned(userId: string, reminderId: string) {
  return prisma.reminder.findFirst({ where: { id: reminderId, userId } });
}

export async function getReminderWithAttempts(userId: string, reminderId: string) {
  return prisma.reminder.findFirst({
    where: { id: reminderId, userId },
    include: {
      phoneNumber: true,
      attempts: { orderBy: { startedAt: 'desc' }, take: 50 }
    }
  });
}

export async function listReminders(userId: string, opts: { status?: ReminderStatus; upcoming?: boolean }) {
  const now = new Date();
  const where: Prisma.ReminderWhereInput = {
    userId,
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.upcoming
      ? { status: { not: 'CANCELED' as ReminderStatus }, nextRunAt: { gte: now } }
      : {})
  };
  return prisma.reminder.findMany({
    where,
    orderBy: { nextRunAt: 'asc' },
    include: { phoneNumber: true }
  });
}

export async function updateReminderFields(
  reminderId: string,
  data: Prisma.ReminderUpdateInput
): Promise<Reminder> {
  return prisma.reminder.update({ where: { id: reminderId }, data });
}

export async function cancelReminder(reminderId: string) {
  return prisma.reminder.update({
    where: { id: reminderId },
    data: { status: 'CANCELED', nextRunAt: null, isEnabled: false }
  });
}

export async function setReminderStatus(reminderId: string, status: ReminderStatus, extra?: Prisma.ReminderUpdateInput) {
  return prisma.reminder.update({ where: { id: reminderId }, data: { status, ...extra } });
}

export async function remindersDueForReconcile() {
  const horizonStart = new Date(Date.now() - 5 * 60 * 1000);
  const horizonEnd = new Date(Date.now() + 5 * 60 * 1000);
  return prisma.reminder.findMany({
    where: {
      isEnabled: true,
      status: { in: ['SCHEDULED', 'CALLING'] },
      nextRunAt: { gte: horizonStart, lte: horizonEnd }
    }
  });
}