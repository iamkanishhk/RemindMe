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
import type { RepeatRule } from '../lib/types';
import SubscribeSheet from '../components/SubscribeSheet';
import PhoneVerifyOnboarding from '../components/PhoneVerifyOnboarding';
import { useErrorToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';
import { ApiError } from '../lib/api';
import { GlassButton } from '../components/GlassButton';

const DEFAULT_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const DAYS = 14;

const REPEAT_OPTIONS: Array<{
  value: RepeatRule;
  label: string;
}> = [
  {
    value: 'NONE',
    label: 'Once'
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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function BellIcon() {
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function PhoneIcon() {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="4" rx="4" />
      <path d="M16 2v4M8 2v4M3 10h18" />
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
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Section Header Component                                                   */
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
    <div className="mb-2 flex items-center justify-between px-2">
      <div className="flex items-center gap-2 text-[color:var(--primary)]">
        {icon}
        <span className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[color:var(--text-dim)]">
          {title}
        </span>
      </div>
      {trailing && (
        <span className="text-[12px] font-medium text-[color:var(--text-faint)]">
          {trailing}
        </span>
      )}
    </div>
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
  const [dragging, setDragging] = useState(false);

  const drag = useRef<{
    startY: number;
    base: number;
  } | null>(null);

  const apply = (v: number) => onChange(normalize(v));

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!e.isPrimary) return;

    e.preventDefault();

    drag.current = {
      startY: e.clientY,
      base: current
    };

    setDragging(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture failures.
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;

    const step = Math.round((drag.current.startY - e.clientY) / 12);
    apply(drag.current.base + step);
  }

  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  function onWheel(e: ReactWheelEvent<HTMLDivElement>) {
    e.preventDefault();
    apply(current + (e.deltaY < 0 ? 1 : -1));
  }

  function stopPropagation(e: ReactPointerEvent<HTMLButtonElement>) {
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
        h-[84px]
        flex-1
        select-none
        touch-none
        flex-col
        items-center
        justify-center
        overflow-hidden
        rounded-[20px]
        border
        transition-all
        duration-200
      
      `}
    >
      <span className="pointer-events-none mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--text-dim)]">
        {label}
      </span>

      <span className="pointer-events-none text-[32px] font-bold tracking-tight text-[color:var(--text)] tabular-nums">
        {format(current)}
      </span>

      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-0.5 text-[color:var(--text-dim)]">
        <button
          type="button"
          tabIndex={-1}
          aria-label={label + ' up'}
          onPointerDown={stopPropagation}
          onClick={(e) => {
            e.stopPropagation();
            apply(current + 1);
          }}
          className="rounded-lg p-1.5 transition active:scale-90 hover:bg-[color:var(--surface-3)] hover:text-[color:var(--primary)]"
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
          className="rounded-lg p-1.5 transition active:scale-90 hover:bg-[color:var(--surface-3)] hover:text-[color:var(--primary)]"
        >
          <ChevronDownIcon />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Drag Scroll Hook                                                           */
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
        startX: e.pageX - target.offsetLeft,
        scrollLeft: target.scrollLeft
      };
    }

    function onUp() {
      state = null;
    }

    function onMove(e: MouseEvent) {
      if (!state || !state.down) return;
      e.preventDefault();
      const x = e.pageX - target.offsetLeft;
      target.scrollLeft = state.scrollLeft - (x - state.startX);
    }

    target.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);

    return () => {
      target.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return ref;
}

/* -------------------------------------------------------------------------- */
/* Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function ReminderNewPage() {
  const navigate = useNavigate();
  const phoneQuery = usePhoneNumbers();
  const create = useCreateReminder();

  const dates = useMemo(buildDates, []);
  const initial = useMemo(initialTime, []);
  const scrollRef = useDragScroll<HTMLDivElement>();

  const [dateIndex, setDateIndex] = useState(0);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initial.ampm);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [repeatRule, setRepeatRule] = useState<RepeatRule>('NONE');
  const timezone = DEFAULT_TZ;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [localError, setLocalError] = useState('');
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  const messageRef = useRef<HTMLTextAreaElement | null>(null);

  useErrorToast(error || localError);

  useEffect(() => {
    const el = messageRef.current;

    if (!el) return;

    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

  const verifiedPhones = (phoneQuery.data ?? []).filter((p) => p.verified);
  const verifiedPhone = verifiedPhones[0];
  const selected = dates[dateIndex] ?? dates[0]!;

  function buildBody(phoneNumberId: string): ReminderInputBody {
    const selectedDate = selected.date;
    const hh = pad(toHour24(hour, ampm));
    const mi = pad(minute);

    const localDateTime = `${selectedDate.getFullYear()}-${pad(
      selectedDate.getMonth() + 1
    )}-${pad(selectedDate.getDate())}T${hh}:${mi}`;

    return {
      title: title.trim(),
      message: message.trim(),
      timezone,
      localDateTime,
      repeatRule,
      phoneNumberId
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

    return '';
  }

  async function submitReminder(phoneNumberId: string) {
    setLocalError('');
    setBusy(true);
    setError('');
    setSubscriptionRequired(false);

    try {
      const reminder = await create.mutateAsync(buildBody(phoneNumberId));
      navigate(`/reminders/${reminder.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SUBSCRIPTION_REQUIRED') {
        setSubscriptionRequired(true);
      } else {
        setError(
          err instanceof Error ? err.message : 'Could not create reminder'
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function createReminder() {
    const problem = validate();
    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError('');

    if (!verifiedPhone) {
      setVerifyingPhone(true);
      return;
    }
    await submitReminder(verifiedPhone.id);
  }

  async function handlePhoneVerified() {
    setVerifyingPhone(false);

    const phones = await phoneQuery.refetch();
    const verified = (phones.data ?? []).find((p) => p.verified);
    if (verified) {
      await submitReminder(verified.id);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void createReminder();
  }

  return (
      <section className="min-h-screen bg-[color:var(--bg)] pb-28 pt-2 text-[color:var(--text)] antialiased selection:bg-[color:color-mix(in_srgb,var(--primary)_30%,transparent)]">
     

      <div className="relative z-10 mx-auto max-w-lg px-4">
        {/* ---------------------------------------------------------------- */}
        {/* Navigation Bar                                                   */}
        {/* ---------------------------------------------------------------- */}
        <header className="mt-20">

          <h1 className="text-[17px] font-bold tracking-tight text-[color:var(--text)]">
            New Reminder
          </h1>
          <div>
                      <button
                      type="button"
                      aria-label="Create reminder"
                      disabled={busy}
                      onClick={() => void createReminder()}
                      className="active:scale-[0.9]"
                      style={{
                                      width: 50,
                                      height: 50,
                                      borderRadius: 25,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '1px solid var(--primary)',
                                      top: 15,
                                      right: 15,
                                      position: 'fixed',
                                      backgroundColor: 'var(--primary)',
                                      fontSize: 24,
                                      color: 'white',
                                      lineHeight: 1,
                                      padding: 0,
                                      cursor: busy ? 'default' : 'pointer',
                                      opacity: busy ? 0.6 : 1,
                                      transition: 'transform 0.12s ease',
                                    }}>
                                    {busy ? <Spinner /> : '✓'}
                        </button>
                                    
                                       
                                     
                                             
                                               
                                                <GlassButton 
                         displacementScale={64}
                         saturation={130}
                         aberrationIntensity={2}
                         elasticity={0.35}
                         cornerRadius={100}
                        blurAmount={0.1}
                        padding="15px"
                        style={{ 
                          width: 15,
                          height: 15,
                          top: 20,
                          left: 30,
                          position: 'fixed',
                         }}
                          >
                          <Link to="/" className="ios-back">
                        <span className="ios-back-icon text-[color:var(--text)] p-2">‹</span>
                      </Link>
                                </GlassButton>
          </div>
          
          <div className="h-10 w-10" aria-hidden="true" />
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* ---------------------------------------------------------- */}
            {/* Time Picker                                                */}
            {/* ---------------------------------------------------------- */}

            <section>

              <div className="">
                <div className="flex items-center gap-2">
                  <ScrubBox
                    label="Hour"
                    current={hour}
                    onChange={setHour}
                    normalize={normHour}
                    format={pad}
                  />

                  <span
                    className="select-none text-[28px] font-light text-[color:var(--text-dim)]"
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
                    aria-pressed={ampm === 'PM'}
                    aria-label="Toggle AM/PM"
                    onClick={() => setAmpm((a) => (a === 'AM' ? 'PM' : 'AM'))}
                    className="flex h-[84px] w-[76px] shrink-0 flex-col items-center justify-center rounded-[20px] border transition-all duration-200 active:scale-95 hover:border-[color:color-mix(in_srgb,var(--primary)_50%,transparent)] "
                  >
                  
                    <span className="mt-0.5 text-[20px] font-bold text-[color:var(--secondary)] tabular-nums">
                      {ampm}
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* Date Scroller                                              */}
            {/* ---------------------------------------------------------- */}

            <section>
            
              <div
                ref={scrollRef}
                className="no-scrollbar flex cursor-grab gap-2.5 overflow-x-auto py-1 active:cursor-grabbing"
              >
                {dates.map((d, i) => {
                  const isSelected = i === dateIndex;

                  return (
                    <button
                      key={d.date.toISOString()}
                      type="button"
                      onClick={() => setDateIndex(i)}
                      aria-pressed={isSelected}
                      className={`
                        flex
                        min-w-[76px]
                        shrink-0
                        flex-col
                        items-center
                        justify-center
                        rounded-[20px]
                        border
                        px-3.5
                        py-3
                        transition-all
                        duration-200
                        active:scale-95
                        ${
                          isSelected
                            ? 'border-[color:color-mix(in_srgb,var(--primary)_70%,var(--on-primary))]  text-[color:var(--on-primary)] '
                            : ''
                        }
                      `}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          isSelected
          ? 'text-[color:color-mix(in_srgb,var(--on-primary)_80%,transparent)]'
          : 'text-[color:var(--text-dim)]'
                        }`}
                      >
                        {d.label}
                      </span>

                      <span
                        className={`mt-1 text-[13px] font-bold ${
                          isSelected ? 'text-[color:var(--on-primary)]' : 'text-[color:var(--text)]'
                        }`}
                      >
                        {d.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* Details Section                                            */}
            {/* ---------------------------------------------------------- */}

            <section>

              <div className="overflow-hidden rounded-[20px] border border-[color:var(--border-soft)] bg-[color:var(--surface)]">
                <div className="p-4">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <label
                      htmlFor="reminder-title"
                      className="text-[13px] font-semibold text-[color:var(--text-dim)]"
                    >
                      Title
                    </label>

                    <span className="text-[12px] tabular-nums text-[color:var(--text-faint)]">
                      {title.length}/80
                    </span>
                  </div>

                  <input
                    id="reminder-title"
                    type="text"
                    value={title}
                    maxLength={80}
                    enterKeyHint="next"
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Take the cake out"
                    className="w-full rounded-[14px] border border-[color:var(--border-soft)] bg-[color:var(--surface-2)] px-4 py-3 text-[16px] font-normal leading-[1.45] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] outline-none "
                  />
                </div>

                <div className="mx-4 border-t border-[color:var(--border-soft)]" />

                <div className="p-4">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <label
                      htmlFor="reminder-message"
                      className="text-[13px] font-semibold text-[color:var(--text-dim)]"
                    >
                      Message
                    </label>

                    <span
                      className={`text-[12px] tabular-nums ${
                        message.length > 450
                          ? 'text-[color:var(--warning)]'
                          : 'text-[color:var(--text-faint)]'
                      }`}
                    >
                      {message.length}/500
                    </span>
                  </div>

                  <textarea
                    id="reminder-message"
                    ref={messageRef}
                    rows={2}
                    maxLength={500}
                    enterKeyHint="done"
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What we'll read over the call"
                    className="max-h-[40vh] min-h-[76px] w-full resize-none overflow-hidden rounded-[14px] border border-[color:var(--border-soft)] bg-[color:var(--surface-2)] px-4 py-3 text-[16px] font-normal leading-[1.5] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--primary)_30%,transparent)]"
                  />
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* Repeat                                                     */}
            {/* ---------------------------------------------------------- */}

            <section>


              <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_60%,transparent)] p-1.5 backdrop-blur-xl">
                <div className="grid grid-cols-3 gap-1">
                  {REPEAT_OPTIONS.map((opt) => {
                    const isSelected = repeatRule === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setRepeatRule(opt.value)}
                        className={`
                          min-h-[42px]
                          rounded-[14px]
                          px-3
                          py-2
                          text-[13px]
                          font-semibold
                          transition-all
                          duration-200
                          active:scale-95
                          ${
                            isSelected
        ? 'bg-[color:var(--surface-3)] text-[color:var(--text)] shadow-md'
        : 'text-[color:var(--text-dim)] hover:text-[color:var(--text)]'
                          }
                        `}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </form>

        <SubscribeSheet
          open={subscriptionRequired}
          onClose={() => setSubscriptionRequired(false)}
        />

        {verifyingPhone && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[color:var(--bg)]">
            <PhoneVerifyOnboarding
              onVerified={() => void handlePhoneVerified()}
              onClose={() => setVerifyingPhone(false)}
            />
          </div>
        )}
      </div>
    </section>
  );
}