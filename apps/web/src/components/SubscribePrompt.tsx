import { useState } from 'react';
import { useCreateCheckoutSession, useBillingStatus } from '../hooks/queries';
import { ErrorBanner } from './ErrorBanner';
import { Spinner } from './Spinner';

export function SubscribePrompt() {
  const billing = useBillingStatus();
  const checkout = useCreateCheckoutSession();
  const [error, setError] = useState('');

  if (billing.isLoading) {
    return (
      <div className="banner">
        <Spinner label="Checking subscription…" />
      </div>
    );
  }

  async function onClick() {
    setError('');
    try {
      const res = await checkout.mutateAsync();
      if (res.checkoutUrl) {
        window.location.assign(res.checkoutUrl);
      } else {
        setError('Checkout could not be started.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout');
    }
  }

  const trial = billing.data?.trial;

  return (
    <div className="banner">
      <p>Reminders are paused while you set up billing.</p>
      {trial && !trial.endsAt && trial.callsUsed >= trial.callLimit && (
        <p className="dim">You&apos;ve used all {trial.callLimit} trial calls.</p>
      )}
      <div className="row">
        <div />
        <button type="button" className="btn btn-primary" onClick={onClick} disabled={checkout.isPending}>
          {checkout.isPending ? 'Starting…' : 'Subscribe to keep reminders on'}
        </button>
      </div>
      <ErrorBanner message={error} />
    </div>
  );
}