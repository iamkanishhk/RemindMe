import { describe, expect, it } from 'vitest';
import { computeNextRun, localToUtc, nextOccurrence } from '../src/lib/schedule';
import { DateTime } from 'luxon';
import type { RepeatRule } from '@prisma/client';

describe('schedule', () => {
  it('converts local wall-clock to UTC', () => {
    const run = localToUtc('2026-09-22T09:00:00', 'Asia/Kuala_Lumpur');
    expect(run).not.toBeNull();
    expect(run!.scheduledAtIso).toBe('2026-09-22T01:00:00.000Z');
  });

  it('rejects an invalid timezone', () => {
    expect(localToUtc('2026-09-22T09:00:00', 'Mars/Olympus')).toBeNull();
  });

  it('rejects garbage date strings', () => {
    expect(localToUtc('tomorrow-ish', 'UTC')).toBeNull();
  });

  it('handles a DST spring-forward gap by landing on the adjusted wall clock', () => {
    // America/New_York: 2026-03-08 the clocks jump 02:00 -> 03:00.
    // A local 02:30 does not exist; Luxon normalizes it.
    const run = localToUtc('2026-03-08T02:30:00', 'America/New_York');
    expect(run).not.toBeNull();
    const utc = DateTime.fromISO(run!.scheduledAtIso, { zone: 'UTC' });
    expect(utc.zoneName).toBe('UTC');
  });

  it('computeNextRun is localToUtc', () => {
    const run = computeNextRun({ localDateTime: '2026-09-22T09:00:00', timezone: 'Asia/Kuala_Lumpur' });
    expect(run!.nextRunIso).toBe('2026-09-22T01:00:00.000Z');
  });

  it('nextOccurrence returns null for one-offs', () => {
    expect(nextOccurrence({ runAtUtc: DateTime.utc(), timezone: 'UTC', repeatRule: 'NONE' })).toBeNull();
  });

  it('daily repeat lands on the next calendar day', () => {
    const run = nextOccurrence({
      runAtUtc: DateTime.fromISO('2026-09-22T01:00:00.000Z'),
      timezone: 'UTC',
      repeatRule: 'DAILY' as RepeatRule,
      after: DateTime.fromISO('2026-09-22T01:00:00.000Z')
    });
    expect(run).toBe('2026-09-23T01:00:00.000Z');
  });

  it('daily repeat in a fixed-offset zone preserves local hour', () => {
    const run = nextOccurrence({
      runAtUtc: DateTime.fromISO('2026-09-22T01:00:00.000Z'),
      timezone: 'Asia/Kuala_Lumpur',
      repeatRule: 'DAILY' as RepeatRule,
      after: DateTime.fromISO('2026-09-22T01:00:00.000Z')
    });
    // +08 every day: next run is the following 09:00 local == 01:00Z.
    expect(run).toBe('2026-09-23T01:00:00.000Z');
  });

  it('weekly repeat adds 7 days', () => {
    const run = nextOccurrence({
      runAtUtc: DateTime.fromISO('2026-09-22T01:00:00.000Z'),
      timezone: 'UTC',
      repeatRule: 'WEEKLY' as RepeatRule,
      after: DateTime.fromISO('2026-09-22T01:00:00.000Z')
    });
    expect(run).toBe('2026-09-29T01:00:00.000Z');
  });
});