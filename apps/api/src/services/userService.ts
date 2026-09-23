import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { clerkClient } from '@clerk/express';

const fetchedFromClerk = new Set<string>();

async function fetchClerkEmail(clerkUserId: string): Promise<string | null> {
  try {
    const user = await clerkClient.users.getUser(clerkUserId);
    const primary =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ?? user.emailAddresses[0];
    return primary?.emailAddress ?? null;
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : String(err), clerkUserId }, 'clerk user fetch failed');
    return null;
  }
}

export async function ensureUserByClerkId(clerkUserId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkUserId } });
  if (existing) return existing;

  let email: string | null = null;
  if (!fetchedFromClerk.has(clerkUserId)) {
    fetchedFromClerk.add(clerkUserId);
    email = await fetchClerkEmail(clerkUserId);
  }
  const resolvedEmail = email ?? `${clerkUserId}@clerk.local`;

  try {
    return await prisma.user.upsert({
      where: { clerkUserId },
      create: { clerkUserId, email: resolvedEmail },
      update: { email: resolvedEmail }
    });
  } catch {
    // Email unique collision (the same inbox signed up under another Clerk user).
    try {
      return await prisma.user.upsert({
        where: { clerkUserId },
        create: { clerkUserId, email: `${clerkUserId}@clerk.local` },
        update: {}
      });
    } catch (err2) {
      logger.error({ err: err2 instanceof Error ? err2.message : String(err2), clerkUserId }, 'user sync failed');
      throw err2;
    }
  }
}

export async function getOwnUser(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      _count: { select: { phoneNumbers: true, reminders: true } }
    }
  });
}

export async function deleteMe(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.reminder.deleteMany({ where: { userId } }),
    prisma.phoneNumber.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } })
  ]);
}