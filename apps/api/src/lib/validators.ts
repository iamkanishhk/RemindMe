import { z } from 'zod';
import { ReminderStatus, RepeatRule } from '@prisma/client';
import { normalizeE164 } from './e164';
import { toZone, localToUtc } from './schedule';

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

export const reminderFieldsSchema = z.object({
  message: z.string().trim().min(1).max(500),
  timezone: timezoneSchema,
  localDateTime: localDateTimeSchema,
  repeatRule: z.nativeEnum(RepeatRule).default('NONE'),
  phoneNumberId: z.string().min(1)
});

const PAST_GRACE_MS = 60_000;

function assertScheduledInFuture(
  value: { localDateTime?: string; timezone?: string },
  ctx: z.RefinementCtx
) {
  if (value.localDateTime === undefined || value.timezone === undefined) return;

  const run = localToUtc(value.localDateTime, value.timezone);
  if (!run) return;

  if (Date.parse(run.scheduledAtIso) <= Date.now() - PAST_GRACE_MS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['localDateTime'],
      message: 'Scheduled time must be in the future'
    });
  }
}

export const reminderActionSchema =
  reminderFieldsSchema.superRefine(assertScheduledInFuture);

export const reminderPatchSchema = reminderFieldsSchema
  .partial()
  .extend({
    isEnabled: z.boolean().optional()
  })
  .superRefine(assertScheduledInFuture);

export const listRemindersQuerySchema = z.object({
  status: z.nativeEnum(ReminderStatus).optional(),
  upcoming: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => v === 'true' || v === '1')
});

export const PLAN_IDS = ['monthly', 'annual'] as const;

export const checkoutSchema = z.object({
  planId: z.enum(PLAN_IDS).default('monthly')
});