import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBillingStatus, useCancelSubscription } from '../hooks/queries';
import { formatDateTimeLocal, formatMoney } from '../lib/format';
import { Spinner } from '../components/Spinner';
import { SkeletonRow } from '../components/Skeleton';
import { useErrorToast } from '../components/Toast';
import ConfirmSheet from '../components/ConfirmSheet';
import type { SubscriptionStatus } from '../lib/types';
import scheduleImage from '../../public/assets/not-found.png';

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  FAILED: 'Failed',
};

function getStatusClass(status: SubscriptionStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'status-active';
    case 'ON_HOLD':
      return 'status-on-hold';
    case 'CANCELLED':
      return 'status-cancelled';
    case 'EXPIRED':
      return 'status-expired';
    case 'FAILED':
      return 'status-failed';
    default:
      return '';
  }
}

export default function SubscriptionsPage() {
  const billing = useBillingStatus();
  const cancelSub = useCancelSubscription();

  const [cancelError, setCancelError] = useState('');
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useErrorToast(cancelError);

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
    <div className="ios-page">
      {/* iOS Navigation Bar */}
      <header className="ios-nav-bar mt-5">
        <div className="ios-nav-left">
          <Link to="/settings" className="ios-back-button">
            Settings
          </Link>
        </div>
        <h1 className="ios-nav-title">Subscriptions</h1>
        <div className="ios-nav-right" />
      </header>

      {/* Main Content Area */}
      <main className="ios-content">
        <section className="ios-section">
          <div
            className={`ios-group ${billing.isLoading ? 'skeleton-area' : ''}`}
            aria-busy={billing.isLoading}
          >
            {billing.isLoading ? (
              <>
                <SkeletonRow />
                <div className="ios-row-divider" />
                <SkeletonRow />
                <div className="ios-row-divider" />
                <SkeletonRow />
              </>
            ) : !b || (!b.status && b.mode === 'none') ? (
              <div className="ios-empty-state">
                <img
                  src={scheduleImage}
                  alt="No subscriptions icon"
                  className="ios-empty-img"
                />
                <div className="ios-empty-text">No Subscriptions Found</div>
              </div>
            ) : (
              <>
                {/* Status */}
                {b.status && (
                  <>
                    <div className="ios-row">
                      <span className="ios-row-label">Status</span>
                      <div className="ios-row-value">
                        <span
                          className={`ios-status-badge ${getStatusClass(
                            b.status
                          )}`}
                        >
                          <span className="ios-status-dot" />
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </div>
                    </div>
                    <div className="ios-row-divider" />
                  </>
                )}

                {/* Plan */}
                {planLabel && (
                  <>
                    <div className="ios-row">
                      <span className="ios-row-label">Plan</span>
                      <div className="ios-row-value">
                        <strong>{planLabel}</strong>
                        <span className="ios-interval">{intervalLabel}</span>
                      </div>
                    </div>
                    <div className="ios-row-divider" />
                  </>
                )}

                {/* Billing period */}
                {b.currentPeriodEnd && (
                  <>
                    <div className="ios-row">
                      <span className="ios-row-label">
                        {b.cancelAtPeriodEnd ? 'Access until' : 'Next billing'}
                      </span>
                      <span className="ios-row-value">
                        {formatDateTimeLocal(b.currentPeriodEnd)}
                      </span>
                    </div>
                    <div className="ios-row-divider" />
                  </>
                )}

                {/* Trial */}
                {b.trial?.endsAt && b.mode === 'trial' && (
                  <>
                    <div className="ios-row">
                      <span className="ios-row-label">Trial ends</span>
                      <span className="ios-row-value">
                        {formatDateTimeLocal(b.trial.endsAt)}
                      </span>
                    </div>
                    <div className="ios-row-divider" />
                  </>
                )}

                {/* Provider subscription ID */}
                {b.providerSubscriptionId && (
                  <div className="ios-row">
                    <span className="ios-row-label">Subscription ID</span>
                    <span className="ios-row-value ios-mono">
                      {b.providerSubscriptionId}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Row Outside or Inside Grouped List */}
          {!billing.isLoading && b && (
            <>
              {b.status === 'ACTIVE' && !b.cancelAtPeriodEnd ? (
                <div className="ios-group ios-action-group">
                  <button
                    type="button"
                    className="ios-button-danger"
                    disabled={cancelSub.isPending}
                    onClick={() => setConfirmingCancel(true)}
                  >
                    {cancelSub.isPending ? <Spinner /> : 'Cancel Subscription'}
                  </button>
                </div>
              ) : b.cancelAtPeriodEnd ? (
                <div className="ios-footer-caption " >
                  Subscription cancels at the end of the current billing period.
                </div>
              ) : null}
            </>
          )}

        </section>
      </main>

      <ConfirmSheet
        open={confirmingCancel}
        title="Cancel subscription"
        message="You'll keep access until the end of the current billing period, then your reminders will stop calling."
        confirmLabel="Cancel subscription"
        tone="destructive"
        busy={cancelSub.isPending}
        onConfirm={() => void doCancel()}
        onCancel={() => setConfirmingCancel(false)}
      />

      <style>{`
        :root {
          --ios-bg: #F2F2F7;
          --ios-card-bg: #FFFFFF;
          --ios-text: #000000;
          --ios-secondary-text: #3C3C4399;
          --ios-divider: #C6C6C8;
          --ios-link: #007AFF;
          --ios-red: #FF3B30;
          --ios-green: #34C759;
          --ios-orange: #FF9500;
          --ios-gray: #8E8E93;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --ios-bg: #000000;
            --ios-card-bg: #1C1C1E;
            --ios-text: #FFFFFF;
            --ios-secondary-text: #EBEBF599;
            --ios-divider: #38383A;
            --ios-link: #0A84FF;
            --ios-red: #FF453A;
            --ios-green: #30D158;
            --ios-orange: #FF9F0A;
            --ios-gray: #8E8E93;
          }
        }

        .ios-page {
          background-color: var(--ios-bg);
          color: var(--ios-text);
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          padding-bottom: 30px;
        }

        /* Nav Bar */
        .ios-nav-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 44px;
          padding: 0 16px;
          background-color: var(--ios-bg);
          border-bottom: 0.5px solid var(--ios-divider);
        }

        .ios-nav-left, .ios-nav-right {
          flex: 1;
        }

        .ios-nav-right {
          text-align: right;
        }

        .ios-back-button {
          color: var(--ios-link);
          text-decoration: none;
          font-size: 17px;
          display: inline-flex;
          align-items: center;
        }

        .ios-back-button::before {
          content: '‹';
          font-size: 24px;
          margin-right: 4px;
          margin-top: -2px;
        }

        .ios-nav-title {
          font-size: 17px;
          font-weight: 600;
          margin: 0;
          text-align: center;
          white-space: nowrap;
        }

        /* Content */
        .ios-content {
          padding: 16px;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Grouped Card */
        .ios-group {
          background-color: var(--ios-card-bg);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .ios-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px;
          font-size: 16px;
          min-height: 44px;
          box-sizing: border-box;
        }

        .ios-row-label {
          color: var(--ios-text);
        }

        .ios-row-value {
          color: var(--ios-secondary-text);
          text-align: right;
        }

        .ios-interval {
          font-size: 14px;
          margin-left: 2px;
        }

        .ios-mono {
          font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 14px;
        }

        .ios-row-divider {
          height: 0.5px;
          background-color: var(--ios-divider);
          margin-left: 16px;
        }

        /* Status Badge */
        .ios-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 500;
        }

        .ios-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-active { color: var(--ios-green); }
        .status-active .ios-status-dot { background-color: var(--ios-green); }

        .status-on-hold, .status-expired { color: var(--ios-orange); }
        .status-on-hold .ios-status-dot, .status-expired .ios-status-dot { background-color: var(--ios-orange); }

        .status-cancelled, .status-failed { color: var(--ios-red); }
        .status-cancelled .ios-status-dot, .status-failed .ios-status-dot { background-color: var(--ios-red); }

        /* Action Group */
        .ios-action-group {
          margin-top: 24px;
        }

        .ios-button-danger {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--ios-red);
          font-size: 17px;
          font-weight: 400;
          padding: 12px 16px;
          text-align: center;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ios-button-danger:active {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .ios-button-danger:disabled {
          opacity: 0.5;
        }

        /* Empty State */
        .ios-empty-state {
          padding: 32px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .ios-empty-img {
          height: 80px;
          width: auto;
          opacity: 0.4;
        }

        .ios-empty-text {
          color: var(--ios-secondary-text);
          font-size: 15px;
        }

        /* Footer Captions & Notes */
        .ios-footer-caption {
          font-size: 13px;
          color: var(--ios-secondary-text);
          padding: 0 16px;
          margin-top: 6px;
          margin-bottom: 16px;
        }

        .ios-footer-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          color: var(--ios-secondary-text);
          margin-top: 32px;
          text-transform: uppercase;
          letter-spacing: -0.2px;
        }

        .ios-bullet {
          font-size: 8px;
        }
      `}</style>
    </div>
  );
}