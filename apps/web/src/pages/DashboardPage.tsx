import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMe, useReminders, useUpdateReminder } from '../hooks/queries';
import { formatRelative, formatTime, isToday, repeatLabel } from '../lib/format';
import type { Reminder } from '../lib/types';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';

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

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 448 512"
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

function IOSSwitch({
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
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={busy}
      onClick={onClick}
      className={`
        relative
        h-[31px]
        w-[51px]
        shrink-0
        rounded-full
        transition-all
        duration-200
        ease-out
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-blue-500/70
        disabled:opacity-50
        ${enabled ? 'bg-[#34C759]' : 'bg-[#39393D]'}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          absolute
          top-[2px]
          left-[2px]
          h-[27px]
          w-[27px]
          rounded-full
          bg-white
          shadow-[0_2px_5px_rgba(0,0,0,0.35)]
          transition-transform
          duration-200
          ease-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
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
        min-h-[76px]
        bg-[#1C1C1E]
        border-b
        border-[#38383A]
        last:border-b-0
        transition-colors
        ${!enabled ? 'opacity-50' : ''}
      `}
    >
      <Link
        to={`/reminders/${reminder.id}`}
        className="min-w-0 flex-1"
      >
        <div className="flex items-baseline gap-1.5">
          <span
            className={`
              text-[18px]
              leading-none
              font-semibold
              tracking-[-0.02em]
              tabular-nums
              ${enabled ? 'text-white' : 'text-[#8E8E93]'}
            `}
          >
            {hour}
          </span>

          <span
            className={`
              text-[12px]
              font-medium
              ${enabled ? 'text-[#8E8E93]' : 'text-[#636366]'}
            `}
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
            ${enabled ? 'text-[#F2F2F7]' : 'text-[#8E8E93]'}
          `}
        >
          {reminder.title}
        </p>

        <p
          className="
            mt-0.5
            truncate
            text-[11px]
            leading-[15px]
            font-medium
            text-[#636366]
          "
        >
          {repeatLabel(reminder.repeatRule)}
          {' · '}
          {reminder.phoneNumber?.e164 ?? 'No phone'}
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
        relative
        overflow-hidden
        rounded-[28px]
        bg-[#1C1C1E]
        border
        border-[#2C2C2E]
        shadow-[0_18px_50px_rgba(0,0,0,0.25)]
      "
    >
      {/* Subtle iOS-style blue glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-16
          -top-24
          h-48
          w-48
          rounded-full
          bg-[#0A84FF]/10
          blur-3xl
        "
      />

      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <span
            className="
              text-[12px]
              font-semibold
              tracking-[0.01em]
              text-[#0A84FF]
            "
          >
            Next reminder
          </span>

          <span
            className="
              rounded-full
              bg-[#2C2C2E]
              px-2.5
              py-1
              text-[10px]
              font-semibold
              text-[#8E8E93]
            "
          >
            Today
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-baseline gap-2">
            <span
              className="
                text-[48px]
                leading-none
                font-semibold
                tracking-[-0.045em]
                text-white
                tabular-nums
              "
            >
              {hour}
            </span>

            <span
              className="
                text-[19px]
                font-medium
                tracking-[-0.01em]
                text-[#8E8E93]
              "
            >
              {meridiem}
            </span>
          </div>

          <Link
            to={`/reminders/${reminder.id}`}
            aria-label="View reminder"
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              text-white

              active:scale-90
            "
          >
            <PhoneIcon />
          </Link>
        </div>

        <h2
          className="
            mt-4
            truncate
            text-[17px]
            leading-[22px]
            font-semibold
            tracking-[-0.01em]
            text-[#F2F2F7]
          "
        >
          {reminder.title}
        </h2>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[13px] font-medium text-[#8E8E93]">
            Today
          </span>

          <span
            aria-hidden="true"
            className="text-[#48484A]"
          >
            •
          </span>

          <span className="text-[13px] font-medium text-[#0A84FF]">
            {relative}
          </span>
        </div>

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
              ${
                enabled
                  ? 'bg-[#123D24] text-[#30D158]'
                  : 'bg-[#2C2C2E] text-[#8E8E93]'
              }
            `}
          >
            {enabled ? (
              <CheckCircleIcon />
            ) : (
              <PauseIcon />
            )}

            {enabled ? 'Call scheduled' : 'Call paused'}
          </span>
        </div>

        <Link
          to={`/reminders/${reminder.id}`}
          className="
            mt-5
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-[14px]
            bg-[#2C2C2E]
            py-3
            text-[14px]
            font-semibold
            text-[#0A84FF]
            transition
            hover:bg-[#3A3A3C]
            active:scale-[0.98]
          "
        >
          <span>View reminder</span>
          <ChevronIcon />
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
        bg-[#000000]
        px-4
        pb-44
        pt-3
        text-[#F2F2F7]
        antialiased
      "
    >
      <ErrorBanner message={error} />

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto flex max-w-xl items-center justify-between py-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-[#2C2C2E]
                text-[17px]
                font-semibold
                text-white
                ring-1
                ring-white/[0.08]
              "
            >
              {email
                ? displayName.charAt(0).toUpperCase()
                : 'R'}
            </div>

            <span
              className="
                absolute
                bottom-0
                right-0
                h-3
                w-3
                rounded-full
                border-2
                border-black
                bg-[#30D158]
              "
            />
          </div>

          <div className="min-w-0">
            <span
              className="
                block
                text-[12px]
                leading-4
                font-medium
                text-[#8E8E93]
              "
            >
              {greetingLabel()}
            </span>

            <h1
              className="
                truncate
                text-[17px]
                leading-[21px]
                font-semibold
                tracking-[-0.01em]
                text-[#F2F2F7]
              "
            >
              {displayName}
            </h1>
          </div>
        </div>

        <span
          className="
            ml-3
            shrink-0
            rounded-full
            bg-[#1C1C1E]
            px-3
            py-1.5
            text-[12px]
            font-medium
            text-[#8E8E93]
            ring-1
            ring-white/[0.05]
          "
        >
          {todayLabel}
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main Content                                                       */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto max-w-xl">
        {reminders.isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner label="Loading schedules…" />
          </div>
        ) : today.length === 0 ? (
          /* -------------------------------------------------------------- */
          /* Empty State                                                    */
          /* -------------------------------------------------------------- */
          <div
            className="
              mt-5
              rounded-[28px]
              border
              border-[#2C2C2E]
              bg-[#1C1C1E]
              px-6
              py-10
              text-center
            "
          >
            <div
              className="
                mx-auto
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-[#0A84FF]/15
                text-[#0A84FF]
              "
            >
              <BellIcon />
            </div>

            <h3
              className="
                mt-5
                text-[17px]
                font-semibold
                tracking-[-0.01em]
                text-[#F2F2F7]
              "
            >
              No schedules today
            </h3>

            <p
              className="
                mx-auto
                mt-1.5
                max-w-[280px]
                text-[14px]
                leading-5
                font-normal
                text-[#8E8E93]
              "
            >
              Nothing planned yet. Schedule a call reminder to get started.
            </p>

            <Link
              to="/reminders/new"
              className="
                mt-6
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-[14px]
                bg-[#0A84FF]
                px-5
                py-3
                text-[14px]
                font-semibold
                text-white
                shadow-[0_8px_24px_rgba(10,132,255,0.22)]
                transition-all
                hover:bg-[#2190FF]
                active:scale-[0.97]
              "
            >
              <PlusIcon />
              <span>Create reminder</span>
            </Link>
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
                      text-[#F2F2F7]
                    "
                  >
                    Today&apos;s schedule
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="
                      text-[12px]
                      font-medium
                      text-[#0A84FF]
                    "
                  >
                    Today
                  </span>

                  <span
                    className="
                      text-[11px]
                      font-medium
                      text-[#636366]
                    "
                  >
                    {today.length}{' '}
                    {today.length === 1 ? 'call' : 'calls'}
                  </span>
                </div>
              </div>

              {/* iOS grouped list */}
              <div
                className="
                  overflow-hidden
                  rounded-[18px]
                  border
                  border-[#2C2C2E]
                  bg-[#1C1C1E]
                "
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

      {/* ------------------------------------------------------------------ */}
      {/* Floating Action Button                                             */}
      {/* ------------------------------------------------------------------ */}

      <Link
        to="/reminders/new"
        className="
          fixed
          bottom-6
          right-5
          z-20
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-[#0A84FF]
          text-white
          shadow-[0_10px_35px_rgba(10,132,255,0.38)]
          ring-1
          ring-white/10
          transition-all
          duration-150
          hover:bg-[#2190FF]
          active:scale-90
        "
        aria-label="Create new reminder"
      >
        <PlusIcon />
      </Link>
    </section>
  );
}
