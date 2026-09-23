import { parsePhoneNumberFromString } from 'libphonenumber-js';

export class E164Error extends Error {}

export function normalizeE164(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const input = raw.trim();
  if (!input) return null;
  const withPlus = input.startsWith('+') ? input : `+${input}`;
  const parsed = parsePhoneNumberFromString(withPlus);
  if (!parsed) return null;
  const e164 = parsed.number;
  if (!e164) return null;
  return e164;
}

export function isValidE164(value: string): boolean {
  const parsed = parsePhoneNumberFromString(value);
  return parsed != null && parsed.isValid();
}

export function isAllowedGeo(e164: string, allowedPrefixes: string[]): boolean {
  if (allowedPrefixes.length === 0) return true;
  return allowedPrefixes.some((prefix) => e164.startsWith(prefix));
}