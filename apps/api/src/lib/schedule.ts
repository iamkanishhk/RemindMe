import { DateTime, IANAZone, type Zone } from 'luxon';
import type { RepeatRule } from '@prisma/client';

export function toZone(timezone: string): Zone | null {
  const tz = timezone.trim();
  if (!IANAZone.isValidZone(tz)) return null;
  return IANAZone.create(tz);
}

export interface LocalDateTimeInput {
  localDateTime: string;
  timezone: string;
}

export interface NextRun {
  scheduledAtIso: string;
  nextRunIso: string;
}

export function localToUtc(localDateTime: string, timezone: string): NextRun | null {
  const zone = toZone(timezone);
  if (!zone) return null;

  const dt = DateTime.fromISO(localDateTime, { zone });
  if (!dt.isValid) return null;

  const scheduledAt = dt.toUTC();
  return { scheduledAtIso: scheduledAt.toISO()!, nextRunIso: scheduledAt.toISO()! };
}

export function computeNextRun(input: LocalDateTimeInput): NextRun | null {
  return localToUtc(input.localDateTime, input.timezone);
}

export function nextOccurrence(params: {
  runAtUtc: DateTime;
  timezone: string;
  repeatRule: RepeatRule;
  after?: DateTime;
}): string | null {
  const { runAtUtc, timezone, repeatRule } = params;
  if (repeatRule === 'NONE') return null;

  const zone = toZone(timezone);
  if (!zone) return null;

  const after = params.after ?? DateTime.utc();
  const anchorWall = runAtUtc.setZone(zone);

  let candidate = anchorWall;
  // Guard against pathological loops (e.g. schedules far in the past).
  for (let i = 0; i < 1000; i += 1) {
    candidate = candidate.plus(repeatRule === 'DAILY' ? { days: 1 } : { days: 7 });
    if (candidate.toUTC() > after) {
      return candidate.toUTC().toISO()!;
    }
  }

  return null;
}