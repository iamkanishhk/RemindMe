import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBillingPlans, useCreateCheckoutSession } from '../hooks/queries';
import { formatMoney } from '../lib/format';
import { Spinner } from '../components/Spinner';
import { Skeleton } from '../components/Skeleton';
import { useErrorToast } from '../components/Toast';
import type { BillingPlan, PlanId } from '../lib/types';

function intervalLabel(plan: BillingPlan): string {
  const unit = plan.interval.toLowerCase();
  return plan.intervalCount === 1 ? unit : `${plan.intervalCount} ${unit}s`;
}

export default function PlansPage() {
  const plansQuery = useBillingPlans();
  const checkout = useCreateCheckoutSession();
  const navigate = useNavigate();

  // Annual is the better-value default, but only when the provider offers it.
  const [preferred, setPreferred] = useState<PlanId>('annual');
  const [error, setError] = useState('');

  useErrorToast(error);

  const plans = plansQuery.data ?? [];
  const selected =
    plans.find((p) => p.id === preferred)?.id ?? plans[0]?.id ?? 'monthly';

  async function onContinue() {
    setError('');
    try {
      const res = await checkout.mutateAsync(selected);
      if (res.checkoutUrl) {
        window.location.assign(res.checkoutUrl);
      } else {
        setError('Checkout could not be started.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout');
    }
  }

  // Normally the user arrives here from the subscription sheet, so going back
  // returns them there. A deep link may have no in-app history, so fall back
  // to the dashboard rather than leaving the app.
  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }

  const trialDays = plans.find((p) => p.id === selected)?.trialDays ?? 0;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 pt-5 pb-2 shrink-0">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="h-10 w-10 -ml-1 flex items-center justify-center rounded-full text-[color:var(--text-dim)] active:scale-95 transition"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold tracking-tight">Choose a plan</h1>
      </header>

      {/* Intro */}
      <div className="px-5 pt-2 pb-5 shrink-0">
        <p className="text-[13px] leading-relaxed text-[color:var(--text-dim)]">
          Every plan starts with a free trial. Pick the rhythm that suits you —
          switch or cancel whenever you want.
        </p>
      </div>

      {/* Plans */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {plansQuery.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-[104px] w-full rounded-2xl" />
            <Skeleton className="h-[104px] w-full rounded-2xl" />
          </div>
        ) : plansQuery.isError ? (
          <div className="rounded-2xl border border-[color:var(--border-soft)] p-5 text-center">
            <p className="text-sm text-[color:var(--text-dim)]">
              {plansQuery.error?.message ?? 'Could not load plans.'}
            </p>
            <button
              type="button"
              onClick={() => void plansQuery.refetch()}
              className="mt-3 text-sm font-semibold text-[color:var(--primary)]"
            >
              Try again
            </button>
          </div>
        ) : (
          <fieldset className="space-y-3">
            <legend className="sr-only">Billing plan</legend>
            {plans.map((plan) => {
              const isSelected = plan.id === selected;
              return (
                <label
                  key={plan.id}
                  className={`relative flex items-center gap-3 rounded-2xl border p-4 transition active:scale-[0.99] ${
                    isSelected
                      ? 'border-[color:var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]'
                      : 'border-[color:var(--border-soft)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={isSelected}
                    onChange={() => setPreferred(plan.id)}
                    className="sr-only"
                  />

                  <span
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-[color:var(--primary)]'
                        : 'border-[color:var(--text-dim)]'
                    }`}
                  >
                    {isSelected ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--primary)]" />
                    ) : null}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold capitalize">{plan.id === 'annual' ? 'Yearly' : 'Monthly'}</span>
                      {plan.savingsPercent ? (
                        <span className="rounded-full bg-[color:var(--primary)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--on-primary)]">
                          Save {plan.savingsPercent}%
                        </span>
                      ) : null}
                    </span>
                    {plan.monthlyEquivalentMinorUnits != null && plan.monthlyEquivalentMinorUnits !== plan.amountMinorUnits ? (
                      <span className="mt-0.5 block text-[13px] text-[color:var(--text-dim)]">
                        {formatMoney(plan.monthlyEquivalentMinorUnits, plan.currency)} /month
                      </span>
                    ) : null}
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block text-[19px] font-bold tabular-nums">
                      {formatMoney(plan.amountMinorUnits, plan.currency)}
                    </span>
                    <span className="block text-[12px] text-[color:var(--text-dim)]">
                      /{intervalLabel(plan)}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}

        {trialDays > 0 ? (
          <p className="px-1 pt-4 text-center text-[13px] text-[color:var(--text-dim)]">
            {trialDays} days free, then billing starts. Cancel anytime.
          </p>
        ) : null}
      </div>

      {/* Sticky CTA */}
      <div className="shrink-0 px-4 pt-2 pb-6 bg-[linear-gradient(to_top,var(--bg)_55%,transparent)]">
        <button
          type="button"
          onClick={() => void onContinue()}
          disabled={checkout.isPending || plansQuery.isLoading || plansQuery.isError}
          className="w-full py-4 rounded-2xl bg-[color:var(--primary)] text-[color:var(--on-primary)] font-semibold text-[15px] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition flex items-center justify-center gap-2"
        >
          {checkout.isPending ? <Spinner /> : <span>Start my free trial</span>}
        </button>
      </div>
    </div>
  );
}
