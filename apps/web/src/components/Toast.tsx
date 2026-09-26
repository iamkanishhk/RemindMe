import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface ToastItem {
  id: number;
  message: string;
}

interface ToastApi {
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const AUTO_DISMISS_MS = 4200;

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within <ToastProvider>');
  }
  return ctx;
}

export function useErrorToast(message?: string | null) {
  const toast = useToast();
  const seen = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (message === seen.current) return;
    seen.current = message;
    if (message) toast.error(message);
  }, [message, toast]);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const error = useCallback(
    (message: string) => {
      const id = ++nextId.current;
      setToasts((list) => [...list, { id, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ error }), [error]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  const reduceMotion = useReducedMotion();

  const toastVariants: Variants | undefined = reduceMotion
    ? undefined
    : {
        enter: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 450,
            damping: 30,
            mass: 0.9,
            opacity: { duration: 0.18, ease: 'easeOut' },
          },
        },
        exit: {
          opacity: 0,
          y: '-110%',
          transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
        },
      };

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+12px)] z-[100] flex w-full max-w-[420px] -translate-x-1/2 flex-col items-stretch gap-2.5 px-4"
      aria-live="assertive"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout={reduceMotion ? undefined : true}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: '-110%' }}
            animate={reduceMotion ? { opacity: 1 } : 'enter'}
            exit={reduceMotion ? { opacity: 0 } : 'exit'}
            variants={toastVariants}
            role="alert"
            className="pointer-events-auto flex items-center gap-3 rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--toast-bg)] px-4 py-3 shadow-[0_10px_34px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--danger-soft)] text-[15px] font-bold leading-none text-[color:var(--danger)]"
            >
              !
            </span>
            <p className="min-w-0 flex-1 text-[14px] font-medium leading-snug text-[color:var(--text)]">
              {toast.message}
            </p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-[17px] leading-none text-[color:var(--text-dim)] transition hover:text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--primary)]"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}