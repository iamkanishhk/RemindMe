import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/react';
import {
  useCancelSubscription,
  useDeleteMe,
  useMe,
  useBillingStatus
} from '../hooks/queries';
import { formatDateTimeLocal, formatMoney } from '../lib/format';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import type { SubscriptionStatus } from '../lib/types';

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  FAILED: 'Failed'
};

export default function SettingsPage() {
  const me = useMe();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const deleteMe = useDeleteMe();
  const billing = useBillingStatus();
  const cancelSub = useCancelSubscription();

  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [cancelError, setCancelError] = useState('');

  async function doSignOut() {
    setSigningOut(true);

    try {
      await signOut();
      navigate('/sign-in', { replace: true });
    } catch {
      setSigningOut(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    setError('');

    try {
      await deleteMe.mutateAsync();
      await signOut();
      navigate('/sign-in', { replace: true });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not delete your account'
      );
      setBusy(false);
    }
  }

  async function doCancel() {
    setCancelError('');

    try {
      await cancelSub.mutateAsync();
    } catch (e) {
      setCancelError(
        e instanceof Error
          ? e.message
          : 'Could not cancel your subscription'
      );
    }
  }

  const confirmed =
    confirmText.trim().toLowerCase() === 'delete';

  const b = billing.data;

  const planLabel = b
    ? formatMoney(b.amountMinorUnits, b.currency)
    : '';

  const intervalLabel = b?.interval
    ? `/${b.interval.toLowerCase()}`
    : '';

  return (
    <section className="ios-settings-page">
      <div className="ios-settings-container">
        {/* Header */}
        <header className="ios-settings-header">
          <div className="ios-settings-eyebrow">
            ACCOUNT
          </div>

          <h1>Settings</h1>
        </header>

        {/* Global error */}
        {error && (
          <div className="ios-global-error">
            <ErrorBanner message={error} />
          </div>
        )}

        {/* =========================================
            ACCOUNT
        ========================================== */}
        <section className="ios-settings-section">
          <div className="ios-section-label">
            ACCOUNT
          </div>

          <div className="ios-settings-card">
            {me.isLoading ? (
              <div className="ios-loading-row">
                <Spinner label="Loading account…" />
              </div>
            ) : (
              <>
                {/* Email */}
                <div className="ios-setting-row">
                  <div className="ios-row-leading">
                    <div className="ios-setting-icon blue">
                      <span>✉</span>
                    </div>

                    <div className="ios-row-title">
                      Email
                    </div>
                  </div>

                  <div className="ios-row-value">
                    {me.data?.email ?? '—'}
                  </div>
                </div>

                <div className="ios-divider" />

                {/* User ID */}
                <div className="ios-setting-row ios-setting-row-top">
                  <div className="ios-row-leading">
                    <div className="ios-setting-icon purple">
                      <span>◎</span>
                    </div>

                    <div className="ios-row-title">
                      User ID
                    </div>
                  </div>

                  <div className="ios-row-value ios-mono">
                    {me.data?.id ?? '—'}
                  </div>
                </div>

                <div className="ios-divider" />

                {/* Reminders */}
                <div className="ios-setting-row">
                  <div className="ios-row-leading">
                    <div className="ios-setting-icon orange">
                      <span>◷</span>
                    </div>

                    <div className="ios-row-title">
                      Reminders
                    </div>
                  </div>

                  <div className="ios-row-value">
                    {me.data?.counts.reminders ?? 0}
                  </div>
                </div>

                <div className="ios-divider" />

                {/* Phone numbers */}
                <div className="ios-setting-row">
                  <div className="ios-row-leading">
                    <div className="ios-setting-icon green">
                      <span>☎</span>
                    </div>

                    <div className="ios-row-title">
                      Phone numbers
                    </div>
                  </div>

                  <div className="ios-row-value">
                    {me.data?.counts.phoneNumbers ?? 0}
                  </div>
                </div>

                <div className="ios-divider" />

                {/* Member since */}
                <div className="ios-setting-row">
                  <div className="ios-row-leading">
                    <div className="ios-setting-icon gray">
                      <span>＋</span>
                    </div>

                    <div className="ios-row-title">
                      Member since
                    </div>
                  </div>

                  <div className="ios-row-value">
                    {me.data?.createdAt
                      ? formatDateTimeLocal(
                          me.data.createdAt
                        )
                      : '—'}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* =========================================
            SUBSCRIPTION
        ========================================== */}
        <section className="ios-settings-section">
          <div className="ios-section-label">
            SUBSCRIPTION
          </div>

          <div className="ios-settings-card">
            {billing.isLoading ? (
              <div className="ios-loading-row">
                <Spinner label="Loading subscription…" />
              </div>
            ) : !b ||
              (!b.status && b.mode === 'none') ? (
              <div className="ios-no-subscription">
                <div className="ios-subscription-icon">
                  <span>★</span>
                </div>

                <div>
                  <div className="ios-no-subscription-title">
                    No subscription yet
                  </div>

                  <div className="ios-no-subscription-description">
                    Your subscription details will appear
                    here.
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

                        <div className="ios-row-title">
                          Status
                        </div>
                      </div>

                      <div className="ios-row-value">
                        <span
                          className={`ios-status-pill ${getStatusClass(
                            b.status
                          )}`}
                        >
                          <span className="ios-status-dot" />
                          {STATUS_LABEL[b.status] ??
                            b.status}
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

                        <div className="ios-row-title">
                          Plan
                        </div>
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
                        {formatDateTimeLocal(
                          b.currentPeriodEnd
                        )}
                      </div>
                    </div>

                    <div className="ios-divider" />
                  </>
                )}

                {/* Trial */}
                {b.trial?.endsAt &&
                  b.mode === 'trial' && (
                    <>
                      <div className="ios-setting-row">
                        <div className="ios-row-leading">
                          <div className="ios-setting-icon purple">
                            <span>◇</span>
                          </div>

                          <div className="ios-row-title">
                            Trial ends
                          </div>
                        </div>

                        <div className="ios-row-value">
                          {formatDateTimeLocal(
                            b.trial.endsAt
                          )}
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

                      <div className="ios-row-title">
                        Subscription ID
                      </div>
                    </div>

                    <div className="ios-row-value ios-mono">
                      {b.providerSubscriptionId}
                    </div>
                  </div>
                )}

                {/* Cancel */}
                {b.status === 'ACTIVE' &&
                !b.cancelAtPeriodEnd ? (
                  <div className="ios-subscription-action">
    <button
                type="button"
                className="btn btn-danger-outline"
                disabled={cancelSub.isPending}
                onClick={() => void doCancel()}
              >
                {cancelSub.isPending ? <Spinner /> : 'Cancel subscription'}
              </button>
</div>
                ) : b.cancelAtPeriodEnd ? (
                  <div className="ios-inline-notice">
                    <span className="ios-inline-notice-icon">
                      ✓
                    </span>

                    <span>
                      Subscription cancels at the end of
                      the current billing period.
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

        {/* =========================================
            SESSION
        ========================================== */}
        <section className="ios-settings-section">
          <div className="ios-section-label">
            SESSION
          </div>

          <div className="ios-settings-card">
            <div className="ios-setting-row">
              <div className="ios-row-leading">
                <div className="ios-setting-icon blue">
                  <span>⎋</span>
                </div>

                <div className="ios-row-title">
                  Sign out
                </div>
              </div>

              <div className="ios-row-value">
                <button
                  type="button"
                  className="ios-signout-button"
                  disabled={signingOut}
                  onClick={() => void doSignOut()}
                >
                  {signingOut ? <Spinner /> : 'Sign out'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            DANGER ZONE
        ========================================== */}
        <section className="ios-settings-section danger-section">
          <div className="ios-section-label danger-label">
            DANGER ZONE
          </div>

          <div className="ios-danger-card">
            <div className="ios-danger-header">
              <div className="ios-danger-icon">
                <span>!</span>
              </div>

              <div>
                <h2>Delete account</h2>

                <p>
                  Deleting your account permanently removes
                  your phone numbers and reminder history.
                </p>
              </div>
            </div>

            <div className="ios-delete-confirm">
              <label
                htmlFor="delete-confirm"
                className="ios-input-label"
              >
                Confirmation
              </label>

              <input
                id="delete-confirm"
                type="text"
                value={confirmText}
                onChange={(e) =>
                  setConfirmText(e.target.value)
                }
                placeholder="type 'delete'"
                autoComplete="off"
                spellCheck={false}
              />

              <div className="ios-input-hint">
                Type <code>delete</code> to confirm.
              </div>
            </div>

            <button
              type="button"
              className="ios-delete-button"
              disabled={!confirmed || busy}
              onClick={() => void doDelete()}
            >
              {busy ? (
                <Spinner />
              ) : (
                <>
                  <span className="ios-delete-icon">
                    ⌫
                  </span>
                  Delete my account
                </>
              )}
            </button>
          </div>
        </section>

        <div className="ios-footer-note">
          <span>Settings</span>
          <span>•</span>
          <span>Account &amp; Subscription</span>
        </div>
      </div>

      <style>{`
        :root {
          color-scheme: dark;

          --ios-black: #000000;
          --ios-card: #1c1c1e;
          --ios-card-elevated: #2c2c2e;

          --ios-text: #f5f5f7;
          --ios-secondary: #98989f;
          --ios-tertiary: #636366;

          --ios-separator: rgba(84, 84, 88, 0.55);

          --ios-blue: #0a84ff;
          --ios-green: #30d158;
          --ios-orange: #ff9f0a;
          --ios-red: #ff453a;
          --ios-purple: #bf5af2;
          --ios-pink: #ff375f;
          --ios-cyan: #64d2ff;
        }

        .ios-settings-page {
          min-height: 100vh;
          width: 100%;

          background:
            radial-gradient(
              ellipse 850px 450px at 50% -150px,
              rgba(55, 55, 60, 0.28),
              transparent 70%
            ),
            var(--ios-black);

          color: var(--ios-text);

          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "SF Pro Display",
            "SF Pro Text",
            system-ui,
            sans-serif;

          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;

          box-sizing: border-box;
        }

        .ios-settings-page *,
        .ios-settings-page *::before,
        .ios-settings-page *::after {
          box-sizing: border-box;
        }

        .ios-settings-container {
          width: min(100% - 32px, 720px);

          margin: 0 auto;

          padding: 36px 0 150px;
        }

        /* =========================================
           HEADER
        ========================================== */

        .ios-settings-header {
          margin-bottom: 34px;
        }

        .ios-settings-eyebrow {
          margin-bottom: 8px;

          color: var(--ios-secondary);

          font-size: 12px;
          line-height: 1;

          font-weight: 600;
          letter-spacing: 0.07em;

          text-transform: uppercase;
        }

        .ios-settings-header h1 {
          margin: 0;

          color: var(--ios-text);

          font-size: clamp(36px, 6vw, 46px);
          line-height: 1.05;

          font-weight: 700;

          letter-spacing: -0.045em;
        }

        /* =========================================
           SECTIONS
        ========================================== */

        .ios-settings-section {
          margin-top: 30px;
        }

        .ios-section-label {
          padding: 0 16px 9px;

          color: var(--ios-secondary);

          font-size: 12px;
          line-height: 1;

          font-weight: 600;
          letter-spacing: 0.06em;

          text-transform: uppercase;
        }

        .ios-settings-card {
          overflow: hidden;

          background: var(--ios-card);

          border-radius: 17px;

          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.025),
            0 8px 30px rgba(0, 0, 0, 0.15);
        }

        /* =========================================
           SETTING ROW
        ========================================== */

        .ios-setting-row {
          min-height: 62px;

          padding: 10px 17px;

          display: grid;

          grid-template-columns:
            minmax(150px, 0.8fr)
            minmax(0, 1.4fr);

          align-items: center;

          gap: 20px;
        }

        .ios-setting-row-top {
          align-items: start;
        }

        .ios-row-leading {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 12px;
        }

        .ios-row-title {
          color: var(--ios-text);

          font-size: 16px;
          line-height: 1.35;

          font-weight: 400;

          letter-spacing: -0.01em;
        }

        .ios-row-value {
          min-width: 0;

          color: var(--ios-secondary);

          text-align: right;

          font-size: 15px;
          line-height: 1.4;

          overflow-wrap: anywhere;
        }

        .ios-plan-value {
          color: var(--ios-text);
        }

        .ios-plan-value strong {
          font-weight: 600;
        }

        .ios-mono {
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;

          font-size: 12px;
        }

        .ios-divider {
          height: 1px;

          margin-left: 70px;

          background: var(--ios-separator);
        }

        /* =========================================
           ICONS
        ========================================== */

        .ios-setting-icon {
          width: 30px;
          height: 30px;

          flex: 0 0 30px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          font-size: 13px;
          font-weight: 700;
        }

        .ios-setting-icon.blue {
          color: var(--ios-blue);
          background: rgba(10, 132, 255, 0.17);
        }

        .ios-setting-icon.green {
          color: var(--ios-green);
          background: rgba(48, 209, 88, 0.17);
        }

        .ios-setting-icon.orange {
          color: var(--ios-orange);
          background: rgba(255, 159, 10, 0.17);
        }

        .ios-setting-icon.purple {
          color: var(--ios-purple);
          background: rgba(191, 90, 242, 0.17);
        }

        .ios-setting-icon.gray {
          color: #aeaeb2;
          background: rgba(142, 142, 147, 0.16);
        }

        /* =========================================
           STATUS
        ========================================== */

        .ios-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          min-height: 27px;

          padding: 4px 9px;

          border-radius: 999px;

          font-size: 13px;
          font-weight: 600;

          white-space: nowrap;
        }

        .ios-status-pill.active {
          color: var(--ios-green);
          background: rgba(48, 209, 88, 0.12);
        }

        .ios-status-pill.on-hold {
          color: var(--ios-orange);
          background: rgba(255, 159, 10, 0.12);
        }

        .ios-status-pill.cancelled,
        .ios-status-pill.expired {
          color: var(--ios-secondary);
          background: rgba(142, 142, 147, 0.13);
        }

        .ios-status-pill.failed {
          color: var(--ios-red);
          background: rgba(255, 69, 58, 0.12);
        }

        .ios-status-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: currentColor;
        }

        /* =========================================
           NO SUBSCRIPTION
        ========================================== */

        .ios-no-subscription {
          min-height: 84px;

          padding: 17px;

          display: flex;
          align-items: center;

          gap: 13px;
        }

        .ios-subscription-icon {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          color: var(--ios-blue);
          background: rgba(10, 132, 255, 0.14);

          font-size: 16px;
        }

        .ios-no-subscription-title {
          color: var(--ios-text);

          font-size: 16px;
          font-weight: 500;
        }

        .ios-no-subscription-description {
          margin-top: 3px;

          color: var(--ios-secondary);

          font-size: 13px;
          line-height: 1.4;
        }

        /* =========================================
           SUBSCRIPTION ACTION
        ========================================== */

        .ios-subscription-action {
          display: flex;
          justify-content: flex-end;

          padding: 15px 17px 17px;
        }

        .ios-subscription-action > * {
          max-width: 100%;
        }

        .ios-liquid-button-content {
          min-height: 42px;

          padding: 0 17px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          color: var(--ios-red);

          font-family: inherit;

          font-size: 15px;
          font-weight: 600;

          cursor: pointer;
          user-select: none;
        }

        .ios-liquid-icon {
          width: 19px;
          height: 19px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          border: 1.5px solid currentColor;

          font-size: 16px;
          line-height: 15px;
          font-weight: 400;
        }

        /* =========================================
           CANCELLED NOTICE
        ========================================== */

        .ios-inline-notice {
          margin: 0 17px 17px;

          padding: 11px 12px;

          display: flex;
          align-items: flex-start;

          gap: 9px;

          border-radius: 11px;

          color: var(--ios-secondary);
          background: rgba(142, 142, 147, 0.09);

          font-size: 13px;
          line-height: 1.4;
        }

        .ios-inline-notice-icon {
          flex: 0 0 auto;

          color: var(--ios-green);

          font-weight: 700;
        }

        /* =========================================
           CANCEL ERROR
        ========================================== */

        .ios-cancel-error {
          padding: 0 17px 17px;
        }

        /* =========================================
           SIGN OUT
        ========================================== */

        .ios-signout-button {
          min-height: 34px;

          padding: 0 14px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 6px;

          border: 1px solid rgba(10, 132, 255, 0.35);
          border-radius: 10px;

          background: rgba(10, 132, 255, 0.12);
          color: var(--ios-blue);

          font-family: inherit;
          font-size: 14px;
          font-weight: 600;

          cursor: pointer;

          transition:
            background 0.15s ease,
            transform 0.12s ease;
        }

        .ios-signout-button:hover:not(:disabled) {
          background: rgba(10, 132, 255, 0.2);
        }

        .ios-signout-button:active:not(:disabled) {
          transform: scale(0.97);
        }

        .ios-signout-button:disabled {
          opacity: 0.6;
          cursor: default;
        }

        /* =========================================
           DANGER ZONE
        ========================================== */

        .danger-section {
          margin-top: 38px;
        }

        .danger-label {
          color: var(--ios-red);
        }

        .ios-danger-card {
          overflow: hidden;

          background: rgba(255, 69, 58, 0.055);

          border: 1px solid rgba(255, 69, 58, 0.13);

          border-radius: 17px;
        }

        .ios-danger-header {
          display: flex;
          align-items: flex-start;

          gap: 13px;

          padding: 18px 17px 17px;
        }

        .ios-danger-icon {
          width: 36px;
          height: 36px;

          flex: 0 0 36px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background: rgba(255, 69, 58, 0.14);
          color: var(--ios-red);

          font-size: 17px;
          font-weight: 700;
        }

        .ios-danger-header h2 {
          margin: 0;

          color: var(--ios-text);

          font-size: 17px;
          line-height: 1.25;

          font-weight: 600;

          letter-spacing: -0.015em;
        }

        .ios-danger-header p {
          margin: 5px 0 0;

          color: var(--ios-secondary);

          font-size: 13px;
          line-height: 1.5;
        }

        .ios-delete-confirm {
          padding: 0 17px 17px;
        }

        .ios-input-label {
          display: block;

          margin-bottom: 7px;

          color: var(--ios-secondary);

          font-size: 12px;
          font-weight: 600;

          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .ios-delete-confirm input {
          width: 100%;
          height: 48px;

          padding: 0 14px;

          border: 1px solid rgba(255, 255, 255, 0.08);
          outline: none;

          border-radius: 11px;

          background: rgba(0, 0, 0, 0.28);
          color: var(--ios-text);

          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;

          font-size: 15px;

          box-shadow:
            inset 0 1px 2px rgba(0, 0, 0, 0.25);

          transition:
            border-color 0.15s ease,
            background 0.15s ease,
            box-shadow 0.15s ease;
        }

        .ios-delete-confirm input::placeholder {
          color: var(--ios-tertiary);
        }

        .ios-delete-confirm input:focus {
          border-color: rgba(255, 69, 58, 0.55);

          background: rgba(0, 0, 0, 0.4);

          box-shadow:
            0 0 0 3px rgba(255, 69, 58, 0.1);
        }

        .ios-input-hint {
          margin-top: 7px;

          color: var(--ios-tertiary);

          font-size: 12px;
        }

        .ios-input-hint code {
          color: var(--ios-secondary);

          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;
        }

        .ios-delete-button {
          width: calc(100% - 34px);

          min-height: 46px;

          margin: 0 17px 17px;

          border: 0;
          border-radius: 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          background: var(--ios-red);
          color: white;

          font-family: inherit;

          font-size: 15px;
          font-weight: 600;

          cursor: pointer;

          transition:
            transform 0.12s ease,
            opacity 0.15s ease,
            background 0.15s ease;
        }

        .ios-delete-button:hover:not(:disabled) {
          background: #ff554d;
        }

        .ios-delete-button:active:not(:disabled) {
          transform: scale(0.985);
        }

        .ios-delete-button:disabled {
          opacity: 0.35;

          cursor: default;
        }

        .ios-delete-icon {
          font-size: 17px;
        }

        /* =========================================
           LOADING
        ========================================== */

        .ios-loading-row {
          min-height: 100px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;
        }

        /* =========================================
           GLOBAL ERROR
        ========================================== */

        .ios-global-error {
          margin-bottom: 22px;

          overflow: hidden;

          border-radius: 15px;
        }

        /* =========================================
           FOOTER
        ========================================== */

        .ios-footer-note {
          padding: 25px 0 0;

          display: flex;
          justify-content: center;
          align-items: center;

          gap: 7px;

          color: var(--ios-tertiary);

          font-size: 11px;

          letter-spacing: 0.01em;
        }

        /* =========================================
           TABLET
        ========================================== */

        @media (max-width: 650px) {
          .ios-settings-container {
            width: min(100% - 24px, 720px);

            padding-top: 25px;
          }

          .ios-setting-row {
            grid-template-columns:
              minmax(130px, 0.75fr)
              minmax(0, 1.25fr);

            gap: 14px;
          }

          .ios-row-value {
            font-size: 14px;
          }
        }

        /* =========================================
           MOBILE
        ========================================== */

        @media (max-width: 480px) {
          .ios-settings-container {
            width: min(100% - 20px, 720px);

            padding-top: 19px;
            padding-bottom: 150px;
          }

          .ios-settings-header {
            margin-bottom: 27px;
          }

          .ios-settings-header h1 {
            font-size: 36px;
          }

          .ios-settings-section {
            margin-top: 27px;
          }

          .ios-section-label {
            padding-left: 13px;
          }

          .ios-settings-card,
          .ios-danger-card {
            border-radius: 15px;
          }

          .ios-setting-row {
            grid-template-columns: 1fr;

            min-height: 0;

            gap: 6px;

            padding: 13px 14px;
          }

          .ios-row-leading {
            gap: 11px;
          }

          .ios-row-title {
            font-size: 15px;
          }

          .ios-row-value {
            padding-left: 41px;

            text-align: left;

            font-size: 14px;
          }

          .ios-mono {
            font-size: 11px;
            line-height: 1.45;
          }

          .ios-divider {
            margin-left: 55px;
          }

          .ios-status-pill {
            font-size: 12px;
          }

          .ios-subscription-action {
            padding: 13px 14px 15px;
          }

          .ios-inline-notice {
            margin-left: 14px;
            margin-right: 14px;
          }

          .ios-cancel-error {
            padding-left: 14px;
            padding-right: 14px;
          }

          .ios-danger-header {
            padding: 16px 14px;
          }

          .ios-delete-confirm {
            padding-left: 14px;
            padding-right: 14px;
          }

          .ios-delete-button {
            width: calc(100% - 28px);

            margin-left: 14px;
            margin-right: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ios-delete-button,
          .ios-delete-confirm input {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}

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
