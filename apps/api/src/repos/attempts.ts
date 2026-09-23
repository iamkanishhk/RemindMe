import type { ReminderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function createCallAttempt(params: {
  reminderId: string;
  startedAt?: Date;
  status?: ReminderStatus;
  providerCallId?: string;
  detail?: string;
}) {
  return prisma.callAttempt.create({
    data: {
      reminderId: params.reminderId,
      startedAt: params.startedAt ?? new Date(),
      status: params.status ?? 'CALLING',
      providerCallId: params.providerCallId,
      detail: params.detail
    }
  });
}

export async function setAttemptStatus(
  attemptId: string,
  status: ReminderStatus,
  fields?: { endedAt?: Date | null; detail?: string | null }
) {
  return prisma.callAttempt.update({
    where: { id: attemptId },
    data: { status, ...(fields?.endedAt !== undefined ? { endedAt: fields.endedAt } : {}), ...(fields?.detail !== undefined ? { detail: fields.detail } : {}) }
  });
}

export async function findByProviderCallId(providerCallId: string) {
  return prisma.callAttempt.findUnique({ where: { providerCallId } });
}

export async function listAttemptsByReminder(reminderId: string, take = 50) {
  return prisma.callAttempt.findMany({
    where: { reminderId },
    orderBy: { startedAt: 'desc' },
    take
  });
}

export async function listAttemptsByUser(params: { userId: string; limit: number; cursor?: string }) {
  const where = { reminder: { userId: params.userId } };
  const take = params.limit + 1;
  const cursorWhere = params.cursor ? { id: params.cursor } : undefined;

  const rows = await prisma.callAttempt.findMany({
    where,
    take,
    ...(cursorWhere ? { cursor: cursorWhere, skip: 1 } : {}),
    orderBy: { startedAt: 'desc' },
    include: {
      reminder: {
        select: { id: true, title: true, phoneNumber: { select: { e164: true } } }
      }
    }
  });

  const hasMore = rows.length > params.limit;
  const items = hasMore ? rows.slice(0, params.limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;
  return { attempts: items, nextCursor };
}