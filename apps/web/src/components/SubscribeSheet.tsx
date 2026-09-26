import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { SubscribePrompt } from './SubscribePrompt';

export interface SubscribeSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function SubscribeSheet({
  open,
  onClose
}: SubscribeSheetProps) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(true);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);

  const handleRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) setExpanded(true);
  }, [open]);

  useLayoutEffect(() => {
    if (expanded) return;

    const handle = handleRef.current;
    const scroll = scrollRef.current;

    if (!handle || !scroll) return;

    setCollapsedHeight(handle.offsetHeight + scroll.scrollHeight);
  }, [expanded]);

  const fade: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: 'easeOut' };

  const sheetTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 };

  const height = expanded ? '99dvh' : String(collapsedHeight ?? 'auto');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-[color:var(--overlay)] backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          role="dialog"
          aria-modal="true"
          aria-label="Subscribe to Pro"
          onClick={onClose}
        >
          <motion.div
            className="flex w-full max-w-[520px] flex-col overflow-hidden rounded-t-[28px] border border-b-0 border-[color:var(--border-soft)] bg-[color:var(--bg)] shadow-[0_-24px_60px_rgba(0,0,0,0.6)]"
            initial={reduceMotion ? { opacity: 1 } : { y: '100%', opacity: 0.6, height }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1, height }}
            exit={reduceMotion ? { opacity: 0 } : { y: '100%', opacity: 0.6, height: '90dvh' }}
            transition={sheetTransition}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle — tap to expand/collapse */}
            <button
              ref={handleRef}
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse plan details' : 'Expand plan details'}
              className="flex w-full shrink-0 items-center justify-center py-3 active:scale-[0.98]"
            >
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 30 }
                }
                className="flex flex-col items-center gap-2"
              >
                <span className="block h-[5px] w-9 rounded-full bg-[color:var(--text-faint)]" />

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 text-[color:var(--text-dim)]"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </motion.span>
            </button>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
            >
              <SubscribePrompt expanded={expanded} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
