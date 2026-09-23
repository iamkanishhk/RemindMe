import { prisma } from '../lib/prisma';

export async function findPhoneOwned(userId: string, phoneId: string) {
  return prisma.phoneNumber.findFirst({ where: { id: phoneId, userId } });
}

export async function findPhoneByE164ForUser(userId: string, e164: string) {
  return prisma.phoneNumber.findFirst({ where: { userId, e164 } });
}

export async function findPhoneByE164(e164: string) {
  return prisma.phoneNumber.findUnique({ where: { e164 } });
}

export async function listPhonesForUser(userId: string) {
  return prisma.phoneNumber.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function createPhone(userId: string, e164: string) {
  return prisma.phoneNumber.create({ data: { userId, e164 } });
}

export async function markPhoneVerified(id: string) {
  return prisma.phoneNumber.update({ where: { id }, data: { verified: true, verifiedAt: new Date() } });
}

export async function countRemindersForPhone(phoneNumberId: string) {
  return prisma.reminder.count({ where: { phoneNumberId } });
}

export async function deletePhone(id: string) {
  await prisma.phoneNumber.delete({ where: { id } });
}