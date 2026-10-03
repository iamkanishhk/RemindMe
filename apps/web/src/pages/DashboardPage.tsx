import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMe, useReminders, useUpdateReminder } from '../hooks/queries';
import { formatRelative, formatTime } from '../lib/format';
import type { Reminder } from '../lib/types';
import { Skeleton } from '../components/Skeleton';
import { useErrorToast } from '../components/Toast';
import { motion } from 'framer-motion';
import scheduleImage from '../../public/assets/schedule.png';
import SoftAurora from '../components/SoftAurora';

function sortKey(r: Reminder): number {
  return r.nextRunAt ? new Date(r.nextRunAt).getTime() : Number.MAX_SAFE_INTEGER;
}

function splitTime(value: string): [string, string] {
  const i = value.lastIndexOf(' ');
  return i === -1 ? [value, ''] : [value.slice(0, i), value.slice(i + 1)];
}

function reminderTime(reminder: Reminder): string | null {
  const iso = reminder.nextLocal ?? reminder.nextRunAt;
  return iso ? formatTime(reminder.timezone, iso) : null;
}

function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}

/* -------------------------------------------------------------------------- */
/* iOS-style Switch                                                           */
/* -------------------------------------------------------------------------- */
const IOS_SWITCH_CONFIG = {
  geometry: {
    trackWidth: 65,
    trackHeight: 30,
    trackPadding: 3,
    knobWidth: 36,
    knobHeight: 25,
    knobRadius: 9999,
  },
  physics: {
    animationDuration: 300,
  },
  glass: {
    scale: 1.27,
    thickness: 2,
    transmission: 0.92,
    blur: 4,
    saturation: 150,
    contrast: 505,
    borderOpacity: 0.75,
    shadowOpacity: 2.30,
  },
  chromatic: {
    overlayOpacity: 0.75,
    red: 'rgba(255, 0, 90, 0.28)',
    blue: 'rgba(0, 240, 255, 0.28)',
  },
  knob: {
    restingScale: 1,
    movingScale: 0.88,
    fadeDuration: 0.1,
  },
  lighting: {
    specularOpacity: 0.0,
    specularGradient: `
      linear-gradient(
        135deg,
        rgba(255,255,255,0.9) 0%,
        rgba(255,255,255,0.22) 38%,
        transparent 68%
      )
    `,
    causticOpacity: 0.45,
    causticGradient: `
      radial-gradient(
        circle at 50% 85%,
        rgba(255,255,255,0.45) 0%,
        transparent 68%
      )
    `,
  },
  colors: {
    on: 'var(--success)',
    off: 'var(--surface-3)',
    onGlow: 'color-mix(in srgb, var(--success) 45%, transparent)',
    offGlow: 'rgba(255, 255, 255, 0.18)',
    onAmbientOpacity: 0.35,
    onAmbientGradient: `
      radial-gradient(
        circle at 82% 50%,
        rgba(255,255,255,0.9),
        transparent 65%
      )
    `,
  },
  animation: {
    liquidFadeDuration: 0.08,
    liquidEase: [0.16, 1, 0.3, 1],
    ambientDuration: 0.15,
  },
  shadows: {
    on: `
      inset 0 2px 4px rgba(0,0,0,0.20),
      inset 0 -1px 1px rgba(255,255,255,0.20),
      0 2px 6px rgba(0,0,0,0.25)
    `,
    off: `
      inset 0 2px 5px rgba(0,0,0,0.45),
      inset 0 -1px 1px rgba(255,255,255,0.08),
      0 2px 6px rgba(0,0,0,0.25)
    `,
  },
} as const;

export function IOSSwitch({
  enabled,
  busy,
  onClick,
  label,
}: {
  enabled: boolean;
  busy: boolean;
  onClick: () => void;
  label: string;
}) {
  const {
    geometry,
    physics,
    glass,
    chromatic,
    knob,
    lighting,
    colors,
    animation,
    shadows,
  } = IOS_SWITCH_CONFIG;

  const travel = geometry.trackWidth - geometry.knobWidth - geometry.trackPadding * 2;
  const targetX = enabled ? travel : 0;

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = window.setTimeout(() => {
      setIsAnimating(false);
    }, physics.animationDuration);

    return () => window.clearTimeout(timer);
  }, [enabled, physics.animationDuration]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={busy}
      onClick={onClick}
      className="
        relative
        shrink-0
        rounded-full
        transition-colors
        duration-150
        ease-out
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-emerald-400/70
        disabled:opacity-50
        touch-manipulation
        select-none
      "
      style={{
        width: geometry.trackWidth,
        height: geometry.trackHeight,
        padding: geometry.trackPadding,
        borderRadius: Math.min(
          geometry.trackHeight / 2,
          geometry.knobRadius
        ),
        backgroundColor: enabled ? colors.on : colors.off,
        boxShadow: enabled ? shadows.on : shadows.off,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Ambient track glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full"
        animate={{
          opacity: enabled ? colors.onAmbientOpacity : 0,
        }}
        transition={{
          duration: animation.ambientDuration,
        }}
        style={{
          background: colors.onAmbientGradient,
        }}
      />

      {/* Sliding knob */}
      <div
        className="absolute pointer-events-none transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          left: geometry.trackPadding,
          top: '50%',
          transform: `translate3d(${targetX}px, -50%, 0)`,
          width: geometry.knobWidth,
          height: geometry.knobHeight,
        }}
      >
        {/* SOLID RESTING KNOB */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-[color:var(--on-primary)]"
          animate={{
            opacity: isAnimating ? 0 : 1,
            scale: isAnimating ? knob.movingScale : knob.restingScale,
          }}
          transition={{
            duration: knob.fadeDuration,
            ease: 'easeOut',
          }}
          style={{
            borderRadius: geometry.knobRadius,
          }}
        />

        {/* LIQUID GLASS */}
        <motion.div
          className="absolute pointer-events-none z-20"
          animate={{
            opacity: isAnimating ? glass.transmission : 0,
            scale: isAnimating ? glass.scale : 0.82,
          }}
          transition={{
            duration: animation.liquidFadeDuration,
            ease: animation.liquidEase,
          }}
          style={{
            width: geometry.knobWidth + glass.thickness * 2,
            height: geometry.knobHeight + glass.thickness * 2,
            left: -glass.thickness,
            top: -glass.thickness,
            borderRadius: geometry.knobRadius,
            backdropFilter: `blur(${glass.blur}px) saturate(${glass.saturation}%) contrast(${glass.contrast}%)`,
            WebkitBackdropFilter: `blur(${glass.blur}px) saturate(${glass.saturation}%) contrast(${glass.contrast}%)`,
            background: 'rgba(255,255,255,0.16)',
            border: `1px solid rgba(255,255,255,${glass.borderOpacity})`,
            boxShadow: `
              inset 0 2px 4px rgba(255,255,255,0.95),
              inset 0 -2px 4px rgba(0,0,0,${glass.shadowOpacity}),
              0 5px 14px rgba(0,0,0,0.30),
              0 0 12px ${enabled ? colors.onGlow : colors.offGlow}
            `,
          }}
        >
          {/* RGB dispersion */}
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
            animate={{
              opacity: isAnimating ? chromatic.overlayOpacity : 0,
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(
                    90deg,
                    ${chromatic.red} 0%,
                    transparent 38%,
                    transparent 62%,
                    ${chromatic.blue} 100%
                  )
                `,
              }}
            />
          </motion.div>

          {/* Specular highlight */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              opacity: lighting.specularOpacity,
              background: lighting.specularGradient,
            }}
          />

          {/* Caustic */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              opacity: lighting.causticOpacity,
              background: lighting.causticGradient,
            }}
          />
        </motion.div>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Schedule Item                                                              */
/* -------------------------------------------------------------------------- */

function ScheduleItem({ reminder }: { reminder: Reminder }) {
  const update = useUpdateReminder(reminder.id);
  const [busy, setBusy] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(reminder.isEnabled);

  useEffect(() => {
    setLocalEnabled(reminder.isEnabled);
  }, [reminder.isEnabled]);

  const [hour, meridiem] = splitTime(reminderTime(reminder) ?? '');
  const enabled = localEnabled;

  async function toggle() {
    const nextState = !enabled;
    setLocalEnabled(nextState);
    setBusy(true);

    try {
      await update.mutateAsync({
        isEnabled: nextState,
      });
    } catch {
      setLocalEnabled(!nextState);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="
        group
        flex
        items-center
        justify-between
        gap-4
        px-4
        py-3.5
        min-h-[10vh]
        border-b
        border-t
        border-[#38383a61]
        transition-colors
        duration-150
        active:bg-[color:var(--surface-2)]
      "
    >
      <Link
        to={`/reminders/${reminder.id}`}
        className="min-w-0 flex-1"
        style={{ textDecoration: 'none' }}
      >
        <div className="flex items-baseline gap-1.5">
          <span
            className="
              text-[48px]
              leading-none
              tracking-[-0.045em]
              text-[color:var(--text-dim)]
              tabular-nums
            "
          >
            {hour}
          </span>

          <span
            className="
              text-[19px]
              tracking-[-0.01em]
              text-[color:var(--text-dim)]
            "
          >
            {meridiem}
          </span>
        </div>

        <p
          className="
            mt-1
            truncate
            text-[14px]
            leading-[18px]
            font-medium
            text-[color:var(--text-dim)]
          "
        >
          {reminder.message}
        </p>
      </Link>

      <IOSSwitch
        enabled={enabled}
        busy={busy}
        onClick={() => void toggle()}
        label={enabled ? `Pause reminder` : `Resume reminder`}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero Card                                                                  */
/* -------------------------------------------------------------------------- */

function HeroCard({ reminder }: { reminder: Reminder }) {
  const [hour, meridiem] = splitTime(reminderTime(reminder) ?? '');
  const relative = reminder.nextLocal
    ? formatRelative(reminder.nextLocal)
    : '';

  return (
    <div
      className="
        border-b
        border-t
        border-[color:var(--surface-2)]
      "
    >
      <div className="relative p-5">
        <Link 
          to={`/reminders/${reminder.id}`} 
          style={{ textDecoration: 'none' }}
        >
          <h2
            className="
              mt-4
              truncate
              text-[17px]
              leading-[22px]
              font-semibold
              tracking-[-0.01em]
              text-[color:var(--text)]
            "
          >
            {reminder.message}
          </h2>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-baseline gap-2">
              <span
                className="
                  text-[48px]
                  leading-none
                  tracking-[-0.045em]
                  text-[color:var(--text)]
                  tabular-nums
                "
              >
                {hour}
              </span>

              <span
                className="
                  text-[19px]
                  tracking-[-0.01em]
                  text-[color:var(--text)]
                "
              >
                {meridiem}
              </span>
            </div>

            <div className="mt-4">
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  px-2.5
                  py-1.5
                  text-[11px]
                  font-semibold
                  bg-[#3f576f50]
                  text-[color:var(--primary)]
                "
              >
                VIEW
              </span>
            </div>
          </div>

          <span className="text-[13px] font-medium text-[color:var(--primary)]">
            {relative}
          </span>
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const me = useMe();
  const reminders = useReminders({ upcoming: true });
  const now = useNow();

  const upcoming = useMemo(() => {
    const all = reminders.data ?? [];

    return all
      .filter((r) => {
        const iso = r.nextLocal ?? r.nextRunAt;
        return iso ? new Date(iso).getTime() > now : false;
      })
      .sort((a, b) => sortKey(a) - sortKey(b));
  }, [reminders.data, now]);

  const error =
    me.error?.message ||
    reminders.error?.message ||
    '';

  useErrorToast(error);

  const next = useMemo(() => {
    if (upcoming.length === 0) return undefined;

    return upcoming.reduce((newest, r) =>
      new Date(r.createdAt).getTime() > new Date(newest.createdAt).getTime()
        ? r
        : newest
    );
  }, [upcoming]);

  return (
    <section
      className="
        relative
        bg-[color:var(--bg)]
        px-4
        pb-44
        pt-3
        text-[color:var(--text)]
        antialiased
        overflow-hidden
      "
    >
      <SoftAurora
        colorStops={["#AE897F","#B26B56","#B35443"]}
        blend={0.5}
        amplitude={1}
        speed={1}
        className="fixed inset-0 w-full h-full opacity-20 pointer-events-none"
      />

      {/* Header */}
      <div className="relative z-20 mb-4 pt-5 flex items-center justify-between">
        <div
          className="
            flex
            text-[25px]
            font-semibold
            text-[color:var(--text)]
          "
        >
          SureCall.me
        </div>
        <Link
          to="/reminders/new"
          aria-label="New reminder"
          className="
            pressable-round
            inline-flex
            text-[color:var(--primary)]
            text-[35px]
          "
          style={{ textDecoration: 'none' }}
        >
          +
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-20 mx-auto max-w-xl">
        {reminders.isLoading ? (
          <div className="mt-5 flex flex-col gap-6" aria-busy="true">
            {/* Hero Skeleton */}
            <div className="border-b border-t border-[color:var(--surface-2)] p-5">
              <Skeleton className="mt-4 h-[22px] w-2/5" />
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-baseline gap-2">
                  <Skeleton className="h-[48px] w-24" />
                  <Skeleton className="h-5 w-10" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-4 w-24" />
            </div>

            {/* Upcoming schedule Skeleton */}
            <div>
              <div className="mb-2.5 px-1">
                <Skeleton className="h-5 w-16" />
              </div>

              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 border-b border-t border-[#38383a61] px-4 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <Skeleton className="h-[48px] w-16" />
                      <Skeleton className="h-5 w-8" />
                    </div>
                    <Skeleton className="mt-1 h-4 w-2/5" />
                  </div>
                  <Skeleton className="h-[30px] w-[65px] rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : upcoming.length === 0 ? (
          /* Empty State */
          <div className="w-full flex flex-col items-center justify-center gap-3 p-6 text-center">
            <img src={scheduleImage} width="auto" height="10vh" className="opacity-70" alt="Call icon" />
            <div> No Schedules Yet</div>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-6">
            {/* Hero Card */}
            {next ? <HeroCard reminder={next} /> : null}

            {/* Upcoming Schedule */}
            <div>
              <div className="mb-2.5 flex items-end justify-between px-1">
                <div>
                  <h3
                    className="
                      text-[20px]
                      leading-6
                      font-semibold
                      tracking-[-0.02em]
                      text-[color:var(--text)]
                    "
                  >
                    Other
                  </h3>
                </div>
              </div>

              {/* iOS grouped list */}
              <div>
                {upcoming.map((r) => (
                  <ScheduleItem
                    key={r.id}
                    reminder={r}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}