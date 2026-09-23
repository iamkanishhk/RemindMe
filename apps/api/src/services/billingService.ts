import { env } from '../config';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { getDodoClient } from '../lib/dodo';
import { ApiError, notFound, conflict, paymentRequired, serviceUnavailable } from '../lib/errors';
import type { SubscriptionStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

const SDK_STATUS_TO_DB: Record<string, SubscriptionStatus> = {
  active: 'ACTIVE',
  on_hold: 'ON_HOLD',
  paused: 'ON_HOLD',
  past_due: 'ON_HOLD',
  cancelled: 'CANCELLED',
  expired: 'EXPIRED',
  failed: 'FAILED',
  pending: 'ON_HOLD'
};

interface ProviderSubSource {
  status?: unknown;
  customer?: { customer_id?: unknown } | null;
  product_id?: unknown;
  recurring_pre_tax_amount?: unknown;
  currency?: unknown;
  payment_frequency_interval?: unknown;
  next_billing_date?: unknown;
  cancel_at_next_billing_date?: unknown;
}

interface ProviderSubMapped {
  providerCustomerId: string;
  status: SubscriptionStatus;
  productId: string;
  amountMinorUnits: number;
  currency: string;
  interval: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

function mapProviderFields(src: ProviderSubSource, fallback: Partial<ProviderSubMapped> = {}): ProviderSubMapped {
  const dbStatus = SDK_STATUS_TO_DB[typeof src.status === 'string' ? src.status : ''] ?? 'ON_HOLD';
  return {
    providerCustomerId: typeof src.customer?.customer_id === 'string' ? src.customer.customer_id : fallback.providerCustomerId ?? '',
    status: dbStatus,
    productId: typeof src.product_id === 'string' ? src.product_id : fallback.productId ?? '',
    amountMinorUnits: typeof src.recurring_pre_tax_amount === 'number' ? src.recurring_pre_tax_amount : fallback.amountMinorUnits ?? 0,
    currency: typeof src.currency === 'string' ? src.currency : fallback.currency ?? '',
    interval: typeof src.payment_frequency_interval === 'string' ? src.payment_frequency_interval : fallback.interval ?? null,
    currentPeriodEnd: parseDate(src.next_billing_date) ?? fallback.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: typeof src.cancel_at_next_billing_date === 'boolean' ? src.cancel_at_next_billing_date : fallback.cancelAtPeriodEnd ?? false
  };
}

export type BillingMode = 'none' | 'trial' | 'paid' | 'blocked';

export interface BillingStatusPayload {
  mode: BillingMode;
  status: SubscriptionStatus | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  productId: string | null;
  currency: string | null;
  amountMinorUnits: number | null;
  interval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trial: {
    endsAt: string | null;
    callsUsed: number;
    callLimit: number;
  } | null;
}

export interface DodoSubscriptionWebhook {
  type: string;
  timestamp: string;
  data?: {
    subscription_id?: unknown;
    customer?: { customer_id?: unknown; email?: unknown; name?: unknown };
    status?: unknown;
    currency?: unknown;
    recurring_pre_tax_amount?: unknown;
    payment_frequency_interval?: unknown;
    product_id?: unknown;
    next_billing_date?: unknown;
    cancel_at_next_billing_date?: unknown;
    created_at?: unknown;
    trial_period_days?: unknown;
    metadata?: Record<string, unknown>;
  };
}

export function subscriptionGrantsAccess(sub: { status: SubscriptionStatus; billingStartedAt: Date | null; trialEndsAt: Date | null; currentPeriodEnd: Date | null; trialCallsUsed: number }, now = new Date()): boolean {
  if (!sub) return false;
  if (sub.status === 'ON_HOLD' || sub.status === 'FAILED' || sub.status === 'EXPIRED') return false;

  if (sub.billingStartedAt) {
    if (sub.status === 'ACTIVE') return true;
    if (sub.status === 'CANCELLED' && sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() >= now.getTime()) return true;
    return false;
  }

  if (sub.status !== 'ACTIVE') return false;
  if (sub.trialEndsAt && sub.trialEndsAt.getTime() <= now.getTime()) return false;
  if (sub.trialCallsUsed >= env.TRIAL_CALL_LIMIT) return false;
  return true;
}

async function latestSubscription(userId: string) {
  return prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

async function userEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return user?.email ?? null;
}

const reconcileCache = new Map<string, { at: number }>();
const RECONCILE_TTL_MS = 5000;

// Pull the user's current Dodo subscription and mirror it into the DB. This is
// the reliability net behind the webhook: any time a user is not entitled and
// we check, we reconcile against the provider (matched by customer email) so a
// successful payment activates automatically — even if the webhook never
// arrived or the account row was recreated (which cascades our local row away).
export async function reconcileSubscriptionFromProvider(userId: string): Promise<import('@prisma/client').Subscription | null> {
  if (!env.DODO_PAYMENTS_API_KEY) return null;

  const now = Date.now();
  const last = reconcileCache.get(userId);
  if (last && now - last.at < RECONCILE_TTL_MS) {
    return latestSubscription(userId);
  }
  reconcileCache.set(userId, { at: now });

  const email = await userEmail(userId);
  if (!email) return null;

  try {
    const client = getDodoClient();
    const customers = [];
    for await (const customer of client.customers.list({ email, page_size: 50 })) {
      customers.push(customer);
    }
    const customer = customers[0];
    if (!customer) return null;

    const subscriptionId = typeof customer.customer_id === 'string' ? customer.customer_id : null;
    if (!subscriptionId) return null;

    const subscriptions = [];
    for await (const sub of client.subscriptions.list({ customer_id: subscriptionId, page_size: 100 })) {
      subscriptions.push(sub);
    }
    if (subscriptions.length === 0) return null;

    // Prefer the most recently created active subscription; fall back to the newest overall.
    const active = subscriptions.filter((s) => s.status === 'active');
    const pool = active.length > 0 ? active : subscriptions;
    const best = pool.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    if (!best) return null;

    const created = parseDate(best.created_at);
    const trialPeriodDays = typeof best.trial_period_days === 'number' ? best.trial_period_days : 0;
    const trialEndsAt = trialPeriodDays > 0 && created ? new Date(created.getTime() + trialPeriodDays * 86400000) : null;
    const inTrial = Boolean(trialEndsAt && trialEndsAt.getTime() > Date.now());

    const fields = mapProviderFields(best);

    return await prisma.subscription.upsert({
      where: { providerSubscriptionId: best.subscription_id },
      update: {
        userId,
        ...fields,
        ...(inTrial ? {} : { billingStartedAt: parseDate(best.previous_billing_date) }),
        trialEndsAt
      },
      create: {
        userId,
        providerSubscriptionId: best.subscription_id,
        ...fields,
        billingStartedAt: inTrial ? null : parseDate(best.previous_billing_date),
        trialEndsAt
      }
    });
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : String(err), userId }, 'billing reconciliation with provider failed');
    return null;
  }
}

export async function assertEntitled(userId: string) {
  let sub = await latestSubscription(userId);
  if (!sub || !subscriptionGrantsAccess(sub)) {
    sub = (await reconcileSubscriptionFromProvider(userId)) ?? sub;
  }
  if (!sub || !subscriptionGrantsAccess(sub)) {
    throw paymentRequired();
  }
  return sub;
}

export async function isEntitled(userId: string): Promise<boolean> {
  const sub = await latestSubscription(userId);
  return Boolean(sub && subscriptionGrantsAccess(sub));
}

export async function getBillingStatus(userId: string): Promise<BillingStatusPayload> {
  let sub = await latestSubscription(userId);
  if (!sub || !subscriptionGrantsAccess(sub)) {
    const reconciled = await reconcileSubscriptionFromProvider(userId);
    if (reconciled) sub = reconciled;
  }
  if (!sub) {
    return {
      mode: 'none',
      status: null,
      providerCustomerId: null,
      providerSubscriptionId: null,
      productId: null,
      currency: null,
      amountMinorUnits: null,
      interval: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trial: null
    };
  }

  const access = subscriptionGrantsAccess(sub);
  const mode: BillingMode = !access ? 'blocked' : sub.billingStartedAt ? 'paid' : 'trial';

  return {
    mode,
    status: sub.status,
    providerCustomerId: sub.providerCustomerId,
    providerSubscriptionId: sub.providerSubscriptionId,
    productId: sub.productId,
    currency: sub.currency,
    amountMinorUnits: sub.amountMinorUnits,
    interval: sub.interval,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    trial: mode === 'trial' || mode === 'blocked' ? {
      endsAt: sub.trialEndsAt?.toISOString() ?? null,
      callsUsed: sub.trialCallsUsed,
      callLimit: env.TRIAL_CALL_LIMIT
    } : null
  };
}

export async function createCheckoutSession(userId: string, email: string, name?: string) {
  if (!env.DODO_PAYMENTS_API_KEY || !env.DODO_PAYMENTS_PRODUCT_ID) {
    throw serviceUnavailable('Billing is not configured yet');
  }

  const client = getDodoClient();
  const resp = await client.checkoutSessions.create({
    product_cart: [{ product_id: env.DODO_PAYMENTS_PRODUCT_ID, quantity: 1 }],
    customer: { email, name: name ?? email.split('@')[0] ?? email },
    return_url: env.DODO_PAYMENTS_RETURN_URL,
    cancel_url: env.DODO_PAYMENTS_RETURN_URL,
    subscription_data: { trial_period_days: env.TRIAL_PERIOD_DAYS },
    metadata: { userId }
  });

  return { sessionId: resp.session_id, checkoutUrl: resp.checkout_url ?? null };
}

// Cancel the user's subscription at the end of the current billing period. The
// user keeps access until the period ends (subscriptionGrantsAccess already
// honors this via cancelAtPeriodEnd + currentPeriodEnd).
export async function cancelSubscription(userId: string) {
  const sub = await latestSubscription(userId);
  if (!sub || !sub.providerSubscriptionId) {
    throw notFound('No subscription to cancel');
  }
  if (!env.DODO_PAYMENTS_API_KEY) {
    throw serviceUnavailable('Billing is not configured yet');
  }
  if (sub.cancelAtPeriodEnd) {
    throw conflict('Subscription is already scheduled to cancel');
  }

  try {
    const client = getDodoClient();
    const updated = await client.subscriptions.update(sub.providerSubscriptionId, {
      cancel_at_next_billing_date: true,
      cancel_reason: 'cancelled_by_customer'
    });

    const fields = mapProviderFields(updated);
    const saved = await prisma.subscription.update({
      where: { id: sub.id },
      data: { ...fields, cancelAtPeriodEnd: true }
    });

    logger.info({ userId, providerSubscriptionId: sub.providerSubscriptionId }, 'subscription scheduled to cancel at period end');
    return saved;
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err), providerSubscriptionId: sub.providerSubscriptionId }, 'dodo subscription cancel failed');
    throw new ApiError(502, 'Billing provider rejected the cancellation request', 'PROVIDER_ERROR');
  }
}

export async function recordTrialCall(userId: string): Promise<void> {
  const sub = await latestSubscription(userId);
  if (!sub) return;
  if (sub.billingStartedAt) return;
  if (sub.status !== 'ACTIVE') return;
  if (sub.trialCallsUsed >= env.TRIAL_CALL_LIMIT) return;
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { trialCallsUsed: { increment: 1 } }
  });
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function processBillingWebhook(event: DodoSubscriptionWebhook, webhookId: string): Promise<void> {
  if (!event.type.startsWith('subscription.')) {
    logger.debug({ type: event.type }, 'ignoring non-subscription billing event');
    return;
  }

  const data = event.data;
  if (!data || typeof data.subscription_id !== 'string') {
    logger.warn({ type: event.type }, 'billing webhook without subscription payload');
    return;
  }

  const providerSubscriptionId = data.subscription_id;
  const existing = await prisma.subscription.findUnique({ where: { providerSubscriptionId } });

  const metadata = data.metadata;
  const metadataUserId = metadata && typeof metadata.userId === 'string' ? metadata.userId : null;
  const customerEmail = typeof data.customer?.email === 'string' ? data.customer.email : null;

  const userId = existing?.userId
    ?? (metadataUserId ? (await prisma.user.findUnique({ where: { id: metadataUserId } }))?.id : null)
    ?? (customerEmail ? (await prisma.user.findUnique({ where: { email: customerEmail } }))?.id : null);

  if (!userId) {
    logger.warn({ providerSubscriptionId, customerEmail }, 'could not attribute billing event to a user');
    return;
  }

  const dbStatus = SDK_STATUS_TO_DB[typeof data.status === 'string' ? data.status : ''] ?? 'ON_HOLD';
  const created = parseDate(data.created_at);
  const trialPeriodDays = typeof data.trial_period_days === 'number' ? data.trial_period_days : 0;
  const trialEndsAt = trialPeriodDays > 0 && created ? new Date(created.getTime() + trialPeriodDays * 86400000) : null;
  const isRenewed = event.type === 'subscription.renewed';

  const fields = {
    providerCustomerId: typeof data.customer?.customer_id === 'string' ? data.customer.customer_id : existing?.providerCustomerId ?? '',
    status: dbStatus,
    productId: typeof data.product_id === 'string' ? data.product_id : existing?.productId ?? '',
    amountMinorUnits: typeof data.recurring_pre_tax_amount === 'number' ? data.recurring_pre_tax_amount : existing?.amountMinorUnits ?? 0,
    currency: typeof data.currency === 'string' ? data.currency : existing?.currency ?? '',
    interval: typeof data.payment_frequency_interval === 'string' ? data.payment_frequency_interval : existing?.interval ?? null,
    currentPeriodEnd: parseDate(data.next_billing_date) ?? existing?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: typeof data.cancel_at_next_billing_date === 'boolean' ? data.cancel_at_next_billing_date : existing?.cancelAtPeriodEnd ?? false
  };

  try {
    await prisma.$transaction(async (tx) => {
      const alreadyProcessed = await tx.billingEvent.findUnique({ where: { webhookId } });
      if (alreadyProcessed) {
        logger.debug({ webhookId, type: event.type }, 'duplicate billing webhook');
        return;
      }

      if (existing) {
        const update: Prisma.SubscriptionUpdateInput = {
          ...fields,
          ...(isRenewed
            ? { trialEndsAt: null, billingStartedAt: existing.billingStartedAt ?? new Date() }
            : { billingStartedAt: existing.billingStartedAt, ...(existing.trialEndsAt ? {} : { trialEndsAt }) })
        };
        await tx.subscription.update({ where: { id: existing.id }, data: update });
      } else {
        await tx.subscription.create({
          data: {
            userId,
            providerSubscriptionId,
            ...fields,
            trialEndsAt,
            billingStartedAt: isRenewed ? new Date() : null
          }
        });
      }

      await tx.billingEvent.create({ data: { webhookId, eventType: event.type } });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      logger.debug({ webhookId, type: event.type }, 'duplicate billing webhook (unique violation)');
      return;
    }
    logger.error({ err: err instanceof Error ? err.message : String(err), type: event.type, providerSubscriptionId }, 'billing webhook processing failed');
  }

  logger.info({ providerSubscriptionId, userId, status: dbStatus, type: event.type }, 'billing subscription synced');
}