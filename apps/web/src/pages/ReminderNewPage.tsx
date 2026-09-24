import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useCreateReminder,
  usePhoneNumbers,
  type ReminderInputBody
} from '../hooks/queries';
import { timezoneList } from '../lib/format';
import type { RepeatRule } from '../lib/types';
import { SubscribePrompt } from '../components/SubscribePrompt';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { ApiError } from '../lib/api';

const DEFAULT_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const DAYS = 14;

const REPEAT_OPTIONS: Array<{
  value: RepeatRule;
  label: string;
}> = [
  {
    value: 'NONE',
    label: 'Does not repeat'
  },
  {
    value: 'DAILY',
    label: 'Daily'
  },
  {
    value: 'WEEKLY',
    label: 'Weekly'
  }
];

const inputCls = `
  w-full
  rounded-[13px]
  border
  border-[#38383A]
  bg-[#1C1C1E]
  px-3.5
  py-3
  text-[15px]
  font-medium
  text-[#F2F2F7]
  outline-none
  placeholder:text-[#636366]
  transition
  focus:border-[#0A84FF]
  focus:ring-2
  focus:ring-[#0A84FF]/20
`;

const pad = (v: number) => String(v).padStart(2, '0');

const normRound = (v: number, mod: number) =>
  ((v % mod) + mod) % mod;

const normHour = (v: number) =>
  normRound(v - 1, 12) + 1;

const normMinute = (v: number) =>
  normRound(v, 60);

function toHour24(
  hour: number,
  ampm: 'AM' | 'PM'
): number {
  const h = hour % 12;
  return ampm === 'PM' ? h + 12 : h;
}

function initialTime() {
  const d = new Date();

  d.setMinutes(
    d.getMinutes() +
      15 -
      (d.getMinutes() % 15)
  );

  const h24 = d.getHours();

  return {
    hour:
      h24 % 12 === 0
        ? 12
        : h24 % 12,

    minute: d.getMinutes() % 60,

    ampm:
      h24 >= 12
        ? ('PM' as const)
        : ('AM' as const)
  };
}

function buildDates() {
  const out: Array<{
    date: Date;
    label: string;
    sub: string;
  }> = [];

  const now = new Date();

  for (let i = 0; i < DAYS; i++) {
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + i
    );

    const label =
      i === 0
        ? 'Today'
        : i === 1
          ? 'Tomorrow'
          : d.toLocaleDateString(
              'en-US',
              {
                weekday: 'short'
              }
            );

    const sub = d.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    );

    out.push({
      date: d,
      label,
      sub
    });
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className="h-[17px] w-[17px]"
      aria-hidden="true"
    >
      <path d="M310.6 105.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L179.3 256l176.6 105.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0l-192-160c-12.5-12.5-12.5-32.8 0-45.3l192-160z" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      viewBox="0 0 448 512"
      fill="currentColor"
      className="h-2.5 w-2.5"
      aria-hidden="true"
    >
      <path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 61.7 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 448 512"
      fill="currentColor"
      className="h-2.5 w-2.5"
      aria-hidden="true"
    >
      <path d="M214.6 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 61.7 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 448 512"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M224 0c-17.7 0-32 14.3-32 32V51.2C119 66 64 130.6 64 208v25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm0 96c61.9 0 112 50.1 112 112v25.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V208c0-61.9 50.1-112 112-112zM288 448a64 64 0 1 1-128 0H288z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
      />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 2 1.5-4A7.5 7.5 0 1 1 20 11.5Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Scrub Box                                                                  */
/* -------------------------------------------------------------------------- */

function ScrubBox({
  label,
  current,
  onChange,
  normalize,
  format
}: {
  label: string;
  current: number;
  onChange: (v: number) => void;
  normalize: (v: number) => number;
  format: (v: number) => string;
}) {
  const [dragging, setDragging] =
    useState(false);

  const drag = useRef<{
    startY: number;
    base: number;
  } | null>(null);

  const apply = (v: number) =>
    onChange(normalize(v));

  function onPointerDown(
    e: ReactPointerEvent<HTMLDivElement>
  ) {
    if (!e.isPrimary) return;

    e.preventDefault();

    drag.current = {
      startY: e.clientY,
      base: current
    };

    setDragging(true);

    try {
      e.currentTarget.setPointerCapture(
        e.pointerId
      );
    } catch {
      // Ignore pointer capture failures.
    }
  }

  function onPointerMove(
    e: ReactPointerEvent<HTMLDivElement>
  ) {
    if (!drag.current) return;

    const step = Math.round(
      (drag.current.startY - e.clientY) /
        12
    );

    apply(
      drag.current.base + step
    );
  }

  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  function onWheel(
    e: ReactWheelEvent<HTMLDivElement>
  ) {
    e.preventDefault();

    apply(
      current +
        (e.deltaY < 0 ? 1 : -1)
    );
  }

  function stopPropagation(
    e: ReactPointerEvent<HTMLButtonElement>
  ) {
    e.stopPropagation();
  }

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`${label} ${format(current)}`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          apply(current + 1);
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          apply(current - 1);
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
      className={`
        relative
        flex
        h-[76px]
        flex-1
        select-none
        touch-none
        flex-col
        items-center
        justify-center
        overflow-hidden
        rounded-[16px]
        border
        transition-all
        duration-150
        ${
          dragging
            ? 'border-[#0A84FF] bg-[#252527] shadow-[0_0_0_2px_rgba(10,132,255,0.12)]'
            : 'border-[#38383A] bg-[#1C1C1E]'
        }
      `}
    >
      <span
        className="
          pointer-events-none
          mb-0.5
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.08em]
          text-[#636366]
        "
      >
        {label}
      </span>

      <span
        className="
          pointer-events-none
          text-[26px]
          leading-7
          font-semibold
          tracking-[-0.03em]
          text-[#F2F2F7]
          tabular-nums
        "
      >
        {format(current)}
      </span>

      <span
        className="
          absolute
          right-2
          top-1/2
          flex
          -translate-y-1/2
          flex-col
          text-[#636366]
        "
        aria-hidden="true"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={label + ' up'}
          onPointerDown={stopPropagation}
          onClick={(e) => {
            e.stopPropagation();
            apply(current + 1);
          }}
          className="
            rounded-md
            p-1
            transition
            hover:bg-[#2C2C2E]
            hover:text-[#0A84FF]
          "
        >
          <ChevronUpIcon />
        </button>

        <button
          type="button"
          tabIndex={-1}
          aria-label={label + ' down'}
          onPointerDown={stopPropagation}
          onClick={(e) => {
            e.stopPropagation();
            apply(current - 1);
          }}
          className="
            rounded-md
            p-1
            transition
            hover:bg-[#2C2C2E]
            hover:text-[#0A84FF]
          "
        >
          <ChevronDownIcon />
        </button>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Drag Scroll                                                                */
/* -------------------------------------------------------------------------- */

function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const target = el;

    let state: {
      down: boolean;
      startX: number;
      scrollLeft: number;
    } | null = null;

    function onDown(e: MouseEvent) {
      state = {
        down: true,
        startX:
          e.pageX - target.offsetLeft,
        scrollLeft: target.scrollLeft
      };
    }

    function onUp() {
      state = null;
    }

    function onMove(e: MouseEvent) {
      if (!state || !state.down) return;

      e.preventDefault();

      const x =
        e.pageX - target.offsetLeft;

      target.scrollLeft =
        state.scrollLeft -
        (x - state.startX);
    }

    target.addEventListener(
      'mousedown',
      onDown
    );

    window.addEventListener(
      'mouseup',
      onUp
    );

    window.addEventListener(
      'mousemove',
      onMove
    );

    return () => {
      target.removeEventListener(
        'mousedown',
        onDown
      );

      window.removeEventListener(
        'mouseup',
        onUp
      );

      window.removeEventListener(
        'mousemove',
        onMove
      );
    };
  }, []);

  return ref;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ReminderNewPage() {
  const navigate = useNavigate();

  const phoneQuery =
    usePhoneNumbers();

  const create =
    useCreateReminder();

  const dates = useMemo(
    buildDates,
    []
  );

  const initial = useMemo(
    initialTime,
    []
  );

  const scrollRef =
    useDragScroll<HTMLDivElement>();

  const [dateIndex, setDateIndex] =
    useState(0);

  const [hour, setHour] =
    useState(initial.hour);

  const [minute, setMinute] =
    useState(initial.minute);

  const [ampm, setAmpm] =
    useState<'AM' | 'PM'>(
      initial.ampm
    );

  const [title, setTitle] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [repeatRule, setRepeatRule] =
    useState<RepeatRule>('NONE');

  const [timezone, setTimezone] =
    useState(DEFAULT_TZ);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState('');

  const [localError, setLocalError] =
    useState('');

  const [
    subscriptionRequired,
    setSubscriptionRequired
  ] = useState(false);

  const verifiedPhones =
    (phoneQuery.data ?? []).filter(
      (p) => p.verified
    );

  const verifiedPhone =
    verifiedPhones[0];

  const selected =
    dates[dateIndex] ??
    dates[0]!;

  function buildBody(): ReminderInputBody {
    const selectedDate =
      selected.date;

    const hh = pad(
      toHour24(hour, ampm)
    );

    const mi = pad(minute);

    const localDateTime =
      `${selectedDate.getFullYear()}-${pad(
        selectedDate.getMonth() + 1
      )}-${pad(
        selectedDate.getDate()
      )}T${hh}:${mi}`;

    return {
      title: title.trim(),
      message: message.trim(),
      timezone,
      localDateTime,
      repeatRule,
      phoneNumberId:
        verifiedPhone?.id ?? ''
    };
  }

  function validate(): string {
    if (title.trim().length === 0) {
      return 'Title is required';
    }

    if (title.trim().length > 80) {
      return 'Title must be 80 characters or fewer';
    }

    if (message.trim().length === 0) {
      return 'Message is required';
    }

    if (message.trim().length > 500) {
      return 'Message must be 500 characters or fewer';
    }

    if (!verifiedPhone) {
      return 'Add and verify a phone number to schedule reminders';
    }

    return '';
  }

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    const problem = validate();

    if (problem) {
      setLocalError(problem);
      return;
    }

    setLocalError('');
    setBusy(true);
    setError('');
    setSubscriptionRequired(false);

    try {
      const reminder =
        await create.mutateAsync(
          buildBody()
        );

      navigate(
        `/reminders/${reminder.id}`,
        {
          replace: true
        }
      );
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.code ===
          'SUBSCRIPTION_REQUIRED'
      ) {
        setSubscriptionRequired(
          true
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not create reminder'
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="
        min-h-screen
        overflow-x-hidden
        bg-[#000000]
        px-4
        pb-10
        pt-2
        text-[#F2F2F7]
        antialiased
      "
    >
      <div className="mx-auto max-w-xl">
        {/* ---------------------------------------------------------------- */}
        {/* Navigation                                                       */}
        {/* ---------------------------------------------------------------- */}

        <div
          className="
            flex
            h-12
            items-center
            justify-between
          "
        >
          <Link
            to="/"
            aria-label="Back to dashboard"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              text-[#0A84FF]
              transition
              hover:bg-[#1C1C1E]
              active:scale-90
            "
          >
            <ChevronLeftIcon />
          </Link>

          <h1
            className="
              text-[17px]
              font-semibold
              tracking-[-0.01em]
              text-[#F2F2F7]
            "
          >
            New Reminder
          </h1>

          <div
            className="h-9 w-9"
            aria-hidden="true"
          />
        </div>

        {subscriptionRequired ? (
          <div className="mt-4">
            <SubscribePrompt />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-5 pb-8">
              <ErrorBanner
                message={
                  error || localError
                }
              />

              {/* ---------------------------------------------------------- */}
              {/* Time                                                         */}
              {/* ---------------------------------------------------------- */}

              <section>
                <SectionHeader
                  icon={<ClockIcon />}
                  title="Time"
                />

                <div
                  className="
                    rounded-[22px]
                    border
                    border-[#2C2C2E]
                    bg-[#1C1C1E]
                    p-3
                  "
                >
                  <div className="flex items-center gap-2">
                    <ScrubBox
                      label="Hour"
                      current={hour}
                      onChange={setHour}
                      normalize={normHour}
                      format={pad}
                    />

                    <span
                      className="
                        select-none
                        text-[25px]
                        font-semibold
                        text-[#636366]
                      "
                      aria-hidden="true"
                    >
                      :
                    </span>

                    <ScrubBox
                      label="Minute"
                      current={minute}
                      onChange={setMinute}
                      normalize={normMinute}
                      format={pad}
                    />

                    <button
                      type="button"
                      aria-pressed={
                        ampm === 'PM'
                      }
                      aria-label="Toggle AM/PM"
                      onClick={() =>
                        setAmpm((a) =>
                          a === 'AM'
                            ? 'PM'
                            : 'AM'
                        )
                      }
                      className="
                        h-[76px]
                        w-[72px]
                        shrink-0
                        rounded-[16px]
                        border
                        border-[#38383A]
                        bg-[#1C1C1E]
                        transition
                        hover:border-[#0A84FF]
                        active:scale-[0.96]
                      "
                    >
                      <span
                        className="
                          block
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-[0.08em]
                          text-[#636366]
                        "
                      >
                        Period
                      </span>

                      <span
                        className="
                          mt-0.5
                          block
                          text-[18px]
                          font-semibold
                          text-[#0A84FF]
                        "
                      >
                        {ampm}
                      </span>
                    </button>
                  </div>
                </div>
              </section>

              {/* ---------------------------------------------------------- */}
              {/* Date                                                         */}
              {/* ---------------------------------------------------------- */}

              <section>
                <SectionHeader
                  icon={<CalendarIcon />}
                  title="Scheduled Date"
                  trailing="Next 2 weeks"
                />

                <div
                  ref={scrollRef}
                  className="
                    no-scrollbar
                    flex
                    cursor-grab
                    gap-2
                    overflow-x-auto
                    py-1
                    active:cursor-grabbing
                  "
                >
                  {dates.map(
                    (d, i) => {
                      const selected =
                        i === dateIndex;

                      return (
                        <button
                          key={d.date.toISOString()}
                          type="button"
                          onClick={() =>
                            setDateIndex(i)
                          }
                          aria-pressed={
                            selected
                          }
                          className={`
                            flex
                            min-w-[68px]
                            shrink-0
                            flex-col
                            items-center
                            justify-center
                            rounded-[15px]
                            border
                            px-3
                            py-2.5
                            transition-all
                            ${
                              selected
                                ? `
                                  border-[#0A84FF]
                                  bg-[#0A84FF]
                                  text-white
                                  shadow-[0_7px_20px_rgba(10,132,255,0.22)]
                                `
                                : `
                                  border-[#38383A]
                                  bg-[#1C1C1E]
                                  text-[#8E8E93]
                                  hover:border-[#48484A]
                                `
                            }
                          `}
                        >
                          <span
                            className={`
                              text-[10px]
                              font-semibold
                              uppercase
                              tracking-[0.02em]
                              ${
                                selected
                                  ? 'text-white/75'
                                  : 'text-[#636366]'
                              }
                            `}
                          >
                            {d.label}
                          </span>

                          <span
                            className={`
                              mt-0.5
                              text-[12px]
                              font-semibold
                              ${
                                selected
                                  ? 'text-white'
                                  : 'text-[#F2F2F7]'
                              }
                            `}
                          >
                            {d.sub}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </section>

              {/* ---------------------------------------------------------- */}
              {/* Details                                                      */}
              {/* ---------------------------------------------------------- */}

              <section>
                <SectionHeader
                  icon={<MessageIcon />}
                  title="Details"
                />

                <div
                  className="
                    overflow-hidden
                    rounded-[20px]
                    border
                    border-[#2C2C2E]
                    bg-[#1C1C1E]
                  "
                >
                  <div className="px-4 pt-3.5 pb-3">
                    <label
                      htmlFor="reminder-title"
                      className="
                        mb-2
                        block
                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-[0.06em]
                        text-[#636366]
                      "
                    >
                      Reminder title
                    </label>

                    <input
                      id="reminder-title"
                      type="text"
                      value={title}
                      maxLength={80}
                      onChange={(e) =>
                        setTitle(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Take the cake out of the oven"
                      className={inputCls}
                    />
                  </div>

                  <div
                    className="
                      mx-4
                      border-t
                      border-[#38383A]
                    "
                  />

                  <div className="px-4 pt-3 pb-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="reminder-message"
                        className="
                          text-[11px]
                          font-semibold
                          uppercase
                          tracking-[0.06em]
                          text-[#636366]
                        "
                      >
                        Message
                      </label>

                      <span
                        className="
                          text-[10px]
                          font-medium
                          text-[#636366]
                        "
                      >
                        {message.length}/500
                      </span>
                    </div>

                    <textarea
                      id="reminder-message"
                      rows={3}
                      maxLength={500}
                      value={message}
                      onChange={(e) =>
                        setMessage(
                          e.target.value
                        )
                      }
                      placeholder="What we'll read over the call"
                      className={
                        inputCls +
                        ' resize-none'
                      }
                    />
                  </div>
                </div>
              </section>

              {/* ---------------------------------------------------------- */}
              {/* Repeat                                                        */}
              {/* ---------------------------------------------------------- */}

              <section>
                <SectionHeader
                  title="Repeat"
                />

                <div
                  className="
                    rounded-[15px]
                    border
                    border-[#2C2C2E]
                    bg-[#1C1C1E]
                    p-1
                  "
                >
                  <div className="grid grid-cols-3 gap-1">
                    {REPEAT_OPTIONS.map(
                      (opt) => {
                        const selected =
                          repeatRule ===
                          opt.value;

                        return (
                          <button
                            key={
                              opt.value
                            }
                            type="button"
                            aria-pressed={
                              selected
                            }
                            onClick={() =>
                              setRepeatRule(
                                opt.value
                              )
                            }
                            className={`
                              min-h-[38px]
                              rounded-[11px]
                              px-2
                              py-2
                              text-[12px]
                              font-semibold
                              transition-all
                              ${
                                selected
                                  ? `
                                    bg-[#3A3A3C]
                                    text-[#F2F2F7]
                                    shadow-sm
                                  `
                                  : `
                                    text-[#8E8E93]
                                    hover:text-[#F2F2F7]
                                  `
                              }
                            `}
                          >
                            {opt.label}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </section>

              {/* ---------------------------------------------------------- */}
              {/* Timezone                                                      */}
              {/* ---------------------------------------------------------- */}

              <section>
                <SectionHeader
                  title="Timezone"
                />

                <select
                  id="reminder-timezone"
                  value={timezone}
                  onChange={(e) =>
                    setTimezone(
                      e.target.value
                    )
                  }
                  className={`
                    ${inputCls}
                    appearance-none
                  `}
                >
                  {timezoneList().map(
                    (tz) => (
                      <option
                        key={tz}
                        value={tz}
                        className="bg-[#1C1C1E]"
                      >
                        {tz}
                      </option>
                    )
                  )}
                </select>
              </section>

              {/* ---------------------------------------------------------- */}
              {/* Preview                                                       */}
              {/* ---------------------------------------------------------- */}

              {phoneQuery.isLoading ? (
                <div
                  className="
                    rounded-[18px]
                    border
                    border-[#2C2C2E]
                    bg-[#1C1C1E]
                    p-4
                  "
                >
                  <Spinner label="Checking phone numbers…" />
                </div>
              ) : !verifiedPhone ? (
                <div
                  className="
                    rounded-[18px]
                    border
                    border-[#5A4215]
                    bg-[#211B0C]
                    p-4
                  "
                >
                  <div className="flex gap-3">
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[#FF9F0A]/15
                        text-[#FF9F0A]
                      "
                    >
                      <PhoneIcon />
                    </div>

                    <p
                      className="
                        text-[13px]
                        leading-5
                        font-medium
                        text-[#FFD60A]
                      "
                    >
                      No verified phone
                      numbers yet. Add
                      and verify one to
                      schedule reminders.
                      Your verified
                      number is used
                      automatically.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="
                    rounded-[18px]
                    border
                    border-[#1D4B70]
                    bg-[#102333]
                    p-4
                  "
                >
              
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/* Submit                                                        */}
              {/* ---------------------------------------------------------- */}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={
                    busy ||
                    !verifiedPhone
                  }
                  className="
                    flex
                    min-h-[52px]
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-[16px]
                    bg-[#0A84FF]
                    px-5
                    py-3
                    text-[15px]
                    font-semibold
                    text-white
                    shadow-[0_10px_30px_rgba(10,132,255,0.25)]
                    transition-all
                    hover:bg-[#2190FF]
                    active:scale-[0.985]
                    disabled:cursor-not-allowed
                    disabled:opacity-45
                    disabled:shadow-none
                  "
                >
                  <BellIcon />

                  <span>
                    {busy
                      ? 'Scheduling…'
                      : 'Schedule Reminder'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section Header                                                             */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  icon,
  title,
  trailing
}: {
  icon?: React.ReactNode;
  title: string;
  trailing?: string;
}) {
  return (
    <div
      className="
        mb-2
        flex
        items-center
        gap-1.5
        px-1
      "
    >
      {icon ? (
        <span className="text-[#636366]">
          {icon}
        </span>
      ) : null}

      <span
        className="
          text-[12px]
          font-semibold
          text-[#8E8E93]
        "
      >
        {title}
      </span>

      {trailing ? (
        <span
          className="
            ml-auto
            text-[10px]
            font-medium
            text-[#636366]
          "
        >
          {trailing}
        </span>
      ) : null}
    </div>
  );
}
