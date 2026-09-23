import { env } from '../config';
import { logger } from '../lib/logger';
import type { PlaceCallParams, PlacedCall, TelephonyProvider } from './types';

interface TelnyxError {
  errors?: Array<{ code?: string; title?: string; detail?: string }>;
}

export class TelnyxProvider implements TelephonyProvider {
  private base = 'https://api.telnyx.com/v2';
  private apiKey = env.TELNYX_API_KEY;

  private ensureConfigured(): void {
    if (!this.apiKey) {
      throw new Error('TELNYX_API_KEY is not configured');
    }
  }

  async placeCall(params: PlaceCallParams): Promise<PlacedCall> {
    this.ensureConfigured();
    const res = await fetch(`${this.base}/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        connection_id: env.TELNYX_CONNECTION_ID,
        to: `+${params.to.replace(/^\+/, '')}`,
        from: params.from,
        custom_headers: [{ name: 'x-remindme-reminder', values: [params.reminderId] }],
        webhook_url: params.webhookUrl,
        webhook_event_filter: [
          'call.initiated',
          'call.answered',
          'call.speak.ended',
          'call.hangup',
          'call.busy',
          'call.failed',
          'call.missed'
        ]
      })
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as TelnyxError;
      const detail = body.errors?.[0]?.detail ?? `HTTP ${res.status}`;
      throw new Error(`Telnyx placeCall failed: ${detail}`);
    }

    const json = (await res.json()) as {
      data?: { call_control_id?: string; call_session_id?: string; control_id?: string };
    };
    const providerCallId = json.data?.call_control_id ?? json.data?.call_session_id;
    if (!providerCallId) {
      throw new Error('Telnyx placeCall: no call_control_id in response');
    }
    return { providerCallId };
  }

  async speak(callControlId: string, text: string): Promise<void> {
    this.ensureConfigured();
    const res = await fetch(`${this.base}/calls/${callControlId}/actions/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        payload: text,
        voice: 'male',
        language: 'en-US',
        payload_type: 'text'
      })
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, 'telnyx speak failed');
    }
  }

  async hangup(callControlId: string): Promise<void> {
    this.ensureConfigured();
    const res = await fetch(`${this.base}/calls/${callControlId}/actions/hangup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: '{}'
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, 'telnyx hangup failed');
    }
  }
}

export const telnyxProvider: TelephonyProvider = new TelnyxProvider();