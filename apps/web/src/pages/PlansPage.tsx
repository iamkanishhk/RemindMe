import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/react';
import { useBillingPlans, useCreateCheckoutSession, useMe } from '../hooks/queries';
import { resolveDisplayName } from '../lib/displayName';
import { formatMoney } from '../lib/format';
import { Spinner } from '../components/Spinner';
import { Skeleton } from '../components/Skeleton';
import { useErrorToast } from '../components/Toast';
import { IOSSwitch } from './DashboardPage';
import type { BillingPlan, PlanId } from '../lib/types';

function intervalLabel(plan: BillingPlan): string {
  const unit = plan.interval.toLowerCase();
  return plan.intervalCount === 1 ? unit : `${plan.intervalCount} ${unit}s`;
}

const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

// Social proof is editorial content, not billing data from the provider.
const PLAN_RATINGS: Record<PlanId, number> = {
  monthly: 4,
  annual: 4.9
};

/**
 * Five stars, with the filled layer clipped to the rating so a fractional
 * score like 4.9 fills the last star most of the way.
 */
function StarRating({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, rating));

  return (
    <span
      role="img"
      aria-label={`Rated ${clamped} out of 5`}
      className="relative inline-flex items-center gap-0.5"
    >
      <span className="flex items-center gap-0.5 text-[color:var(--text-faint)]">
        {[0, 1, 2, 3, 4].map((i) => (
          <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
            <path d={STAR_PATH} fill="none" stroke="currentColor" strokeWidth={1.5} />
          </svg>
        ))}
      </span>

      <span
            className="absolute inset-y-0 left-0 flex items-center gap-0.5 overflow-hidden text-yellow-400"
        style={{ width: `${(clamped / 5) * 100}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
            <path d={STAR_PATH} fill="currentColor" />
          </svg>
        ))}
      </span>
    </span>
  );
}

export default function PlansPage() {
  const plansQuery = useBillingPlans();
  const checkout = useCreateCheckoutSession();
  const navigate = useNavigate();
  const me = useMe();
  const { user } = useUser();

  // Real signed-in user, not a placeholder photo. Falls back to initials
  // because Clerk users can sign up with an email and no avatar.
  const name = resolveDisplayName(user?.fullName, me.data?.email) ?? 'RemindMe';
  const avatarUrl = user?.imageUrl;

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
    <div className="h-[85vh] bg-[color:var(--bg)] text-[color:var(--text)] flex flex-col justify-between selection:bg-[color:var(--primary)] selection:text-[color:var(--on-primary)]">

      <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-md mx-auto w-full">
         <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="h-10 fixed top-4 left-5 w-10 flex items-center justify-center rounded-full bg-[color:var(--surface)]  text-[color:var(--text-dim)] hover:text-[color:var(--text)] active:scale-95 transition"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {/* Top Avatar Illustration */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--primary-strong)] opacity-30 blur-md" />
          <div className="relative w-28 h-28 rounded-full border-2 border-[color:var(--primary)]/40 p-1 bg-[color:var(--surface)] shadow-xl overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="flex w-full h-full items-center justify-center rounded-full bg-[color:var(--surface-2)] text-3xl font-semibold text-[color:var(--primary)]">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

       

        {/* Main Card Container */}
        <div className="w-full bg-[color:var(--surface)]/90  rounded-3xl p-6 ">
          {plansQuery.isLoading ? (
            <div className="space-y-4" aria-busy="true">
              <Skeleton className="h-[72px] w-full rounded-2xl bg-[color:var(--surface-2)]" />
              <Skeleton className="h-[72px] w-full rounded-2xl bg-[color:var(--surface-2)]" />
            </div>
          ) : plansQuery.isError ? (
            <div className="rounded-2xl border border-[color:var(--border)] p-5 text-center">
              <p className="text-sm text-[color:var(--text-dim)]">
                {plansQuery.error?.message ?? 'Could not load plans.'}
              </p>
              <button
                type="button"
                onClick={() => void plansQuery.refetch()}
                className="mt-3 text-sm font-semibold text-[color:var(--primary)] hover:text-[color:var(--primary-strong)]"
              >
                Try again
              </button>
            </div>
          ) : (
            <fieldset className="space-y-3">
              <legend className="sr-only">Billing plan</legend>
              {plans.map((plan) => {
                const isSelected = plan.id === selected;
                const planName = plan.id === 'annual' ? 'Annual plan' : 'Monthly plan';

                return (
                  <div
                    key={plan.id}
                    className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color:var(--primary)] ${
                      isSelected
                        ? 'border-[color:var(--primary)]/50'
                        : 'border-[color:var(--border)]'
                    }`}
                  >
                    <label className="flex-1 min-w-0 cursor-pointer">
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={isSelected}
                        onChange={() => setPreferred(plan.id)}
                        className="sr-only"
                      />

                      {/* Left Details */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[color:var(--text-muted)] capitalize">
                          {plan.id === 'annual' ? 'Annual Plan' : 'Monthly Plan'}
                        </span>
                        <StarRating rating={PLAN_RATINGS[plan.id]} />
                      </div>

                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight text-[color:var(--text)]">
                          {formatMoney(plan.amountMinorUnits, plan.currency)}
                        </span>
                        <span className="text-xs text-[color:var(--text-dim)] font-normal">
                          /{intervalLabel(plan)}
                        </span>
                      </div>

                      {plan.monthlyEquivalentMinorUnits != null && plan.monthlyEquivalentMinorUnits !== plan.amountMinorUnits ? (
                        <span className="block text-md text-[color:var(--text-muted)] mt-0.5">
                          {formatMoney(plan.monthlyEquivalentMinorUnits, plan.currency)} /month
                        </span>
                      ) : null}
                    </label>

                    {/* Right Toggle Switch */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <IOSSwitch
                        enabled={isSelected}
                        busy={false}
                        onClick={() => setPreferred(plan.id)}
                        label={`Select the ${planName.toLowerCase()}`}
                      />
                    </div>
                  </div>
                );
              })}
            </fieldset>
          )}

          {/* Feature List (from design image) */}
          <div className="mt-6 pt-5 border-t border-[color:var(--border-soft)] space-y-3">
            {[
              '120 Reminders per month (4/day)',
              '24/7 Extended Support',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-md text-[color:var(--text-muted)]">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-[color:var(--text)] text-[color:var(--bg)] shrink-0">
                  <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {trialDays > 0 ? (
          <p className="pt-4 text-center text-xs text-[color:var(--text-dim)]">
            {trialDays} days free, then billing starts. Cancel anytime.
          </p>
        ) : null}
      </div>

      {/* Action Button */}
      <div className="shrink-0 px-4 max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={() => void onContinue()}
          disabled={checkout.isPending || plansQuery.isLoading || plansQuery.isError}
          className="w-full py-3.5 rounded-2xl bg-[color:var(--primary)] hover:bg-[color:var(--primary-strong)] text-[color:var(--on-primary)] font-semibold text-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition shadow-lg shadow-[color:var(--primary)]/20 flex items-center justify-center gap-2"
        >
          {checkout.isPending ? <Spinner /> : <span>Start my free trial</span>}
        </button>
      </div>
    </div>
  );
}