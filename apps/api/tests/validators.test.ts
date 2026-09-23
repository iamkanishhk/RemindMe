import { describe, expect, it } from 'vitest';
import {
  createPhoneNumberSchema,
  verifyPhoneNumberSchema,
  reminderActionSchema,
  reminderPatchSchema,
  timezoneSchema,
  listRemindersQuerySchema
} from '../src/lib/validators';

describe('validators', () => {
  it('accepts normalized e164', () => {
    const parsed = createPhoneNumberSchema.parse({ e164: '+14155552671' });
    expect(parsed.e164.length).toBeGreaterThan(0);
  });

  it('rejects an invalid e164', () => {
    expect(() => createPhoneNumberSchema.parse({ e164: 'abc' })).toThrow();
  });

  it('accepts a verified-carrying e164 object', () => {
    const parsed = verifyPhoneNumberSchema.parse({ e164: '+60123456789', clerkVerificationId: 'vrf_123' });
    expect(parsed.clerkVerificationId).toBe('vrf_123');
  });

  it('requires a clerkVerificationId', () => {
    expect(() => verifyPhoneNumberSchema.parse({ e164: '+60123456789' })).toThrow();
  });

  it('timezones must be valid IANA', () => {
    expect(timezoneSchema.parse('America/New_York')).toBe('America/New_York');
    expect(() => timezoneSchema.parse('Not/AZone')).toThrow();
  });

  it('reminder create requires title, message, timezone, date', () => {
    const valid = {
      title: 'Water plants',
      message: 'Time to water the monstera.',
      timezone: 'Asia/Kuala_Lumpur',
      localDateTime: '2026-09-22T09:00:00',
      repeatRule: 'DAILY',
      phoneNumberId: 'ph_1'
    };
    expect(reminderActionSchema.parse(valid).repeatRule).toBe('DAILY');
    expect(() => reminderActionSchema.parse({ ...valid, title: '' })).toThrow();
    expect(() => reminderActionSchema.parse({ ...valid, phoneNumberId: undefined })).toThrow();
  });

  it('patch is partial and allows rope-off', () => {
    expect(reminderPatchSchema.parse({ isEnabled: false })).toEqual({ isEnabled: false });
    expect(reminderPatchSchema.parse({ message: 'new' }).message).toBe('new');
  });

  it('list query status is a reminder status and upcoming coerces', () => {
    const parsed = listRemindersQuerySchema.parse({ status: 'COMPLETED', upcoming: 'true' });
    expect(parsed.status).toBe('COMPLETED');
    expect(parsed.upcoming).toBe(true);
    expect(() => listRemindersQuerySchema.parse({ status: 'NONE' })).toThrow();
  });
});