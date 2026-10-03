export function timezoneList(): string[] {
  const supported = Intl.supportedValuesOf?.('timeZone') ?? [];
  return [...new Set(['UTC', ...supported])].sort();
}

const dayFmtCache = new Map<string, Intl.DateTimeFormat>();
const timeFmtCache = new Map<string, Intl.DateTimeFormat>();
const weekdayFmtCache = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = dayFmtCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone });
    dayFmtCache.set(timeZone, f);
  }
  return f;
}

function timeFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = timeFmtCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
    timeFmtCache.set(timeZone, f);
  }
  return f;
}

function weekdayFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = weekdayFmtCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone });
    weekdayFmtCache.set(timeZone, f);
  }
  return f;
}

export function formatDay(timeZone: string, iso: string): string {
  return dayFormatter(timeZone).format(new Date(iso));
}

export function formatTodayLabel(timeZone: string): string {
  return weekdayFormatter(timeZone).format(new Date());
}

export function formatTime(timeZone: string, iso: string): string {
  return timeFormatter(timeZone).format(new Date(iso));
}

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatRelative(iso: string, now = Date.now()): string {
  const diffMs = new Date(iso).getTime() - now;
  const absMs = Math.abs(diffMs);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 365 * 24 * 3600 * 1000],
    ['month', 30 * 24 * 3600 * 1000],
    ['week', 7 * 24 * 3600 * 1000],
    ['day', 24 * 3600 * 1000],
    ['hour', 3600 * 1000],
    ['minute', 60 * 1000]
  ];
  for (const [unit, span] of units) {
    if (absMs >= span) {
      return relativeFormatter.format(Math.round(diffMs / span), unit);
    }
  }
  return relativeFormatter.format(Math.round(diffMs / 1000), 'second');
}

export function formatDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

/** Format an amount in minor units (e.g. 599 for $5.99) for a currency code. */
export function formatMoney(amountMinorUnits: number | null, currency: string | null): string {
  if (amountMinorUnits == null || !currency) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amountMinorUnits / 100);
  } catch {
    return `${currency} ${(amountMinorUnits / 100).toFixed(2)}`;
  }
}

/** Convert a scheduled ISO instant to `YYYY-MM-DDTHH:mm` wall-clock in the given timezone (for datetime-local inputs). */
export function toLocalInputValue(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

const WEEKDAYS = 7 * 24 * 3600 * 1000;
const MONTHS = 30 * 24 * 3600 * 1000;

/** Return true if the ISO instant falls on today's date in the given timezone. */
export function isToday(timeZone: string, iso: string): boolean {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date(iso)) === fmt.format(new Date());
}

/** Stable day key for grouping reminders in their own timezone. */
export function dayGroupKey(timeZone: string, iso: string): string {
  if (isToday(timeZone, iso)) return `Today · ${formatDay(timeZone, iso)}`;
  return formatDay(timeZone, iso);
}

/** Return true if the reminder's next run is within a loose 'upcoming' window. */
export function isUpcoming(r: { nextRunAt: string | null }, now = Date.now()): boolean {
  if (!r.nextRunAt) return false;
  const t = new Date(r.nextRunAt).getTime();
  return t >= now - MONTHS && t <= now + MONTHS;
}

export function repeatLabel(rule: string): string {
  if (rule === 'DAILY') return 'Daily';
  if (rule === 'WEEKLY') return 'Weekly';
  return 'Once';
}

export function elapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60}s`;
}

export const WEEK = WEEKDAYS;

const STOPWORDS = new Set([
  'i', 'i\'m', 'ive', 'im', 'i\'ve', 'me', 'my', 'mine', 'we', 'our', 'you', 'your',
  'the', 'a', 'an', 'and', 'or', 'but', 'so', 'to', 'for', 'of', 'in', 'on', 'at',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'can', 'could', 'should', 'shall', 'may', 'might', 'must',
  'please', 'remind', 'me', 'remember', 'dont', 'don\'t', 'do', 'not', 'that', 'this',
  'these', 'those', 'it', 'it\'s', 'call', 'calling', 'about'
]);

/**
 * Derive a short 1-2 word label from a reminder message (used as the
 * "I'll call you for …" summary). Trims leading filler/stopwords so the
 * remaining words are the meaningful ones, cap at two.
 */
export function deriveShortTitle(message: string): string {
  const words = message
    .replace(/[^a-zA-Z0-9'\-\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'Call';

  const meaningful = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));
  const picks = (meaningful.length >= 2 ? meaningful : words).slice(0, 2);
  const title = picks
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return title || 'Call';
}