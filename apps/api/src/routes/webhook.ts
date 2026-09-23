import { Router } from 'express';
import { env } from '../config';
import { logger } from '../lib/logger';
import { verifyTelnyxSignature } from '../telephony/signature';
import { handleTelnyxEvent } from '../services/callService';
import type { TelephonyEvent } from '../telephony/types';

export const webhookRouter = Router();

export function parseWebhookEvent(raw: string): TelephonyEvent | null {
  if (!raw) return null;
  try {
    const envelope = JSON.parse(raw) as {
      data?: {
        event_type?: unknown;
        occurred_at?: unknown;
        id?: unknown;
        payload?: unknown;
      };
    };
    const data = envelope.data;
    if (!data || typeof data.event_type !== 'string') return null;
    return {
      eventType: data.event_type,
      occurredAt: typeof data.occurred_at === 'string' ? data.occurred_at : new Date().toISOString(),
      webhookId: typeof data.id === 'string' ? data.id : undefined,
      payload: data.payload && typeof data.payload === 'object' ? (data.payload as Record<string, unknown>) : {},
      raw: envelope
    };
  } catch {
    return null;
  }
}

// Mounted with express.text({ type: '*/*' }): req.body carries the raw payload.
webhookRouter.post('/', (req, res) => {
  const rawBody = typeof req.body === 'string' ? req.body : '';
  if (!rawBody) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Raw body required' } });
    return;
  }

  if (!env.TELNYX_PUBLIC_KEY) {
    logger.warn('TELNYX_PUBLIC_KEY not configured; rejecting webhook');
    res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Webhook not configured' } });
    return;
  }

  const headers = req.headers as Record<string, string | string[] | undefined>;
  if (!verifyTelnyxSignature(rawBody, headers, env.TELNYX_PUBLIC_KEY)) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } });
    return;
  }

  const event = parseWebhookEvent(rawBody);
  if (!event) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON payload' } });
    return;
  }

  // Acknowledge immediately; process async so Telnyx does not retry.
  res.status(200).json({ ok: true });
  void handleTelnyxEvent(event).catch((err) => {
    logger.error({ err: err instanceof Error ? err.message : String(err), event: event.eventType }, 'webhook processing failed');
  });
});