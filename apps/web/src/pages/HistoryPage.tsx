import { Link } from 'react-router-dom';
import { useCalls } from '../hooks/queries';
import { formatDateTimeLocal } from '../lib/format';
import { StatusChip } from '../components/StatusChip';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';

export default function HistoryPage() {
  const calls = useCalls();

  if (calls.isLoading) {
    return (
      <section>
        <Spinner label="Loading call history…" />
      </section>
    );
  }

  if (calls.isError) {
    return (
      <section>
        <h1>Call history</h1>
        <ErrorBanner message={calls.error?.message ?? 'Could not load call history'} />
      </section>
    );
  }

  const attempts = calls.data?.pages.flatMap((p) => p.attempts) ?? [];

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Call history</h1>
          <p className="dim">Every call attempt and its result.</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <EmptyState title="No calls yet" hint="Call attempts will appear here once reminders fire." />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Reminder</th>
                <th>Number</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <StatusChip status={a.status} />
                  </td>
                  <td>{a.reminderId ? <Link to={`/reminders/${a.reminderId}`}>{a.reminderTitle ?? a.reminderId}</Link> : '—'}</td>
                  <td className="mono">{a.destinationE164 ?? '—'}</td>
                  <td>{formatDateTimeLocal(a.startedAt)}</td>
                  <td>{a.endedAt ? formatDateTimeLocal(a.endedAt) : '—'}</td>
                  <td className="dim">{a.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {calls.hasNextPage ? (
            <div className="pager">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={calls.isFetchingNextPage}
                onClick={() => void calls.fetchNextPage()}
              >
                {calls.isFetchingNextPage ? <Spinner /> : 'Load more'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}