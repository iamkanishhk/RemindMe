import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeleteReminder, useReminder, useUpdateReminder } from '../hooks/queries';
import { formatDateTimeLocal, formatRelative, formatTime, repeatLabel } from '../lib/format';
import { elapsed } from '../lib/format';
import { StatusChip } from '../components/StatusChip';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';

export default function ReminderDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const reminder = useReminder(id);
  const update = useUpdateReminder(id);
  const remove = useDeleteReminder();
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState('');

  if (reminder.isLoading) {
    return (
      <section className="page-narrow">
        <Spinner label="Loading reminder…" />
      </section>
    );
  }

  if (reminder.error || !reminder.data) {
    return (
      <section className="page-narrow">
        <ErrorBanner message={reminder.error?.message ?? 'Reminder not found'} />
        <Link to="/">Back to reminders</Link>
      </section>
    );
  }

  const r = reminder.data;

  async function toggle() {
    setBusy(true);
    setError('');
    try {
      await update.mutateAsync({ isEnabled: !r.isEnabled });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update reminder');
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    setError('');
    try {
      await remove.mutateAsync(r.id);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete reminder');
      setBusy(false);
    }
  }

  return (
    <section className="page-narrow">
      <div className="page-head">
        <div>
          <Link to="/" className="back-link">
            ← Reminders
          </Link>
          <h1>{r.title}</h1>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void toggle()}>
            {r.isEnabled ? 'Pause' : 'Resume'}
          </button>
          <Link to={`/reminders/${r.id}/edit`} className="btn btn-ghost">
            Edit
          </Link>
          {confirmingDelete ? (
            <button type="button" className="btn btn-danger" disabled={busy} onClick={() => void doDelete()}>
              Confirm delete
            </button>
          ) : (
            <button type="button" className="btn btn-danger-outline" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          )}
        </div>
      </div>

      <ErrorBanner message={error} />

      <dl className="detail-grid">
        <div>
          <dt>Status</dt>
          <dd>
            <StatusChip status={r.status} />
          </dd>
        </div>
        <div>
          <dt>Message</dt>
          <dd>{r.message}</dd>
        </div>
        <div>
          <dt>Next call</dt>
          <dd>
            {r.nextLocal ? (
              <>
                {formatTime(r.timezone, r.nextLocal)} <span className="dim">({formatDateTimeLocal(r.nextLocal)})</span>
                <br />
                <span className="dim">{formatRelative(r.nextLocal)}</span>
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt>Repeats</dt>
          <dd>{repeatLabel(r.repeatRule)}</dd>
        </div>
        <div>
          <dt>Timezone</dt>
          <dd>{r.timezone}</dd>
        </div>
        <div>
          <dt>Calls</dt>
          <dd>{r.phoneNumber?.e164 ?? '—'}</dd>
        </div>
        <div>
          <dt>Last call</dt>
          <dd>{r.lastCallAt ? formatDateTimeLocal(r.lastCallAt) : 'Never'}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDateTimeLocal(r.createdAt)}</dd>
        </div>
      </dl>

      <h2 className="subsection">Call history</h2>
      {r.attempts.length === 0 ? (
        <EmptyState title="No calls yet" hint="Results of each attempted call will appear here." />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Started</th>
              <th>Ended</th>
              <th>Duration</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {r.attempts.map((a) => {
              const start = new Date(a.startedAt).getTime();
              const end = a.endedAt ? new Date(a.endedAt).getTime() : null;
              return (
                <tr key={a.id}>
                  <td>
                    <StatusChip status={a.status} />
                  </td>
                  <td>{formatDateTimeLocal(a.startedAt)}</td>
                  <td>{a.endedAt ? formatDateTimeLocal(a.endedAt) : '—'}</td>
                  <td>{end !== null ? elapsed(Math.max(0, end - start)) : '—'}</td>
                  <td className="dim">{a.detail ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}