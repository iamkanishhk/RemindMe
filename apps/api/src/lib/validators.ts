import { z } from 'zod';
import { ReminderStatus, RepeatRule } from '@prisma/client';
import { normalizeE164 } from './e164';
import { toZone } from './schedule';

export const e164Schema = z
  .string()
  .refine((v) => normalizeE164(v) !== null, { message: 'Invalid E.164 phone number' });

export const createPhoneNumberSchema = z.object({
  e164: e164Schema
});

export const verifyPhoneNumberSchema = z.object({
  e164: e164Schema,
  clerkVerificationId: z.string().min(1)
});

export const timezoneSchema = z.string().refine((tz) => toZone(tz) !== null, {
  message: 'Invalid IANA timezone'
});

export const localDateTimeSchema = z
  .string()
  .refine((v) => new Date(v).toString() !== 'Invalid Date', { message: 'Invalid ISO date-time' });

export const reminderActionSchema = z.object({
  title: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(500),
  timezone: timezoneSchema,
  localDateTime: localDateTimeSchema,
  repeatRule: z.nativeEnum(RepeatRule).default('NONE'),
  phoneNumberId: z.string().min(1)
});

export const reminderPatchSchema = reminderActionSchema.partial().extend({
  isEnabled: z.boolean().optional()
});

export const listRemindersQuerySchema = z.object({
  status: z.nativeEnum(ReminderStatus).optional(),
  upcoming: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => v === 'true' || v === '1')
});