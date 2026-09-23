import { describe, expect, it } from 'vitest';
import { subscriptionGrantsAccess } from '../src/services/billingService';
import type { SubscriptionStatus } from '@prisma/client';

const BASE: {
  billingStartedAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  trialCallsUsed: number;
} = {
  billingStartedAt: null,
  trialEndsAt: null,
  currentPeriodEnd: null,
  trialCallsUsed: 0
};

function sub(overrides: Partial<typeof BASE> & { status: SubscriptionStatus }) {
  return { ...BASE, ...overrides };
}

const now = new Date('2026-09-23T12:00:00Z');
const inFuture = new Date('2026-10-01T12:00:00Z');
const inPast = new Date('2026-01-01T12:00:00Z');

describe('subscriptionGrantsAccess', () => {
  it('denies when there is no subscription', () => {
    expect(subscriptionGrantsAccess(null as never, now)).toBe(false);
  });

  it('denies on hold, failed, and expired', () => {
    for (const status of ['ON_HOLD', 'FAILED', 'EXPIRED'] as SubscriptionStatus[]) {
      expect(subscriptionGrantsAccess(sub({ status }), now)).toBe(false);
    }
  });

  it('allows a paid active subscription', () => {
    expect(subscriptionGrantsAccess(sub({ status: 'ACTIVE', billingStartedAt: inPast }), now)).toBe(true);
  });

  it('denies a paid cancelled subscription after the period end', () => {
    expect(subscriptionGrantsAccess(sub({ status: 'CANCELLED', billingStartedAt: inPast, currentPeriodEnd: inPast }), now)).toBe(false);
  });

  it('keeps access for cancelled-at-period-end while the period is current', () => {
    expect(subscriptionGrantsAccess(sub({ status: 'CANCELLED', billingStartedAt: inPast, currentPeriodEnd: inFuture }), now)).toBe(true);
  });

  it('denies a paid on-hold subscription even with a future period end', () => {
    expect(subscriptionGrantsAccess(sub({ status: 'ON_HOLD', billingStartedAt: inPast, currentPeriodEnd: inFuture }), now)).toBe(false);
  });

  it('allows an active trial subscription before the trial expires', () => {
    expect(subscriptionGrantsAccess(sub({ status: 'ACTIVE', trialEndsAt: inFuture, trialCallsUsed: 1 }), now)).toBe(true);
  });

  it('denies a trial that has expired', () => {
    expect(subscriptionGrantsAccess(sub({ status: 'ACTIVE', trialEndsAt: inPast }), now)).toBe(false);
  });

  it('denies a trial that exhausted its call limit', () => {
    expect(subscriptionGrantsAccess(sub({ status: 'ACTIVE', trialEndsAt: inFuture, trialCallsUsed: 2 }), now)).toBe(false);
  });

  it('allows a trial up to the call cap in calls used', () => {
    expect(subscriptionGrantsAccess(sub({ status: 'ACTIVE', trialEndsAt: inFuture, trialCallsUsed: 1 }), now)).toBe(true);
  });

  it('does not treat per-period-end as access for a cancelled trial', () => {
    expect(subscriptionGrantsAccess(sub({ status: 'CANCELLED', currentPeriodEnd: inFuture }), now)).toBe(false);
  });
});