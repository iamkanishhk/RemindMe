import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMe, useReminders, useUpdateReminder } from '../hooks/queries';
import { dayGroupKey, formatRelative, formatTime, isUpcoming, repeatLabel } from '../lib/format';
import type { Reminder } from '../lib/types';
import { StatusChip } from '../components/StatusChip';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';

type Filter = 'all' | 'upcoming';

function sortKey(r: Reminder): number {
  return r.nextRunAt ? new Date(r.nextRunAt).getTime() : Number.MAX_SAFE_INTEGER;
}

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const update = useUpdateReminder(reminder.id);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await update.mutateAsync({ isEnabled: !reminder.isEnabled });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`card reminder-card${reminder.isEnabled ? '' : ' muted'}`}>
      <div className="reminder-card-head">
        <Link to={`/reminders/${reminder.id}`} className="reminder-title">
          {reminder.title}
        </Link>
        <StatusChip status={reminder.status} />
      </div>
      {reminder.nextLocal ? (
        <p className="reminder-when">
          <strong>{formatTime(reminder.timezone, reminder.nextLocal)}</strong>{' '}
          <span className="dim">({dayGroupKey(reminder.timezone, reminder.nextLocal)})</span>{' '}
          <span className="dim">{formatRelative(reminder.nextLocal)}</span>
        </p>
      ) : (
        <p className="dim">No upcoming call</p>
      )}
      <p className="reminder-foot">
        <span>{repeatLabel(reminder.repeatRule)}</span>
        <span className="dot" aria-hidden="true" />
        <span>{reminder.phoneNumber?.e164 ?? 'No phone'}</span>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void toggle()}>
          {reminder.isEnabled ? 'Pause' : 'Resume'}
        </button>
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const me = useMe();
  const reminders = useReminders();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => {
    const all = [...(reminders.data ?? [])];
    const filtered = filter === 'upcoming' ? all.filter((r) => r.isEnabled && isUpcoming(r)) : all;
    return filtered.sort((a, b) => sortKey(a) - sortKey(b));
  }, [reminders.data, filter]);

  const error = me.error?.message || reminders.error?.message || '';

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Reminders</h1>
          <p className="dim">{me.data ? `Welcome, ${me.data.email}.` : 'Your scheduled call reminders.'}</p>
        </div>
        <Link to="/reminders/new" className="btn btn-primary">
          New reminder
        </Link>
      </div>

      <ErrorBanner message={error} />

      <div className="seg" role="tablist" aria-label="Filter reminders">
        {(
          [
            ['all', 'All'],
            ['upcoming', 'Upcoming']
          ] as Array<[Filter, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`seg-btn${filter === key ? ' active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {reminders.isLoading ? (
        <Spinner label="Loading reminders…" />
      ) : visible.length === 0 ? (
        <EmptyState
          title={filter === 'upcoming' ? 'No upcoming reminders' : 'No reminders yet'}
          hint="Schedule a phone call to be reminded about anything."
          action={
            <Link to="/reminders/new" className="btn btn-primary">
              Create your first reminder
            </Link>
          }
        />
      ) : (
        <div className="list">
          {visible.map((r) => (
            <ReminderCard key={r.id} reminder={r} />
          ))}
        </div>
      )}
    </section>
  );
}