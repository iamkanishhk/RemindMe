import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { clerkClient } from '@clerk/express';

const fetchedFromClerk = new Set<string>();
// Guard so a user with no first name on record isn't re-queried in Clerk on
// every single authenticated request.
const nameBackfillTried = new Set<string>();

async function fetchClerkProfile(clerkUserId: string): Promise<{ email: string | null; firstName: string | null }> {
  try {
    const user = await clerkClient.users.getUser(clerkUserId);
    const primary =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ?? user.emailAddresses[0];
    const firstName = user.firstName || user.fullName?.split(' ')[0] || null;
    return { email: primary?.emailAddress ?? null, firstName };
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : String(err), clerkUserId }, 'clerk user fetch failed');
    return { email: null, firstName: null };
  }
}

export async function ensureUserByClerkId(clerkUserId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkUserId } });
  if (existing) {
    // Lazy backfill of the first name once, from Clerk registration.
    if (!existing.firstName && !nameBackfillTried.has(clerkUserId)) {
      nameBackfillTried.add(clerkUserId);
      const profile = await fetchClerkProfile(clerkUserId);
      if (profile.firstName) {
        return prisma.user.update({ where: { id: existing.id }, data: { firstName: profile.firstName } });
      }
    }
    return existing;
  }

  let profile: { email: string | null; firstName: string | null } = { email: null, firstName: null };
  if (!fetchedFromClerk.has(clerkUserId)) {
    fetchedFromClerk.add(clerkUserId);
    profile = await fetchClerkProfile(clerkUserId);
  }
  const resolvedEmail = profile.email ?? `${clerkUserId}@clerk.local`;

  try {
    return await prisma.user.upsert({
      where: { clerkUserId },
      create: { clerkUserId, email: resolvedEmail, firstName: profile.firstName },
      update: { email: resolvedEmail }
    });
  } catch {
    // Email unique collision (the same inbox signed up under another Clerk user).
    try {
      return await prisma.user.upsert({
        where: { clerkUserId },
        create: { clerkUserId, email: `${clerkUserId}@clerk.local`, firstName: profile.firstName },
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

export async function completeOnboarding(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { onboardingCompletedAt: new Date() }
  });
}

export async function deleteMe(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { clerkUserId: true }
  });

  if (user?.clerkUserId) {
    await clerkClient.users.deleteUser(user.clerkUserId);
  }

  await prisma.$transaction([
    prisma.reminder.deleteMany({ where: { userId } }),
    prisma.phoneNumber.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } })
  ]);
}