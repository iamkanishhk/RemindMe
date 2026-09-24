import { useEffect, useState } from 'react';
import { usePhoneNumbers } from '../hooks/queries';
import { timezoneList } from '../lib/format';
import type { RepeatRule } from '../lib/types';
import type { ReminderInputBody } from '../hooks/queries';
import { ErrorBanner } from './ErrorBanner';
import { Spinner } from './Spinner';

export interface ReminderFormInitial {
  title: string;
  message: string;
  timezone: string;
  localDateTime: string;
  repeatRule: RepeatRule;
  phoneNumberId: string;
}

interface Props {
  initial: ReminderFormInitial;
  submitLabel: string;
  busy: boolean;
  error: string;
  onSubmit: (body: ReminderInputBody) => Promise<void> | void;
}

const DEFAULT_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export default function ReminderForm({ initial, submitLabel, busy, error, onSubmit }: Props) {
  const phoneQuery = usePhoneNumbers();
  const verifiedPhones = (phoneQuery.data ?? []).filter((p) => p.verified);

  const [title, setTitle] = useState(initial.title);
  const [message, setMessage] = useState(initial.message);
  const [timezone, setTimezone] = useState(initial.timezone || DEFAULT_TZ);
  const [localDateTime, setLocalDateTime] = useState(initial.localDateTime);
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(initial.repeatRule);
  const [phoneNumberId, setPhoneNumberId] = useState(initial.phoneNumberId);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!phoneNumberId && verifiedPhones.length > 0 && !verifiedPhones.some((p) => p.id === phoneNumberId)) {
      setPhoneNumberId(verifiedPhones[0]?.id ?? '');
    }
    // Keep the first verified phone as the default on first render only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedPhones.length]);

  function validate(): string {
    if (title.trim().length === 0) return 'Title is required';
    if (title.trim().length > 80) return 'Title must be 80 characters or fewer';
    if (message.trim().length === 0) return 'Message is required';
    if (message.trim().length > 500) return 'Message must be 500 characters or fewer';
    if (!localDateTime || isNaN(new Date(localDateTime).getTime())) return 'Pick a date and time';
    if (!timezone) return 'Select a timezone';
    if (!phoneNumberId) return 'Select a verified phone number';
    return '';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError('');
    void onSubmit({
      title: title.trim(),
      message: message.trim(),
      timezone,
      localDateTime,
      repeatRule,
      phoneNumberId
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <ErrorBanner message={error || localError} />

      <label className="field">
        <span className="label">Title</span>
        <input type="text" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Take the cake out of the oven" />
      </label>

      <label className="field">
        <span className="label">Message (read over the call)</span>
        <textarea value={message} maxLength={500} rows={3} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Hi! This is RemindMe reminding you: the cake should be done." />
      </label>

      <div className="field-row">
        <label className="field">
          <span className="label">Date &amp; time (local)</span>
          <input type="datetime-local" value={localDateTime} onChange={(e) => setLocalDateTime(e.target.value)} />
        </label>

        <label className="field">
          <span className="label">Repeat</span>
          <select value={repeatRule} onChange={(e) => setRepeatRule(e.target.value as RepeatRule)}>
            <option value="NONE">Once</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span className="label">Timezone</span>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          {timezoneList().map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="label">Call this verified number</span>
        {phoneQuery.isLoading ? (
          <Spinner label="Loading phone numbers…" />
        ) : verifiedPhones.length === 0 ? (
          <span className="field-note">
            No verified phone numbers yet. Add and verify one to schedule reminders.
          </span>
        ) : (
          <select value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)}>
            {verifiedPhones.map((p) => (
              <option key={p.id} value={p.id}>
                {p.e164}
              </option>
            ))}
          </select>
        )}
      </label>

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? <Spinner /> : submitLabel}
      </button>
    </form>
  );
}