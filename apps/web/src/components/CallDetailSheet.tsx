import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import { StatusChip } from './StatusChip';
import { formatDateTimeLocal } from '../lib/format';
import type { CallAttempt } from '../lib/types';

export interface CallDetailSheetProps {
  attempt: CallAttempt | null;
  onClose: () => void;
  onViewReminder?: (reminderId: string) => void;
}

export default function CallDetailSheet({
  attempt,
  onClose,
  onViewReminder,
}: CallDetailSheetProps) {
  const reduceMotion = useReducedMotion();

  const fade: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: 'easeOut' };

  const sheetVariants: Variants | undefined = reduceMotion
    ? undefined
    : {
        enter: {
          y: 0,
          opacity: 1,
          transition: {
            type: 'spring',
            stiffness: 420,
            damping: 34,
            mass: 0.9,
            opacity: { duration: 0.16, ease: 'easeOut' },
          },
        },
        exit: {
          y: '100%',
          opacity: 0.6,
          transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        },
      };

  const name = attempt?.reminderTitle ?? attempt?.reminderId ?? 'Untitled reminder';
  const reminderId = attempt?.reminderId;
  const canViewReminder = Boolean(reminderId) && Boolean(onViewReminder);

  return (
    <AnimatePresence>
      {attempt && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[color:var(--overlay)] px-3 pb-3 backdrop-blur-[3px] sm:items-center sm:pb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          role="dialog"
          aria-modal="true"
          aria-label={`Call details for ${name}`}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[430px] rounded-[28px] border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-5 pb-5 pt-[22px] shadow-[0_30px_70px_rgba(0,0,0,0.55)]"
            initial={reduceMotion ? { opacity: 1 } : { y: '100%', opacity: 0.6 }}
            animate={reduceMotion ? { opacity: 1 } : 'enter'}
            exit={reduceMotion ? { opacity: 0 } : 'exit'}
            variants={sheetVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 className="text-[20px] font-semibold leading-[1.2] tracking-[-0.4px] text-[color:var(--text)]">
                {name}
              </h2>

              <StatusChip status={attempt.status} />
            </div>

            <p className="mb-4 text-[13px] leading-[1.4] text-[color:var(--text-dim)]">
              Call details
            </p>

            {/* Fields */}
            <dl className="divide-y divide-[color:var(--border-soft)]">
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-[0.055em] text-[color:var(--text-faint)]">
                  Number
                </dt>
                <dd className="min-w-0 text-right font-mono text-[15px] text-[color:var(--text)]">
                  {attempt.destinationE164 ?? '—'}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-[0.055em] text-[color:var(--text-faint)]">
                  Scheduled on
                </dt>
                <dd className="min-w-0 text-right text-[15px] text-[color:var(--text)]">
                  {formatDateTimeLocal(attempt.startedAt)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-[0.055em] text-[color:var(--text-faint)]">
                  Ended
                </dt>
                <dd className="min-w-0 text-right text-[15px] text-[color:var(--text)]">
                  {attempt.endedAt ? formatDateTimeLocal(attempt.endedAt) : '—'}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="shrink-0 text-[11px] font-bold uppercase tracking-[0.055em] text-[color:var(--text-faint)]">
                  Detail
                </dt>
                <dd className="min-w-0 text-right text-[15px] leading-[1.4] text-[color:var(--text)] [overflow-wrap:anywhere]">
                  {attempt.detail ?? '—'}
                </dd>
              </div>
            </dl>

            {/* Actions */}
            <div
              className={`mt-5 flex gap-3 ${
                canViewReminder ? 'grid grid-cols-2' : 'grid grid-cols-1'
              }`}
            >
              {canViewReminder && (
                <button
                  type="button"
                  onClick={() => reminderId && onViewReminder?.(reminderId)}
                  className="h-[52px] rounded-full border-0 bg-[image:var(--gradient-primary)] text-[16px] font-semibold text-[color:var(--on-primary)] transition active:scale-[0.97]"
                >
                  View reminder
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="h-[52px] rounded-full border-0 bg-[image:var(--gradient-neutral)] text-[16px] font-semibold text-[color:color-mix(in_srgb,var(--on-primary)_90%,transparent)] transition active:scale-[0.97]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
