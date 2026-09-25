import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import { Spinner } from './Spinner';

export interface ConfirmSheetProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  busy?: boolean;
  tone?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

const TONE_CLASS = {
  default:
    'bg-gradient-to-b from-[#168cff] to-[#087cf0] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
  destructive:
    'bg-gradient-to-b from-[#ff453a] to-[#dc1c12] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
} as const;

export default function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  busy = false,
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const reduceMotion = useReducedMotion();

  const fade: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: 'easeOut' };

  const cardVariants: Variants | undefined = reduceMotion
    ? undefined
    : {
        enter: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 450,
            damping: 30,
            mass: 0.9,
            opacity: { duration: 0.16, ease: 'easeOut' },
          },
        },
        exit: {
          opacity: 0,
          scale: 0.9,
          y: 12,
          transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
        },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            className="relative w-[430px] max-w-full rounded-[28px] border border-white/[0.07] bg-black/15 backdrop-blur-[1px] px-5 pb-5 pt-[25px] text-center shadow-[0_30px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.55, y: 24 }}
            animate={reduceMotion ? { opacity: 1 } : 'enter'}
            exit={reduceMotion ? { opacity: 0 } : 'exit'}
            variants={cardVariants}
          >
            <h2 className="mb-[30px] text-[24px] font-medium leading-[1.15] tracking-[-0.5px] text-[#f5f5f7]">
              {title}
            </h2>

            {message && (
              <p className="mb-[43px] text-[20px] font-normal leading-[1.35] tracking-[-0.2px] text-[#f5f5f7] [text-wrap:balance]">
                {message}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={onConfirm}
                className={`flex h-[70px] items-center justify-center gap-2 rounded-full border-0 text-[21px] font-medium tracking-[-0.25px] text-white transition active:scale-[0.97] disabled:opacity-50 ${TONE_CLASS[tone]}`}
              >
                {busy ? <Spinner /> : confirmLabel}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={onCancel}
                className="flex h-[70px] items-center justify-center rounded-full border-0 bg-gradient-to-b from-[#41464e] to-[#373c43] text-[21px] font-medium tracking-[-0.25px] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition active:scale-[0.97] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}