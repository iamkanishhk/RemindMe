import { describe, expect, it } from 'vitest';
import { normalizeE164, isValidE164, isAllowedGeo, E164Error } from '../src/lib/e164';

describe('e164', () => {
  it('normalizes fully-international numbers', () => {
    expect(normalizeE164('+1 (415) 555-2671')).toBe('+14155552671');
    expect(normalizeE164('  +60123456789 ')).toBe('+60123456789');
  });

  it('accepts bare digits and prepends +', () => {
    expect(normalizeE164('60123456789')).toBe('+60123456789');
  });

  it('returns null for junk', () => {
    expect(normalizeE164('not-a-number')).toBeNull();
    expect(normalizeE164('')).toBeNull();
    expect(normalizeE164(1234)).toBeNull();
    expect(normalizeE164(undefined)).toBeNull();
  });

  it('validates numbers', () => {
    expect(isValidE164('+14155552671')).toBe(true);
    expect(isValidE164('+999999')).toBe(false);
  });

  it('enforces geolocation allow-lists', () => {
    expect(isAllowedGeo('+60123456789', [])).toBe(true);
    expect(isAllowedGeo('+60123456789', ['+60'])).toBe(true);
    expect(isAllowedGeo('+14155552671', ['+60'])).toBe(false);
  });

  it('E164Error is an Error', () => {
    const err = new E164Error('boom');
    expect(err).toBeInstanceOf(Error);
  });
});