import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/react';
import { useCancelSubscription, useDeleteMe, useMe, useBillingStatus } from '../hooks/queries';
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
  const [error, setError] = useState('');
  const [cancelError, setCancelError] = useState('');

  async function doDelete() {
    setBusy(true);
    setError('');
    try {
      await deleteMe.mutateAsync();
      await signOut();
      navigate('/sign-in', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete your account');
      setBusy(false);
    }
  }

  async function doCancel() {
    setCancelError('');
    try {
      await cancelSub.mutateAsync();
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : 'Could not cancel your subscription');
    }
  }

  const confirmed = confirmText.trim().toLowerCase() === 'delete';
  const b = billing.data;
  const planLabel = b ? formatMoney(b.amountMinorUnits, b.currency) : '';
  const intervalLabel = b?.interval ? `/${b.interval.toLowerCase()}` : '';

  return (
    <section className="page-narrow">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="card settings-card">
        <h2>Account</h2>
        {me.isLoading ? (
          <Spinner label="Loading account…" />
        ) : (
          <dl className="detail-grid">
            <div>
              <dt>Email</dt>
              <dd>{me.data?.email ?? '—'}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd className="mono">{me.data?.id ?? '—'}</dd>
            </div>
            <div>
              <dt>Reminders</dt>
              <dd>{me.data?.counts.reminders ?? 0}</dd>
            </div>
            <div>
              <dt>Phone numbers</dt>
              <dd>{me.data?.counts.phoneNumbers ?? 0}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{me.data?.createdAt ? formatDateTimeLocal(me.data.createdAt) : '—'}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="card settings-card">
        <h2>Subscription</h2>
        {billing.isLoading ? (
          <Spinner label="Loading subscription…" />
        ) : !b || (!b.status && b.mode === 'none') ? (
          <p className="dim">No subscription yet.</p>
        ) : (
          <>
            <dl className="detail-grid">
              {b.status && (
                <div>
                  <dt>Status</dt>
                  <dd>{STATUS_LABEL[b.status] ?? b.status}</dd>
                </div>
              )}
              {planLabel && (
                <div>
                  <dt>Plan</dt>
                  <dd>
                    {planLabel}
                    {intervalLabel}
                  </dd>
                </div>
              )}
              {b.currentPeriodEnd && (
                <div>
                  <dt>{b.cancelAtPeriodEnd ? 'Access until' : 'Next billing'}</dt>
                  <dd>{formatDateTimeLocal(b.currentPeriodEnd)}</dd>
                </div>
              )}
              {b.trial?.endsAt && b.mode === 'trial' && (
                <div>
                  <dt>Trial ends</dt>
                  <dd>{formatDateTimeLocal(b.trial.endsAt)}</dd>
                </div>
              )}
              {b.providerSubscriptionId && (
                <div>
                  <dt>Subscription ID</dt>
                  <dd className="mono">{b.providerSubscriptionId}</dd>
                </div>
              )}
            </dl>
            {b.status === 'ACTIVE' && !b.cancelAtPeriodEnd ? (
              <button
                type="button"
                className="btn btn-danger-outline"
                disabled={cancelSub.isPending}
                onClick={() => void doCancel()}
              >
                {cancelSub.isPending ? <Spinner /> : 'Cancel subscription'}
              </button>
            ) : b.cancelAtPeriodEnd ? (
              <p className="dim">Subscription cancels at the end of the current billing period.</p>
            ) : null}
            <ErrorBanner message={cancelError} />
          </>
        )}
      </div>

      <div className="card settings-card danger-zone">
        <h2>Danger zone</h2>
        <p className="dim">
          Deleting your account permanently removes your phone numbers and reminder history. Type <code>delete</code> to
          confirm.
        </p>
        <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="type 'delete'" />
        <button type="button" className="btn btn-danger" disabled={!confirmed || busy} onClick={() => void doDelete()}>
          {busy ? <Spinner /> : 'Delete my account'}
        </button>
      </div>
    </section>
  );
}