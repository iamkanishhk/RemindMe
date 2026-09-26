import { motion, useReducedMotion } from 'framer-motion';

interface ErrorPageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondary?: { label: string; onClick: () => void };
  light?: boolean;
}

export default function ErrorPage({
  message,
  title,
  onRetry,
  retryLabel = 'Try again',
  secondary,
  light = false,
}: ErrorPageProps) {
  const reduceMotion = useReducedMotion();

  const content = (
    <motion.div
      className="flex flex-col items-center text-center"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[color:var(--danger-soft)] text-[30px] font-bold leading-none text-[color:var(--danger)]"
      >
        !
      </div>

      <h1 className="mt-5 text-[22px] font-bold tracking-[-0.02em] text-[color:var(--text)]">
        {title ?? 'Something went wrong'}
      </h1>

      <p className="mt-2.5 max-w-[320px] text-[14px] leading-relaxed text-[color:var(--text-dim)]">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="pressable mt-8 inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-[image:var(--gradient-primary)] px-7 text-[15px] font-semibold text-[color:var(--on-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        >
          {retryLabel}
        </button>
      )}

      {secondary && (
        <button
          type="button"
          onClick={secondary.onClick}
          className="pressable mt-3 text-[15px] font-medium text-[color:var(--primary)]"
        >
          {secondary.label}
        </button>
      )}
    </motion.div>
  );

  if (light) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">{content}</div>
      </div>
    );
  }

  return (
    <section className="flex min-h-screen w-full items-center justify-center bg-[color:var(--bg)] px-6">
      {content}
    </section>
  );
}