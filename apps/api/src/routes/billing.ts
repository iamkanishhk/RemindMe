import { Router } from 'express';
import { env } from '../config';
import { logger } from '../lib/logger';
import { getDodoClient } from '../lib/dodo';
import { asyncHandler } from '../lib/errors';
import { checkoutSchema } from '../lib/validators';
import { requireAuth } from '../middleware/auth';
import * as billingService from '../services/billingService';
import type { DodoSubscriptionWebhook } from '../services/billingService';

export const billingRouter = Router();

billingRouter.use(requireAuth());

billingRouter.get(
  '/status',
  asyncHandler(async (req, res) => {
    const billing = await billingService.getBillingStatus(req.user!.id);
    res.json({ billing });
  })
);

billingRouter.get(
  '/plans',
  asyncHandler(async (_req, res) => {
    const plans = await billingService.listPlans();
    res.json({ plans });
  })
);

billingRouter.post(
  '/checkout',
  asyncHandler(async (req, res) => {
    const { planId } = checkoutSchema.parse(req.body ?? {});
    const result = await billingService.createCheckoutSession(req.user!.id, req.user!.email, planId);
    res.status(201).json(result);
  })
);

billingRouter.post(
  '/cancel',
  asyncHandler(async (req, res) => {
    await billingService.cancelSubscription(req.user!.id);
    const billing = await billingService.getBillingStatus(req.user!.id);
    res.json({ billing });
  })
);

export const billingWebhookRouter = Router();

function headerValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

// Mounted with express.text({ type: '*/*' }): req.body carries the raw payload.
billingWebhookRouter.post('/', (req, res) => {
  const rawBody = typeof req.body === 'string' ? req.body : '';
  if (!rawBody) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Raw body required' } });
    return;
  }

  if (!env.DODO_PAYMENTS_WEBHOOK_KEY) {
    logger.warn('DODO_PAYMENTS_WEBHOOK_KEY not configured; rejecting billing webhook');
    res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Webhook not configured' } });
    return;
  }

  const headers = req.headers as Record<string, string | string[] | undefined>;
  const headersForVerification: Record<string, string> = {
    'webhook-id': headerValue(headers['webhook-id']),
    'webhook-timestamp': headerValue(headers['webhook-timestamp']),
    'webhook-signature': headerValue(headers['webhook-signature'])
  };

  let event: DodoSubscriptionWebhook;
  try {
    event = getDodoClient().webhooks.unwrap(rawBody, {
      headers: headersForVerification,
      key: env.DODO_PAYMENTS_WEBHOOK_KEY
    }) as DodoSubscriptionWebhook;
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'billing webhook signature verification failed');
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } });
    return;
  }

  const webhookId = headerValue(headers['webhook-id']);
  if (!webhookId) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing webhook-id header' } });
    return;
  }

  // Acknowledge immediately; process async so Dodo does not retry a slow sync.
  res.status(200).json({ ok: true });
  void billingService.processBillingWebhook(event, webhookId).catch((err) => {
    logger.error({ err: err instanceof Error ? err.message : String(err), type: event.type }, 'billing webhook processing failed');
  });
});