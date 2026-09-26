import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMe, useReminders, useUpdateReminder } from '../hooks/queries';
import { formatRelative, formatTime, isToday, repeatLabel } from '../lib/format';
import type { Reminder } from '../lib/types';
import { Skeleton } from '../components/Skeleton';
import { useErrorToast } from '../components/Toast';
import { motion } from 'framer-motion';
import LiquidGlass from 'liquid-glass-react';
import {
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

function sortKey(r: Reminder): number {
  return r.nextRunAt ? new Date(r.nextRunAt).getTime() : Number.MAX_SAFE_INTEGER;
}

function splitTime(value: string): [string, string] {
  const i = value.lastIndexOf(' ');
  return i === -1 ? [value, ''] : [value.slice(0, i), value.slice(i + 1)];
}

function greetingLabel(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function reminderTime(reminder: Reminder): string | null {
  const iso = reminder.nextLocal ?? reminder.nextRunAt;
  return iso ? formatTime(reminder.timezone, iso) : null;
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 320 512"
      fill="currentColor"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M285.5 273l-177 177c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9L188.2 256 51.9 118.5c-9.4-9.4-9.4-24.6 0-33.9L74.5 61.9c9.4-9.4 24.6-9.4 33.9 0l177 177c9.4 9.5 9.4 24.7.1 34.1z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 448 512"
      fill="currentColor"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M224 0c-17.7 0-32 14.3-32 32V51.2C119 66 64 130.6 64 208v25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm0 96c61.9 0 112 50.1 112 112v25.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V208c0-61.9 50.1-112 112-112zM288 448a64 64 0 1 1-128 0H288z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      viewBox="0 0 448 512"
      fill="currentColor"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M144 32C117.5 32 96 53.5 96 80V432c0 26.5 21.5 48 48 48s48-21.5 48-48V80c0-26.5-21.5-48-48-48zm160 0c-26.5 0-48 21.5-48 48V432c0 26.5 21.5 48 48 48s48-21.5 48-48V80c0-26.5-21.5-48-48-48z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* iOS-style Switch                                                           */
/* -------------------------------------------------------------------------- */
 const IOS_SWITCH_CONFIG = {
  // ─────────────────────────────────────────────
  // GEOMETRY
  // ─────────────────────────────────────────────
  geometry: {
    trackWidth: 65,
    trackHeight: 30,
    trackPadding: 3,

    knobWidth: 36,
    knobHeight: 25,

    // 9999 = pill / circle
    knobRadius: 9999,
  },

  // ─────────────────────────────────────────────
  // SPRING PHYSICS
  // ─────────────────────────────────────────────
  physics: {
    stiffness: 420,
    damping: 28,
    mass: 0.8,

    // How long we consider the switch to be
    // in its "liquid motion" state.
    animationDuration: 450,

    // Minimum velocity before liquid mode activates.
    velocityThreshold: 2,

    // Velocity used as the reference for
    // calculating stretch.
    velocityReference: 450,
  },

  // ─────────────────────────────────────────────
  // LIQUID / GLASS
  // ─────────────────────────────────────────────
  glass: {
    // Size multiplier while moving
    scale: 1.27,

    // Extra width/height of glass layer
    thickness: 2,

    // Overall transparency
    transmission: 0.92,

    // Backdrop blur
    blur: 4,

    // Glass saturation
    saturation: 150,

    // Contrast
    contrast: 505,

    // Border opacity
    borderOpacity: 0.75,

    // Shadow strength
    shadowOpacity: 2.30,

    // How much the glass reacts to velocity
    velocityDisplacement: 8,

    // Base displacement
    displacement: 12,
  },

  // ─────────────────────────────────────────────
  // LIQUID STRETCH
  // ─────────────────────────────────────────────
  stretch: {
    // Base horizontal stretch multiplier
    factorX: 1.45,

    // Base vertical compression
    factorY: 0.16,

    // Minimum vertical scale
    minY: 0.72,

    // Maximum normalized velocity
    maxVelocity: 2.5,

    // Optional anisotropic multiplier
    anisotropy: 1.0,
  },

  // ─────────────────────────────────────────────
  // CHROMATIC ABERRATION
  // ─────────────────────────────────────────────
  chromatic: {
    // Minimum RGB separation
    base: 1,

    // Additional separation based on velocity
    velocityAmount: 4,

    // CSS overlay opacity
    overlayOpacity: 0.75,

    // Red channel
    red: 'rgba(255, 0, 90, 0.28)',

    // Cyan / blue channel
    blue: 'rgba(0, 240, 255, 0.28)',
  },

  // ─────────────────────────────────────────────
  // SOLID KNOB
  // ─────────────────────────────────────────────
  knob: {
    restingScale: 1,

    movingScale: 0.88,

    fadeDuration: 0.14,

    background: 'var(--on-primary)',

  },

  // ─────────────────────────────────────────────
  // SPECULAR / LIGHTING
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // COLORS
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // ANIMATION
  // ─────────────────────────────────────────────
  animation: {
    liquidFadeDuration: 0.1,

    liquidEase: [0.16, 1, 0.3, 1],

    ambientDuration: 0.25,

    // whileTap scale
    tapScale: 0.92,
  },

  // ─────────────────────────────────────────────
  // LIQUID GLASS COMPONENT
  // ─────────────────────────────────────────────
  liquidGlass: {
    displacementScale: 12,
    saturation: 150,
    aberrationIntensity: 3,
    blurAmount: 0.08,
  },

  // ─────────────────────────────────────────────
  // TRACK SHADOWS
  // ─────────────────────────────────────────────
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
  const config = IOS_SWITCH_CONFIG;

  const {
    geometry,
    physics,
    glass,
    stretch,
    chromatic,
    knob,
    lighting,
    colors,
    animation,
    liquidGlass,
    shadows,
  } = config;

  const travel =
    geometry.trackWidth -
    geometry.knobWidth -
    geometry.trackPadding * 2;

  const targetX = enabled ? travel : 0;

  const x = useMotionValue(targetX);

  const springX = useSpring(x, {
    stiffness: physics.stiffness,
    damping: physics.damping,
    mass: physics.mass,
  });

  const [velocity, setVelocity] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    x.set(targetX);
    setIsAnimating(true);

    const timer = window.setTimeout(() => {
      setIsAnimating(false);
    }, physics.animationDuration);

    return () => window.clearTimeout(timer);
  }, [enabled, targetX, x, physics.animationDuration]);

  useEffect(() => {
    return springX.on('change', () => {
      setVelocity(springX.getVelocity());
    });
  }, [springX]);

  const isLiquidActive =
    isAnimating ||
    Math.abs(velocity) > physics.velocityThreshold;

  const normalizedVelocity = Math.min(
    Math.abs(velocity) / physics.velocityReference,
    stretch.maxVelocity
  );

  const stretchX = isLiquidActive
    ? 1 +
      normalizedVelocity *
        stretch.factorX *
        stretch.anisotropy
    : 1;

  const stretchY = isLiquidActive
    ? Math.max(
        stretch.minY,
        1 -
          normalizedVelocity *
            stretch.factorY *
            stretch.anisotropy
      )
    : 1;

  const aberrationIntensity =
    chromatic.base +
    normalizedVelocity * chromatic.velocityAmount;

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
        duration-300
        ease-out
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-emerald-400/70
        disabled:opacity-50
        touch-manipulation
        select-none
        overflow-visible
      "
      style={{
        width: geometry.trackWidth,
        height: geometry.trackHeight,
        padding: geometry.trackPadding,
        borderRadius:
          Math.min(
            geometry.trackHeight / 2,
            geometry.knobRadius
          ),

        backgroundColor: enabled
          ? colors.on
          : colors.off,

        boxShadow: enabled
          ? shadows.on
          : shadows.off,

        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Ambient track glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full"
        animate={{
          opacity: enabled
            ? colors.onAmbientOpacity
            : 0,
        }}
        transition={{
          duration: animation.ambientDuration,
        }}
        style={{
          background:
            colors.onAmbientGradient,
        }}
      />

      {/* Sliding knob */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: geometry.trackPadding,
          top: '50%',
          x: springX,
          y: '-50%',
          width: geometry.knobWidth,
          height: geometry.knobHeight,
        }}
      >
        {/* ==========================================
            SOLID RESTING KNOB
            ========================================== */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-[color:var(--on-primary)]"
          animate={{
            opacity: isLiquidActive ? 0 : 1,
            scale: isLiquidActive
              ? knob.movingScale
              : knob.restingScale,
          }}
          transition={{
            duration: knob.fadeDuration,
            ease: 'easeOut',
          }}
          style={{
            borderRadius: geometry.knobRadius,

          }}
        >
        </motion.div>

        {/* ==========================================
            LIQUID GLASS
            ========================================== */}
        <motion.div
          className="absolute pointer-events-none z-20"
          animate={{
            opacity: isLiquidActive
              ? glass.transmission
              : 0,

            scale: isLiquidActive
              ? glass.scale
              : 0.82,

            scaleX: stretchX,
            scaleY: stretchY,
          }}
          transition={{
            duration:
              animation.liquidFadeDuration,

            ease: animation.liquidEase,
          }}
          style={{
            width:
              geometry.knobWidth +
              glass.thickness * 2,

            height:
              geometry.knobHeight +
              glass.thickness * 2,

            left: -glass.thickness,
            top: -glass.thickness,

            borderRadius:
              geometry.knobRadius,

            backdropFilter: `
              blur(${glass.blur}px)
              saturate(${glass.saturation}%)
              contrast(${glass.contrast}%)
            `,

            WebkitBackdropFilter: `
              blur(${glass.blur}px)
              saturate(${glass.saturation}%)
              contrast(${glass.contrast}%)
            `,

            background:
              'rgba(255,255,255,0.16)',

            border: `
              1px solid
              rgba(255,255,255,${glass.borderOpacity})
            `,

            boxShadow: `
              inset 0 2px 4px
                rgba(255,255,255,0.95),

              inset 0 -2px 4px
                rgba(0,0,0,${glass.shadowOpacity}),

              0 5px 14px
                rgba(0,0,0,0.30),

              0 0 12px
                ${
                  enabled
                    ? colors.onGlow
                    : colors.offGlow
                }
            `,
          }}
        >

          {/* RGB dispersion */}
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
            animate={{
              opacity: isLiquidActive
                ? chromatic.overlayOpacity
                : 0,
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
              opacity:
                lighting.specularOpacity,

              background:
                lighting.specularGradient,
            }}
          />

          {/* Caustic */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              opacity:
                lighting.causticOpacity,

              background:
                lighting.causticGradient,
            }}
          />
        </motion.div>
      </motion.div>
    </button>
  );
}


/* -------------------------------------------------------------------------- */
/* Schedule Item                                                              */
/* -------------------------------------------------------------------------- */

function ScheduleItem({ reminder }: { reminder: Reminder }) {
  const update = useUpdateReminder(reminder.id);
  const [busy, setBusy] = useState(false);

  const [hour, meridiem] = splitTime(reminderTime(reminder) ?? '');
  const enabled = reminder.isEnabled;

  async function toggle() {
    setBusy(true);

    try {
      await update.mutateAsync({
        isEnabled: !enabled,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`
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
      `}
    >
      <Link
        to={`/reminders/${reminder.id}`}
        className="min-w-0 flex-1"
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
          className={`
            mt-1
            truncate
            text-[14px]
            leading-[18px]
            font-medium
          text-[color:var(--text-dim)]
          `}
        >
          {reminder.title}
        </p>

       
      </Link>

      <IOSSwitch
        enabled={enabled}
        busy={busy}
        onClick={() => void toggle()}
        label={enabled ? `Pause ${reminder.title}` : `Resume ${reminder.title}`}
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

  const enabled = reminder.isEnabled;

  return (
    <div
      className="
      rise-in
      border-b
      border-t
      border-[color:var(--surface-2)]

      "
    >

      <div className="relative p-5">
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
          {reminder.title}
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

          <Link
            to={`/reminders/${reminder.id}`}
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              text-[color:var(--text)]
              active:scale-90
            "
          >
            <div className="mt-4">
          <span
            className={`
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
            `}
          >
            VIEW
          </span>
        </div>
          </Link>
        </div>

      
          <span className="text-[13px] font-medium text-[color:var(--primary)]">
            {relative}
          </span>

      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const me = useMe();
  const reminders = useReminders();

  const today = useMemo(() => {
    const all = reminders.data ?? [];

    return all
      .filter((r) => {
        const iso = r.nextLocal ?? r.nextRunAt;

        return iso
          ? isToday(r.timezone, iso)
          : false;
      })
      .sort((a, b) => sortKey(a) - sortKey(b));
  }, [reminders.data]);

  const error =
    me.error?.message ||
    reminders.error?.message ||
    '';

  useErrorToast(error);

  const email = me.data?.email ?? '';
  const next = today[0];

  const todayLabel = new Date().toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
  );

  const displayName = email
    ? displayNameFromEmail(email)
    : 'RemindMe';

  return (
    <section
      className="
        relative
        min-h-screen
        overflow-x-hidden
        bg-[color:var(--bg)]
        px-4
        pb-44
        pt-3
        text-[color:var(--text)]
        antialiased
      "
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

   <div className="mb-4 pt-5 flex items-center justify-between">
     <div
              className="
                flex
                text-[25px]
                font-semibold
                text-[color:var(--text)]
            
              "
            >
              Call Reminder
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
            >
              +
            </Link>
            </div>
      {/* ------------------------------------------------------------------ */}
      {/* Main Content                                                       */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto max-w-xl">
        {reminders.isLoading ? (
          <div className="mt-5 flex flex-col gap-6 skeleton-area" aria-busy="true">
            {/* Hero */}
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

            {/* Today's schedule */}
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
        ) : today.length === 0 ? (
          /* -------------------------------------------------------------- */
          /* Empty State                                                    */
          /* -------------------------------------------------------------- */
        <div className="w-full flex flex-col items-center justify-center gap-3  p-6 text-center">
             <img src="./assets/schedule.png" width="auto" height="10vh" className="opacity-70" alt="Call icon">
</img>
            <div> No  Schedules Yet</div>
           
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-6">
            {/* ------------------------------------------------------------ */}
            {/* Hero                                                          */}
            {/* ------------------------------------------------------------ */}

            {next ? (
              <HeroCard reminder={next} />
            ) : null}

            {/* ------------------------------------------------------------ */}
            {/* Today's Schedule                                              */}
            {/* ------------------------------------------------------------ */}

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
                <div
                  className="stagger"
               >
                {today.map((r) => (
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
