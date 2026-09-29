import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useBillingPlans, useBillingStatus } from '../hooks/queries';
import { formatMoney } from '../lib/format';
import { Skeleton } from './Skeleton';
import happyIllustration from '../../public/assets/happy.png';
import { Status,Alarm, } from 'reicon-react';


export interface SubscribePromptProps {
  expanded: boolean;
}

export function SubscribePrompt({ expanded }: SubscribePromptProps) {
  const billing = useBillingStatus();
  const plans = useBillingPlans();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  if (billing.isLoading || plans.isLoading) {
    return (
      <div
        className="px-5 pb-5 pt-4 text-[color:var(--text)] font-sans"
        aria-busy="true"
      >
        <Skeleton className="mx-auto h-[5px] w-9 rounded-full bg-[color:var(--surface-2)]" />
        <Skeleton className="mt-4 w-full h-44 rounded-2xl bg-[color:var(--surface)]" />
        <div className="mt-5 flex flex-col space-y-3">
          <Skeleton className="h-6 w-3/4 rounded-md bg-[color:var(--surface)]" />
          <Skeleton className="h-4 w-5/6 rounded-md bg-[color:var(--surface)]" />
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-12 w-full rounded-xl bg-[color:var(--surface)]" />
          <Skeleton className="h-12 w-full rounded-xl bg-[color:var(--surface)]" />
        </div>
        <Skeleton className="mt-6 h-14 w-full rounded-2xl bg-[color:var(--surface)]" />
      </div>
    );
  }

  const trial = billing.data?.trial;
  const trialExhausted =
    Boolean(trial) && !trial?.endsAt && trial!.callsUsed >= trial!.callLimit;

  // Prices and trial length come from the billing provider, never from constants.
  // Lead with the annual plan's per-month equivalent; the first-charge line still
  // shows the real amount so the headline rate is never mistaken for the bill.
  const plan = plans.data?.find((p) => p.id === 'annual') ?? plans.data?.[0] ?? null;
  const perMonth =
    plan?.monthlyEquivalentMinorUnits != null
      ? formatMoney(plan.monthlyEquivalentMinorUnits, plan.currency)
      : '';
  const chargeAmount = plan ? formatMoney(plan.amountMinorUnits, plan.currency) : '';
  const chargeInterval = plan
    ? plan.intervalCount === 1
      ? plan.interval.toLowerCase()
      : `${plan.intervalCount} ${plan.interval.toLowerCase()}s`
    : '';
  const trialDays = plan?.trialDays ?? 0;
  const firstChargeDate = new Date(
    Date.now() + trialDays * 24 * 60 * 60 * 1000
  ).toLocaleDateString();

  const cta = (
    <button
      type="button"
      onClick={() => navigate('/plans')}
      className="w-full py-4 px-4 bg-[image:var(--gradient-primary)] active:scale-[0.98] text-[color:var(--on-primary)] font-semibold rounded-2xl text-base transition-all duration-150 flex items-center justify-center space-x-2"
    >
      <span>Start my free trial now</span>
    </button>
  );

  return (
    <div className="text-[color:var(--text)] font-sans ">
      {/* Head — always visible so the collapsed sheet still sells the offer */}
      <div className="px-5">
        <h2 className="text-xl font-bold tracking-tight text-[color:var(--text)]">
          Start your free trial 
        </h2>

        <div className="mt-1 text-sm text-[color:var(--text-muted)]">
          Pro Access for{' '}
          <span className="font-bold text-[color:var(--text)]">
            {perMonth ? `${perMonth} per month` : 'every month'}
          </span>
          {chargeAmount && chargeInterval ? (
            <span className="text-[color:var(--text-dim)]">
              {' '}
              (billed {chargeInterval}ly)
            </span>
          ) : null}
        </div>

        {trialExhausted && (
          <p className="inline-block text-xs font-medium text-[color:var(--warning)] bg-[color:var(--warning-soft)] border border-[color:var(--warning-soft)] px-3 py-1 rounded-full mt-3">
            You&apos;ve used all {trial?.callLimit} trial calls.
          </p>
        )}
      </div>

      {/* Expandable detail */}
      <motion.div
        initial={false}
        animate={{
          height: expanded ? 'auto' : 0,
          opacity: expanded ? 1 : 0
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 320, damping: 34, mass: 0.8 }
        }
        className="overflow-hidden"
        aria-hidden={!expanded}
      >

        <div className="relative mt-4 w-full h-35 overflow-hidden bg-[image:linear-gradient(to_bottom,color-mix(in_srgb,var(--primary)_22%,transparent),color-mix(in_srgb,var(--surface)_55%,transparent),var(--surface))] flex items-center justify-center">
          <img
            src={happyIllustration}
            alt=""
            className="w-80 h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[image:linear-gradient(to_top,var(--scrim),transparent,transparent)] pointer-events-none" />
        </div>

        <div className="relative pl-4 space-y-6 mt-6 mx-5 before:absolute before:left-[27px] before:top-3 before:bottom-3 before:w-[2px] before:bg-[color:var(--surface-2)]">
          <div className="relative flex items-start space-x-4">
            <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full border border-[color:var(--primary)] flex items-center justify-center text-[color:var(--primary)] ">
              <svg
  className="w-5 h-5"
  fill="none"
  viewBox="0 0 24 24"
  stroke="currentColor"
  strokeWidth={2}
  aria-hidden="true"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M5 13l4 4L19 7"
  />
</svg>

            </div>
            <div>
              <h4 className="text-md font-semibold text-[color:var(--text)]">
                Today
              </h4>
              <p className="text-sm text-[color:var(--text-dim)] mt-0.5 leading-normal">
                (Free) Unlock full access to Call Reminders and 
                keep them active.
              </p>
            </div>
          </div>

          <div className="relative flex items-start space-x-4">
            <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-[color:var(--surface)] border border-[color:var(--border)] flex items-center justify-center text-[color:var(--text-muted)]">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div>
            
              <p className="text-md text-[color:var(--text-dim)] mt-0.5 leading-normal">
                We&apos;ll send you a reminder that your <br/>
                 free trail ending soon
              </p>
            </div>
          </div>

          <div className="relative flex items-start space-x-4">
            <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-[color:var(--surface)] border border-[color:var(--border)] flex items-center justify-center text-[color:var(--text-muted)]">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888a1 1 0 00.363-1.118l3.976 2.888c.784-.57 1.838.197 1.538 1.118l-1.519-4.674a1 1 0 00-.363-1.118z"
                />
              </svg>
            </div>
            <div>
              {trialDays > 0 ? (
                <h4 className="text-md font-semibold text-[color:var(--text)]">
                  Day {trialDays}
                </h4>
              ) : null}
              <p className="text-sm text-[color:var(--text-dim)] mt-0.5 leading-normal">
                {chargeAmount && chargeInterval
                  ? `Your first charge per ${chargeInterval} begins on `
                  : 'Your first charge begins on '}
                {trialDays > 0 ? (
                  <br />
                ) : null}
                {trialDays > 0 ? firstChargeDate : 'your trial’s end date'}.
              </p>
            </div>
          </div>
        </div>

        <div className="h-[2vh]" aria-hidden="true" />
      </motion.div>

      <div className="px-5 pt-5 pb-1">{cta}</div>

      <p className="px-5 pt-3 pb-1 text-center text-sm text-[color:var(--text-faint)] font-medium">
        Start in 2 Taps. Cancel anytime.
      </p>
    </div>
  );
}
