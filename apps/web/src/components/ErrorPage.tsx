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
        className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[rgba(255,69,58,0.14)] text-[30px] font-bold leading-none text-[#ff453a]"
      >
        !
      </div>

      <h1
        className={
          light
            ? 'mt-5 text-[22px] font-bold tracking-[-0.02em] text-[#1c1b22]'
            : 'mt-5 text-[22px] font-bold tracking-[-0.02em] text-[#f5f5f7]'
        }
      >
        {title ?? 'Something went wrong'}
      </h1>

      <p
        className={
          light
            ? 'mt-2.5 max-w-[320px] text-[14px] leading-relaxed text-[#6b6a76]'
            : 'mt-2.5 max-w-[320px] text-[14px] leading-relaxed text-[#98989f]'
        }
      >
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="pressable mt-8 inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-gradient-to-b from-[#168cff] to-[#087cf0] px-7 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        >
          {retryLabel}
        </button>
      )}

      {secondary && (
        <button
          type="button"
          onClick={secondary.onClick}
          className="pressable mt-3 text-[15px] font-medium text-[#0A84FF]"
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
    <section className="flex min-h-screen w-full items-center justify-center bg-black px-6">
      {content}
    </section>
  );
}