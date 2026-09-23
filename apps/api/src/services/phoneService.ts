import { clerkClient } from '@clerk/express';
import { badRequest, conflict, notFound, unprocessable } from '../lib/errors';
import { logger } from '../lib/logger';
import * as phoneRepo from '../repos/phoneNumbers';
import { cancelJob } from './schedulerService';
import { prisma } from '../lib/prisma';

async function isClerkVerified(clerkPhoneNumberId: string, e164: string): Promise<boolean> {
  try {
    const pn = await clerkClient.phoneNumbers.getPhoneNumber(clerkPhoneNumberId);
    return pn.phoneNumber === e164 && pn.verification?.status === 'verified';
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'clerk verification lookup failed');
    return false;
  }
}

export async function addPhoneNumber(userId: string, e164: string) {
  const existing = await phoneRepo.findPhoneByE164(e164);
  if (existing) {
    if (existing.userId === userId) return existing;
    throw conflict('This phone number is already in use by another account');
  }
  return phoneRepo.createPhone(userId, e164);
}

export async function verifyPhoneNumber(userId: string, e164: string, clerkPhoneNumberId: string) {
  const phone = await phoneRepo.findPhoneByE164ForUser(userId, e164);
  if (!phone) {
    throw notFound('Phone number not found for this user. Create it first.');
  }
  if (phone.verified) return phone;

  const verified = await isClerkVerified(clerkPhoneNumberId, e164);
  if (!verified) {
    throw unprocessable('Phone number is not verified with Clerk (OTP). Complete SMS verification first.');
  }
  return phoneRepo.markPhoneVerified(phone.id);
}

export async function deletePhoneNumber(userId: string, phoneId: string, force: boolean) {
  const phone = await phoneRepo.findPhoneOwned(userId, phoneId);
  if (!phone) throw notFound('Phone number not found');

  const referencing = await phoneRepo.countRemindersForPhone(phone.id);
  if (referencing > 0) {
    if (!force) {
      throw conflict('Reminders reference this number. Pass ?force=true to cancel them first.');
    }
    const reminders = await prisma.reminder.findMany({ where: { phoneNumberId: phone.id } });
    for (const r of reminders) {
      await cancelJob(r.id, r.nextRunAt);
    }
    await prisma.reminder.updateMany({
      where: { phoneNumberId: phone.id },
      data: { status: 'CANCELED', nextRunAt: null, isEnabled: false }
    });
  }
  await phoneRepo.deletePhone(phone.id);
  return { deleted: true };
}

export function validateSupportedCountry(e164: string, allowed: string[]) {
  const supported = allowed.length === 0 || allowed.some((p) => e164.startsWith(p));
  if (!supported) throw badRequest('Phone number country is not supported');
}