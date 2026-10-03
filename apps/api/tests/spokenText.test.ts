import { describe, expect, it } from 'vitest';
import { composeSpokenText } from '../src/services/spokenText';

describe('composeSpokenText', () => {
  it('greets by first name then appends the enhanced message', () => {
    const out = composeSpokenText({ firstName: 'Kanishk', voiceMessage: 'You have a flight tomorrow.', message: 'raw note' });
    expect(out).toMatch(/^Hello Kanishk, .+! You have a flight tomorrow\.$/);
    expect(out).not.toContain('raw note');
  });

  it('falls back to the original message when there is no enhanced version', () => {
    const out = composeSpokenText({ firstName: 'Kanishk', voiceMessage: null, message: 'call mom' });
    expect(out).toContain('call mom');
  });

  it('omits the name greeting when the user has no first name', () => {
    const out = composeSpokenText({ firstName: null, voiceMessage: 'Take your medicine.', message: 'x' });
    expect(out).toMatch(/^Hello there, .+! Take your medicine\.$/);
  });
});