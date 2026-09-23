import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useReminder, useUpdateReminder, type ReminderInputBody } from '../hooks/queries';
import { toLocalInputValue } from '../lib/format';
import ReminderForm, { type ReminderFormInitial } from '../components/ReminderForm';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { SubscribePrompt } from '../components/SubscribePrompt';
import { ApiError } from '../lib/api';

export default function ReminderEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const reminder = useReminder(id);
  const update = useUpdateReminder(id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

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
  const initial: ReminderFormInitial = {
    title: r.title,
    message: r.message,
    timezone: r.timezone,
    localDateTime: toLocalInputValue(r.scheduledAt, r.timezone),
    repeatRule: r.repeatRule,
    phoneNumberId: r.phoneNumber?.id ?? ''
  };

  async function onSubmit(body: ReminderInputBody) {
    setBusy(true);
    setError('');
    try {
      await update.mutateAsync(body);
      navigate(`/reminders/${r.id}`, { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUBSCRIPTION_REQUIRED') {
        setSubscriptionRequired(true);
      } else {
        setError(e instanceof Error ? e.message : 'Could not update reminder');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-narrow">
      <div className="page-head">
        <div>
          <h1>Edit reminder</h1>
          <p className="dim">{r.title}</p>
        </div>
      </div>
      {subscriptionRequired ? (
        <SubscribePrompt />
      ) : (
        <ReminderForm initial={initial} submitLabel="Save changes" busy={busy} error={error} onSubmit={onSubmit} />
      )}
    </section>
  );
}