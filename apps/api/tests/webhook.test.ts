import { describe, expect, it } from 'vitest';
import { parseWebhookEvent } from '../src/routes/webhook';

describe('webhook event parsing', () => {
  it('unwraps the Telnyx v2 envelope from data.event_type', () => {
    const raw = JSON.stringify({
      data: {
        id: 'event_123',
        occurred_at: '2026-09-22T15:00:00.000Z',
        record_type: 'event',
        event_type: 'call.answered',
        payload: { call_control_id: 'v2:abc', call_session_id: 'session_1' }
      }
    });
    const event = parseWebhookEvent(raw);
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('call.answered');
    expect(event!.occurredAt).toBe('2026-09-22T15:00:00.000Z');
    expect(event!.payload.call_control_id).toBe('v2:abc');
  });

  it('returns null for a missing data object', () => {
    expect(parseWebhookEvent('{"event_type":"call.speak.ended"}')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseWebhookEvent('not json')).toBeNull();
    expect(parseWebhookEvent('')).toBeNull();
  });
});