import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCreateCheckoutSession, useBillingStatus } from '../hooks/queries';
import { Skeleton } from './Skeleton';
import { useErrorToast } from './Toast';
import happyIllustration from '../../public/assets/happy.png';

export interface SubscribePromptProps {
  expanded: boolean;
}

export function SubscribePrompt({ expanded }: SubscribePromptProps) {
  const billing = useBillingStatus();
  const checkout = useCreateCheckoutSession();
  const reduceMotion = useReducedMotion();
  const [error, setError] = useState('');

  useErrorToast(error);

  if (billing.isLoading) {
    return (
      <div
        className="px-5 pb-5 pt-4 text-white font-sans"
        aria-busy="true"
      >
        <Skeleton className="mx-auto h-[5px] w-9 rounded-full bg-zinc-800" />
        <Skeleton className="mt-4 w-full h-44 rounded-2xl bg-zinc-900" />
        <div className="mt-5 flex flex-col space-y-3">
          <Skeleton className="h-6 w-3/4 rounded-md bg-zinc-900" />
          <Skeleton className="h-4 w-5/6 rounded-md bg-zinc-900" />
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
          <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
        </div>
        <Skeleton className="mt-6 h-14 w-full rounded-2xl bg-zinc-900" />
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
  const trialExhausted =
    Boolean(trial) && !trial?.endsAt && trial!.callsUsed >= trial!.callLimit;

  const cta = (
    <button
      type="button"
      onClick={onClick}
      disabled={checkout.isPending}
      className="w-full py-4 px-4 bg-gradient-to-r from-[#D95F59] to-[#ff4a40] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 text-white font-semibold rounded-2xl text-base  transition-all duration-150 flex items-center justify-center space-x-2"
    >
      {checkout.isPending ? (
        <span className="flex items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Starting…</span>
        </span>
      ) : (
        <span>Start my free trail now</span>
      )}
    </button>
  );

  return (
    <div className="text-white font-sans ">
      {/* Head — always visible so the collapsed sheet still sells the offer */}
      <div className="px-5">
        <h2 className="text-xl font-bold tracking-tight text-white">
          Start your free trial 
        </h2>

        <div className="mt-1 text-sm text-zinc-300">
          Pro Access for{' '}
          <span className="font-bold text-white">$7 per month</span>
        </div>

        {trialExhausted && (
          <p className="inline-block text-xs font-medium text-amber-400 bg-amber-950/60 border border-amber-800/50 px-3 py-1 rounded-full mt-3">
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

        <div className="relative mt-4 w-full h-35 overflow-hidden bg-gradient-to-b from-[#D95F59]/20 via-zinc-900/40 to-black flex items-center justify-center">
          <img
            src={happyIllustration}
            alt=""
            className="w-80 h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="relative pl-4 space-y-6 mt-6 mx-5 before:absolute before:left-[27px] before:top-3 before:bottom-3 before:w-[2px] before:bg-zinc-800">
          <div className="relative flex items-start space-x-4">
            <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full border border-[#D95F59] flex items-center justify-center text-[#D95F59] ">
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
              <h4 className="text-md font-semibold text-white">
                Today
              </h4>
              <p className="text-sm text-zinc-400 mt-0.5 leading-normal">
                (Free) Unlock full access to Call Reminders and 
                keep them active.
              </p>
            </div>
          </div>

          <div className="relative flex items-start space-x-4">
            <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
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
            
              <p className="text-md text-zinc-400 mt-0.5 leading-normal">
                We&apos;ll send you a reminder that your <br/>
                 free trail ending soon
              </p>
            </div>
          </div>

          <div className="relative flex items-start space-x-4">
            <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
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
              <h4 className="text-md font-semibold text-white">
                Day 2
              </h4>
              <p className="text-sm text-zinc-400 mt-0.5 leading-normal">
             Your first charge of $7/mo begins on <br/>
              {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
              </p>
            </div>
          </div>
        </div>

        <div className="h-[2vh]" aria-hidden="true" />
      </motion.div>

      <div className="px-5 pt-5 pb-1">{cta}</div>

      <p className="px-5 pt-3 pb-1 text-center text-sm text-zinc-500 font-medium">
        Start in 2 Taps. Cancel anytime.
      </p>
    </div>
  );
}
