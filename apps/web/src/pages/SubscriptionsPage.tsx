import { useState } from 'react';
import { useBillingStatus, useCancelSubscription } from '../hooks/queries';
import { formatDateTimeLocal, formatMoney } from '../lib/format';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { iosTheme } from './iosTheme';
import type { SubscriptionStatus } from '../lib/types';

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  FAILED: 'Failed'
};

function getStatusClass(status: SubscriptionStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'active';

    case 'ON_HOLD':
      return 'on-hold';

    case 'CANCELLED':
      return 'cancelled';

    case 'EXPIRED':
      return 'expired';

    case 'FAILED':
      return 'failed';

    default:
      return '';
  }
}

export default function SubscriptionsPage() {
  const billing = useBillingStatus();
  const cancelSub = useCancelSubscription();

  const [cancelError, setCancelError] = useState('');

  async function doCancel() {
    setCancelError('');

    try {
      await cancelSub.mutateAsync();
    } catch (e) {
      setCancelError(
        e instanceof Error ? e.message : 'Could not cancel your subscription'
      );
    }
  }

  const b = billing.data;

  const planLabel = b ? formatMoney(b.amountMinorUnits, b.currency) : '';

  const intervalLabel = b?.interval ? `/${b.interval.toLowerCase()}` : '';

  return (
    <section className="ios-settings-page">
      <div className="ios-settings-container">
        {/* Header */}
        <header className="ios-settings-header">
          <div className="ios-settings-eyebrow">SUBSCRIPTION</div>

          <h1>Subscriptions</h1>
        </header>

        {/* =========================================
            SUBSCRIPTION
        ========================================== */}
        <section className="ios-settings-section">
          <div className="ios-section-label">SUBSCRIPTION</div>

          <div className="ios-settings-card">
            {billing.isLoading ? (
              <div className="ios-loading-row">
                <Spinner label="Loading subscription…" />
              </div>
            ) : !b || (!b.status && b.mode === 'none') ? (
              <div className="ios-no-subscription">
                <div className="ios-subscription-icon">
                  <span>★</span>
                </div>

                <div>
                  <div className="ios-no-subscription-title">
                    No subscription yet
                  </div>

                  <div className="ios-no-subscription-description">
                    Your subscription details will appear here.
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Status */}
                {b.status && (
                  <>
                    <div className="ios-setting-row">
                      <div className="ios-row-leading">
                        <div className="ios-setting-icon green">
                          <span>✓</span>
                        </div>

                        <div className="ios-row-title">Status</div>
                      </div>

                      <div className="ios-row-value">
                        <span
                          className={`ios-status-pill ${getStatusClass(
                            b.status
                          )}`}
                        >
                          <span className="ios-status-dot" />
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </div>
                    </div>

                    <div className="ios-divider" />
                  </>
                )}

                {/* Plan */}
                {planLabel && (
                  <>
                    <div className="ios-setting-row">
                      <div className="ios-row-leading">
                        <div className="ios-setting-icon blue">
                          <span>▣</span>
                        </div>

                        <div className="ios-row-title">Plan</div>
                      </div>

                      <div className="ios-row-value ios-plan-value">
                        <strong>{planLabel}</strong>
                        {intervalLabel}
                      </div>
                    </div>

                    <div className="ios-divider" />
                  </>
                )}

                {/* Billing period */}
                {b.currentPeriodEnd && (
                  <>
                    <div className="ios-setting-row">
                      <div className="ios-row-leading">
                        <div className="ios-setting-icon orange">
                          <span>◷</span>
                        </div>

                        <div className="ios-row-title">
                          {b.cancelAtPeriodEnd
                            ? 'Access until'
                            : 'Next billing'}
                        </div>
                      </div>

                      <div className="ios-row-value">
                        {formatDateTimeLocal(b.currentPeriodEnd)}
                      </div>
                    </div>

                    <div className="ios-divider" />
                  </>
                )}

                {/* Trial */}
                {b.trial?.endsAt && b.mode === 'trial' && (
                  <>
                    <div className="ios-setting-row">
                      <div className="ios-row-leading">
                        <div className="ios-setting-icon purple">
                          <span>◇</span>
                        </div>

                        <div className="ios-row-title">Trial ends</div>
                      </div>

                      <div className="ios-row-value">
                        {formatDateTimeLocal(b.trial.endsAt)}
                      </div>
                    </div>

                    <div className="ios-divider" />
                  </>
                )}

                {/* Provider subscription ID */}
                {b.providerSubscriptionId && (
                  <div className="ios-setting-row ios-setting-row-top">
                    <div className="ios-row-leading">
                      <div className="ios-setting-icon gray">
                        <span>#</span>
                      </div>

                      <div className="ios-row-title">Subscription ID</div>
                    </div>

                    <div className="ios-row-value ios-mono">
                      {b.providerSubscriptionId}
                    </div>
                  </div>
                )}

                {/* Cancel */}
                {b.status === 'ACTIVE' && !b.cancelAtPeriodEnd ? (
                  <div className="ios-subscription-action">
                    <button
                      type="button"
                      className="btn btn-danger-outline"
                      disabled={cancelSub.isPending}
                      onClick={() => void doCancel()}
                    >
                      {cancelSub.isPending ? (
                        <Spinner />
                      ) : (
                        'Cancel subscription'
                      )}
                    </button>
                  </div>
                ) : b.cancelAtPeriodEnd ? (
                  <div className="ios-inline-notice">
                    <span className="ios-inline-notice-icon">✓</span>

                    <span>
                      Subscription cancels at the end of the current
                      billing period.
                    </span>
                  </div>
                ) : null}

                {cancelError && (
                  <div className="ios-cancel-error">
                    <ErrorBanner message={cancelError} />
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <div className="ios-footer-note">
          <span>Subscriptions</span>
          <span>•</span>
          <span>Plan &amp; Billing</span>
        </div>
      </div>

      <style>{iosTheme}</style>
    </section>
  );
}